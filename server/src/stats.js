import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '../data/stats.json');
const VISITORS_DB_PATH = path.join(__dirname, '../data/visitors.json');
const CONTACTS_PATH = path.join(__dirname, '../data/contacts.json');

// Interface for Stats
// {
//   visitors: number, // UV (Unique Visitors)
//   pv: number,       // PV (Page Views)
//   messages: number,
//   emails: number,
//   followers: number,
//   activeUsers: number
// }

let stats = {
  visitors: 1200,
  pv: 5000, // Initial base value for PV
  messages: 85,
  emails: 42,
  followers: 320,
  activeUsers: 0
};

// Set to track unique device IDs
let uniqueVisitors = new Set();

// Queue for writing to file to avoid race conditions (simple version)
let isWriting = false;
let needsWrite = false;

// Load unique visitors from file
const loadVisitors = async () => {
  try {
    const data = await fs.readFile(VISITORS_DB_PATH, 'utf-8');
    const visitorsList = JSON.parse(data);
    uniqueVisitors = new Set(visitorsList);
    // Sync stats.visitors with actual unique count if needed, or just trust the stats file
    // For now, let's max them to be safe, or just rely on stats.visitors as the source of truth for display
    // but use the Set for deduplication.
    if (uniqueVisitors.size > stats.visitors) {
      stats.visitors = uniqueVisitors.size;
    }
  } catch (error) {
    // If file doesn't exist, start empty
    console.log('Visitors file not found, creating new one.');
    await saveVisitors();
  }
};

// Save unique visitors to file
const saveVisitors = async () => {
  try {
    await fs.mkdir(path.dirname(VISITORS_DB_PATH), { recursive: true });
    await fs.writeFile(VISITORS_DB_PATH, JSON.stringify([...uniqueVisitors], null, 2));
  } catch (error) {
    console.error('Error saving visitors:', error);
  }
};

// Load stats from file
export const loadStats = async () => {
  try {
    const data = await fs.readFile(DB_PATH, 'utf-8');
    const loadedStats = JSON.parse(data);
    stats = { ...stats, ...loadedStats };

    // Ensure PV is initialized
    if (typeof stats.pv === 'undefined') {
      stats.pv = stats.visitors * 3; // Rough estimate for backward compatibility
    }

    await loadVisitors();
  } catch (error) {
    // If file doesn't exist, we start with default
    console.log('Stats file not found, creating new one.');
    await saveStats();
    await saveVisitors();
  }
  return stats;
};

// Save stats to file
export const saveStats = async () => {
  if (isWriting) {
    needsWrite = true;
    return;
  }
  isWriting = true;
  try {
    await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
    await fs.writeFile(DB_PATH, JSON.stringify(stats, null, 2));
    isWriting = false;
    if (needsWrite) {
      needsWrite = false;
      saveStats();
    }
  } catch (error) {
    console.error('Error saving stats:', error);
    isWriting = false;
  }
};

// Save contact info
export const saveContact = async (contact) => {
  try {
    await fs.mkdir(path.dirname(CONTACTS_PATH), { recursive: true });
    let contacts = [];
    try {
      const data = await fs.readFile(CONTACTS_PATH, 'utf-8');
      contacts = JSON.parse(data);
    } catch (e) {
      // ignore
    }
    contacts.push({ ...contact, timestamp: new Date().toISOString() });
    await fs.writeFile(CONTACTS_PATH, JSON.stringify(contacts, null, 2));

    // Update stats
    stats.emails++;
    await saveStats();
    return true;
  } catch (error) {
    console.error('Error saving contact:', error);
    return false;
  }
};

export const getStats = () => stats;

export const incrementStat = async (key) => {
  if (stats[key] !== undefined) {
    stats[key]++;
    await saveStats();
    return stats;
  }
  return stats;
};

// Record a visit (PV) and check for unique visitor (UV)
export const recordVisit = async (deviceId) => {
  // Always increment PV
  stats.pv++;

  if (deviceId) {
    // specific device tracking for UV
    if (!uniqueVisitors.has(deviceId)) {
      uniqueVisitors.add(deviceId);
      stats.visitors++;
      saveVisitors(); // Fire and forget
    }
  } else {
    // Fallback if no deviceId provided, maybe just count as UV? 
    // Or do nothing for UV to avoid inflation.
    // Let's assume we always want to track generic visitors if no ID,
    // but for now, rely on deviceId for accuracy.
    // incrementStat('visitors'); 
  }

  await saveStats();
  return stats;
};

export const updateActiveUsers = (count) => {
  stats.activeUsers = count;
};
