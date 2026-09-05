import type { Phase1Result } from '@/types/case';

const DB_NAME = 'case-coach';
const DB_VERSION = 1;
const STORE_NAME = 'cases';

interface CaseRecord {
  caseId: string;
  phase1: Phase1Result;
  pdfBlob: Blob;
  createdAt: number;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error ?? new Error('Failed to open IndexedDB'));
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'caseId' });
      }
    };
  });
}

export async function saveCase(
  caseId: string,
  data: { phase1: Phase1Result; pdfBlob: Blob }
): Promise<void> {
  const db = await openDb();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const record: CaseRecord = {
      caseId,
      phase1: data.phase1,
      pdfBlob: data.pdfBlob,
      createdAt: Date.now(),
    };

    const request = store.put(record);
    request.onerror = () => reject(request.error ?? new Error('Failed to save case'));
    request.onsuccess = () => resolve();
    transaction.oncomplete = () => db.close();
    transaction.onerror = () => reject(transaction.error ?? new Error('Transaction failed'));
  });
}

export async function loadCase(
  caseId: string
): Promise<{ phase1: Phase1Result; pdfBlob: Blob } | null> {
  const db = await openDb();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(caseId);

    request.onerror = () => reject(request.error ?? new Error('Failed to load case'));
    request.onsuccess = () => {
      const record = request.result as CaseRecord | undefined;
      if (!record) {
        resolve(null);
        return;
      }
      resolve({ phase1: record.phase1, pdfBlob: record.pdfBlob });
    };
    transaction.oncomplete = () => db.close();
    transaction.onerror = () => reject(transaction.error ?? new Error('Transaction failed'));
  });
}

export async function deleteCase(caseId: string): Promise<void> {
  const db = await openDb();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(caseId);

    request.onerror = () => reject(request.error ?? new Error('Failed to delete case'));
    request.onsuccess = () => resolve();
    transaction.oncomplete = () => db.close();
    transaction.onerror = () => reject(transaction.error ?? new Error('Transaction failed'));
  });
}
