import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '../data/stats.json');
const CONTACTS_PATH = path.join(__dirname, '../data/contacts.json');

// Interface for Stats
// {
//   visitors: number,
//   messages: number,
//   emails: number,
//   followers: number,
//   activeUsers: number
// }

let stats = {
  visitors: 1240,
  messages: 85,
  emails: 42,
  followers: 320,
  activeUsers: 0
};

// Queue for writing to file to avoid race conditions (simple version)
let isWriting = false;
let needsWrite = false;

// Load stats from file
export const loadStats = async () => {
  try {
    const data = await fs.readFile(DB_PATH, 'utf-8');
    stats = { ...stats, ...JSON.parse(data) };
  } catch (error) {
    // If file doesn't exist, we start with default
    console.log('Stats file not found, creating new one.');
    await saveStats();
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
    // Randomly adding "active users" fluctuation for visual effect if requested, 
    // but here we strictly increment counters.
    await saveStats();
    return stats;
  }
  return stats;
};

export const updateActiveUsers = (count) => {
  stats.activeUsers = count;
  // We don't save activeUsers to disk typically as it's transient, 
  // but for "total visitors" logic, we might want to track cumulative.
  // For now, simple update.
};
