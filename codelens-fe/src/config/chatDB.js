import { openDB } from 'idb';
import { v4 as uuidv4 } from 'uuid';

const DB_NAME = 'chatDB';
const CHAT_STORE = 'chats';

export const initDB = async () => {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(CHAT_STORE)) {
        db.createObjectStore(CHAT_STORE, { keyPath: 'id' });
      }
    }
  });
};

// ✅ Create new chat thread
export const createChat = async (title = '') => {
  const db = await initDB();
  const allChats = await db.getAll(CHAT_STORE);
  const newId = uuidv4();
  const newChat = {
    id: newId,
    title: title || `New Chat`,
    createdAt: Date.now(),
    messages: [],
  };
  await db.add(CHAT_STORE, newChat);
  return newChat;
};

// ✅ Get all chat threads
export const getAllChats = async () => {
  const db = await initDB();
  const chats = await db.getAll(CHAT_STORE);
  // Sort by most recent
  return chats.sort((a, b) => b.createdAt - a.createdAt);
};

// ✅ Get one chat by ID
export const getChatById = async (id) => {
  const db = await initDB();
  return await db.get(CHAT_STORE, id);
};

// ✅ Update chat messages
export const updateChatMessages = async (id, messages) => {
  const db = await initDB();
  const chat = await db.get(CHAT_STORE, id);
  if (!chat) return;
  chat.messages = messages;
  await db.put(CHAT_STORE, chat);
};

// ✅ Optional: Rename chat (future)
export const renameChat = async (id, newTitle) => {
  const db = await initDB();
  const chat = await db.get(CHAT_STORE, id);
  if (!chat) return;
  chat.title = newTitle;
  await db.put(CHAT_STORE, chat);
};

// ✅ Optional: Delete chat (future)
export const deleteChat = async (id) => {
  const db = await initDB();
  await db.delete(CHAT_STORE, id);
};
