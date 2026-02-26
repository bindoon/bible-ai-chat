import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOPICS_PATH = path.join(__dirname, '../data/topics.json');

// Topics structure
// {
//   topics: [
//     { id: string, text: string, likes: number, timestamp: string }
//   ]
// }

let topicsData = {
  topics: [
    { id: '1', text: '我是要做样——位信徒，但是收了XXX我需要爱谅解人相爱，这违背了我诺言の吗？',likes: 3441 },
    { id: '2', text: '面对XXX 我是需要爱谅解人相爱，经常会忘记吗，然后情绪就恨恨不可能。', likes: 3229 },
    { id: '3', text: '我对过去别人的语言伤害，一直难以忘记吗，然后情绪投加对疼爱和感和很...', likes: 3229 }
  ]
};

// Queue for writing to file to avoid race conditions
let isWriting = false;
let needsWrite = false;

// Load topics from file
export const loadTopics = async () => {
  try {
    const data = await fs.readFile(TOPICS_PATH, 'utf-8');
    const loaded = JSON.parse(data);
    topicsData = { ...topicsData, ...loaded };
  } catch (error) {
    console.log('Topics file not found, creating new one.');
    await saveTopics();
  }
  return topicsData;
};

// Save topics to file
export const saveTopics = async () => {
  if (isWriting) {
    needsWrite = true;
    return;
  }
  isWriting = true;
  try {
    await fs.mkdir(path.dirname(TOPICS_PATH), { recursive: true });
    await fs.writeFile(TOPICS_PATH, JSON.stringify(topicsData, null, 2));
    isWriting = false;
    if (needsWrite) {
      needsWrite = false;
      saveTopics();
    }
  } catch (error) {
    console.error('Error saving topics:', error);
    isWriting = false;
  }
};

export const getTopics = () => topicsData;

// Add a new topic
export const addTopic = async (text) => {
  const newTopic = {
    id: crypto.randomUUID(),
    text,
    likes: 0,
    timestamp: new Date().toISOString()
  };
  topicsData.topics.unshift(newTopic);

  // Sort by likes (descending)
  topicsData.topics.sort((a, b) => b.likes - a.likes);

  await saveTopics();
  return topicsData;
};

// Like a topic
export const likeTopic = async (topicId) => {
  const topic = topicsData.topics.find(t => t.id === topicId);
  if (topic) {
    topic.likes++;

    // Re-sort by likes
    topicsData.topics.sort((a, b) => b.likes - a.likes);

    await saveTopics();
  }
  return topicsData;
};
