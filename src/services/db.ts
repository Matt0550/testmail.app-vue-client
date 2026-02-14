
import { openDB } from 'idb';
import type { TestMailEmail } from '@models/mail';

const DB_NAME = 'testmail_db';
const STORE_NAME = 'emails';
const DB_VERSION = 1;

export async function initDB(): Promise<any> {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db: any) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    },
  });
}

export async function saveEmailsToDB(emails: TestMailEmail[]) {
  const db = await initDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  
  for (const email of emails) {
    const existing = await store.get(email.id);
    // Preserving the read status if it already exists locally
    await store.put({ 
      ...email, 
      read: existing ? existing.read : false 
    });
  }
  await tx.done;
}

export async function markAsReadInDB(id: string) {
  const db = await initDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  const email = await store.get(id);
  if (email) {
    email.read = true;
    await store.put(email);
  }
  await tx.done;
}

export async function getAllEmailsFromDB(): Promise<TestMailEmail[]> {
  const db = await initDB();
  const emails = await db.getAll(STORE_NAME);
  return emails.sort((a: { timestamp: number; }, b: { timestamp: number; }) => b.timestamp - a.timestamp);
}

export async function clearEmailsDB() {
  const db = await initDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  await tx.objectStore(STORE_NAME).clear();
  await tx.done;
}

export async function deleteEmailFromDB(id: string) {
  const db = await initDB();
  await db.delete(STORE_NAME, id);
}
