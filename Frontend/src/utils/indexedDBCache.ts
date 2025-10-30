// src/utils/indexedDBCache.ts
const DB_NAME = 'ChopinPlayCache';
const STORE_NAME = 'sections';
const DB_VERSION = 1;

interface CacheData {
  sheetId: number;
  metadata: any;
  timestamp: number;
  measuresPerSection: number;
  sectionsCount: number;
}

class IndexedDBCache {
  private dbPromise: Promise<IDBDatabase>;

  constructor() {
    this.dbPromise = this.initDB();
  }

  private initDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'sheetId' });
        }
      };
    });
  }

  async saveSections(sheetId: number, metadata: any): Promise<void> {
    try {
      const db = await this.dbPromise;
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      const data: CacheData = {
        sheetId,
        metadata,
        timestamp: Date.now(),
        measuresPerSection: metadata.measures_per_section,
        sectionsCount: metadata.total_sections,
      };

      await new Promise<void>((resolve, reject) => {
        const request = store.put(data);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });

      console.log(`✅ ${metadata.total_sections} secciones guardadas en IndexedDB para sheet ${sheetId}`);
    } catch (error) {
      console.error('❌ Error guardando en IndexedDB:', error);
      throw error;
    }
  }

  async getSections(sheetId: number): Promise<CacheData | null> {
    try {
      const db = await this.dbPromise;
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);

      const data = await new Promise<CacheData | undefined>((resolve, reject) => {
        const request = store.get(sheetId);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      if (data) {
        console.log(`✅ ${data.sectionsCount} secciones recuperadas de IndexedDB para sheet ${sheetId}`);
        return data;
      }

      return null;
    } catch (error) {
      console.error('❌ Error leyendo de IndexedDB:', error);
      return null;
    }
  }

  async deleteSections(sheetId: number): Promise<void> {
    try {
      const db = await this.dbPromise;
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      await new Promise<void>((resolve, reject) => {
        const request = store.delete(sheetId);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });

      console.log(`✅ Secciones eliminadas de IndexedDB para sheet ${sheetId}`);
    } catch (error) {
      console.error('❌ Error eliminando de IndexedDB:', error);
      throw error;
    }
  }

  async clearAll(): Promise<void> {
    try {
      const db = await this.dbPromise;
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      await new Promise<void>((resolve, reject) => {
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });

      console.log('✅ Cache de IndexedDB limpiado completamente');
    } catch (error) {
      console.error('❌ Error limpiando IndexedDB:', error);
      throw error;
    }
  }
}

export const indexedDBCache = new IndexedDBCache();