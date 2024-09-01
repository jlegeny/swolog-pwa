export class IDB {
  private db: IDBDatabase | undefined;

  private async open() {
    return new Promise<void>((resolve, reject) => {
      if (this.db) {
        return Promise.resolve();
      }
      const request = indexedDB.open("SwologDB", 1);
      request.onerror = () => {
        reject("Error opening database.");
      };
      request.onsuccess = (event) => {
        this.db = (event?.target as IDBOpenDBRequest)?.result;
        console.debug("Opened database");
        resolve();
      };
      request.onupgradeneeded = (event) => {
        const db = (event?.target as IDBRequest)?.result;

        if (!db) {
          reject("Error opening database.");
          return;
        }

        db.onerror = (event: unknown) => {
          console.error(event);
          reject("Error opening database.");
        };

        // Create an objectStore for this database
        const objectStore = db.createObjectStore("Log", {
          keyPath: "id",
        });

        objectStore.createIndex("id", "id", { unique: true });
        console.debug("Created database");
      };
    });
  }

  async selectAll<T>(storeName: string): Promise<T[]> {
    if (!this.db) {
      try {
        await this.open();
      } catch (e: unknown) {
        console.error("Error opening database.");
        return Promise.reject(e);
      }
    }
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, "readonly");
      const objectStore = transaction.objectStore(storeName);
      const request = objectStore.openCursor();
      const entries: T[] = [];

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          entries.push(cursor.value);
          cursor.continue();
        } else {
          resolve(entries);
        }
      };

      request.onerror = (event) => {
        console.error(event);
        reject((event.target as IDBRequest).error);
      };
    });
  }

  async selectById<T>(
    storeName: string,
    id: IDBValidKey
  ): Promise<T | undefined> {
    if (!this.db) {
      try {
        await this.open();
      } catch (e: unknown) {
        console.error("Error opening database.");
        return Promise.reject(e);
      }
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, "readonly");
      const objectStore = transaction.objectStore(storeName);
      const request = objectStore.get(id);

      request.onsuccess = (event) => {
        const result = (event.target as IDBRequest).result;
        resolve(result as T | undefined);
      };

      request.onerror = (event) => {
        reject((event.target as IDBRequest).error);
      };
    });
  }

  async insert<T>(storeName: string, entry: T): Promise<void> {
    if (!this.db) {
      try {
        await this.open();
      } catch (e: unknown) {
        console.error("Error opening database.");
        return Promise.reject(e);
      }
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, "readwrite");
      const objectStore = transaction.objectStore(storeName);
      const request = objectStore.add(entry);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = (event) => {
        reject((event.target as IDBRequest).error);
      };
    });
  }

  async insertOrUpdate<T>(storeName: string, entry: T): Promise<void> {
    if (!this.db) {
      try {
        await this.open();
      } catch (e: unknown) {
        console.error("Error opening database.");
        return Promise.reject(e);
      }
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, "readwrite");
      const objectStore = transaction.objectStore(storeName);
      const request = objectStore.put(entry);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = (event) => {
        reject((event.target as IDBRequest).error);
      };
    });
  }
}
