import { Injectable } from '@angular/core';
import { Contact } from './contact.service';

interface PendingOperation {
  id: string;
  type: 'create_new' | 'create' | 'update' | 'delete' | 'upload';
  contact?: Contact;
  contactId?: number;
  formData?: any;
  timestamp: number;
}

@Injectable({
  providedIn: 'root'
})
export class IndexedDBService {
  private dbName = 'ContactsDB';
  private version = 1;
  private db: IDBDatabase | null = null;

  constructor() {
    this.initDB();
  }

  // Initialize IndexedDB
  private async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        console.error('IndexedDB failed to open');
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('IndexedDB opened successfully');
        resolve();
      };

      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;

        // Create contacts store
        if (!db.objectStoreNames.contains('contacts')) {
          const contactStore = db.createObjectStore('contacts', { keyPath: 'id' });
          contactStore.createIndex('name', 'name', { unique: false });
          console.log('Created contacts object store');
        }

        // Create images store (for binary image data)
        if (!db.objectStoreNames.contains('images')) {
          db.createObjectStore('images', { keyPath: 'contactId' });
          console.log('Created images object store');
        }

        // Create pending operations store
        if (!db.objectStoreNames.contains('pendingOps')) {
          db.createObjectStore('pendingOps', { keyPath: 'id' });
          console.log('Created pendingOps object store');
        }

        // Create metadata store (for sync timestamp, etc.)
        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata', { keyPath: 'key' });
          console.log('Created metadata object store');
        }
      };
    });
  }

  // Ensure DB is ready
  private async ensureDB(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.initDB();
    }
    return this.db!;
  }

  // ========== CONTACTS CRUD ==========

  async getAllContacts(): Promise<Contact[]> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['contacts'], 'readonly');
      const store = transaction.objectStore('contacts');
      const request = store.getAll();

      request.onsuccess = () => {
        console.log('Retrieved', request.result.length, 'contacts from IndexedDB');
        resolve(request.result);
      };

      request.onerror = () => reject(request.error);
    });
  }

  async getContact(id: number): Promise<Contact | null> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['contacts'], 'readonly');
      const store = transaction.objectStore('contacts');
      const request = store.get(id);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => reject(request.error);
    });
  }

  async saveContact(contact: Contact): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['contacts'], 'readwrite');
      const store = transaction.objectStore('contacts');
      const request = store.put(contact);

      request.onsuccess = () => {
        console.log('Saved contact:', contact.id);
        resolve();
      };

      request.onerror = () => reject(request.error);
    });
  }

  async saveAllContacts(contacts: Contact[]): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['contacts'], 'readwrite');
      const store = transaction.objectStore('contacts');

      // Clear existing contacts first
      store.clear();

      // Add all new contacts
      contacts.forEach(contact => {
        store.put(contact);
      });

      transaction.oncomplete = () => {
        console.log('Saved', contacts.length, 'contacts to IndexedDB');
        resolve();
      };

      transaction.onerror = () => reject(transaction.error);
    });
  }

  async deleteContact(id: number): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['contacts', 'images'], 'readwrite');
      const contactStore = transaction.objectStore('contacts');
      const imageStore = transaction.objectStore('images');

      contactStore.delete(id);
      imageStore.delete(id); // Also delete associated image

      transaction.oncomplete = () => {
        console.log('Deleted contact:', id);
        resolve();
      };

      transaction.onerror = () => reject(transaction.error);
    });
  }

  // ========== IMAGES ==========

  async saveImage(contactId: number, imageBlob: Blob): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['images'], 'readwrite');
      const store = transaction.objectStore('images');
      const request = store.put({ contactId, imageBlob });

      request.onsuccess = () => {
        console.log('Saved image for contact:', contactId);
        resolve();
      };

      request.onerror = () => reject(request.error);
    });
  }

  async getImage(contactId: number): Promise<Blob | null> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['images'], 'readonly');
      const store = transaction.objectStore('images');
      const request = store.get(contactId);

      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.imageBlob : null);
      };

      request.onerror = () => reject(request.error);
    });
  }

  async deleteImage(contactId: number): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['images'], 'readwrite');
      const store = transaction.objectStore('images');
      const request = store.delete(contactId);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // ========== PENDING OPERATIONS ==========

  async getAllPendingOps(): Promise<PendingOperation[]> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['pendingOps'], 'readonly');
      const store = transaction.objectStore('pendingOps');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async addPendingOp(operation: PendingOperation): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['pendingOps'], 'readwrite');
      const store = transaction.objectStore('pendingOps');
      const request = store.put(operation);

      request.onsuccess = () => {
        console.log('Added pending operation:', operation.type);
        resolve();
      };

      request.onerror = () => reject(request.error);
    });
  }

  async clearPendingOps(): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['pendingOps'], 'readwrite');
      const store = transaction.objectStore('pendingOps');
      const request = store.clear();

      request.onsuccess = () => {
        console.log('🧹 Cleared all pending operations');
        resolve();
      };

      request.onerror = () => reject(request.error);
    });
  }

  // ========== METADATA ==========

  async setMetadata(key: string, value: any): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['metadata'], 'readwrite');
      const store = transaction.objectStore('metadata');
      const request = store.put({ key, value });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getMetadata(key: string): Promise<any> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['metadata'], 'readonly');
      const store = transaction.objectStore('metadata');
      const request = store.get(key);

      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.value : null);
      };

      request.onerror = () => reject(request.error);
    });
  }

  // ========== UTILITY ==========

  async clearAll(): Promise<void> {
    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['contacts', 'images', 'pendingOps', 'metadata'], 'readwrite');
      
      transaction.objectStore('contacts').clear();
      transaction.objectStore('images').clear();
      transaction.objectStore('pendingOps').clear();
      transaction.objectStore('metadata').clear();

      transaction.oncomplete = () => {
        console.log('🧹 Cleared all IndexedDB data');
        resolve();
      };

      transaction.onerror = () => reject(transaction.error);
    });
  }
}