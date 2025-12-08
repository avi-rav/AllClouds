import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, from, throwError } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';

export interface Contact {
  id: number;
  name: string;
  fullAddress: string;
  email: string;
  phone?: string;
  cell?: string;
  registrationDate: Date;
  age?: number;
  image?: string;
}

interface PendingOperation {
  id: string;
  type: 'create' | 'update' | 'delete' | 'upload';
  contact?: Contact;
  contactId?: number;
  formData?: any;
  timestamp: number;
}

@Injectable({
  providedIn: 'root'
})
export class ContactService {
  private apiUrl = 'http://localhost:3000/contacts';
  private readonly CONTACTS_KEY = 'contacts_cache';
  private readonly PENDING_OPS_KEY = 'pending_operations';
  private readonly LAST_SYNC_KEY = 'last_sync_timestamp';
  private isOnline: boolean = navigator.onLine;

  constructor(private http: HttpClient) {
    // Monitor online/offline status
    window.addEventListener('online', () => {
      this.isOnline = true;
      console.log('App is online - syncing pending operations');
      this.syncPendingOperations();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      console.log('App is offline');
    });

    // Initial sync if online
    if (this.isOnline) {
      this.syncPendingOperations();
    }
  }

  // Get all contacts
  getContacts(): Observable<Contact[]> {
    console.log('Fetching contacts - Online:', this.isOnline);
    
    if (this.isOnline) {
      return this.http.get<Contact[]>(this.apiUrl).pipe(
        tap(contacts => {
          this.saveToCache(contacts);
          console.log('Contacts fetched from API and cached');
        }),
        catchError(error => {
          console.error('Error fetching from API, loading from cache', error);
          return of(this.getFromCache());
        })
      );
    } else {
      return of(this.getFromCache());
    }
  }

  // Get a single contact
  getContact(id: number): Observable<Contact> {
    const cachedContacts = this.getFromCache();
    const contact = cachedContacts.find(c => c.id === id);

    if (this.isOnline) {
      return this.http.get<Contact>(`${this.apiUrl}/${id}`).pipe(
        tap(fetchedContact => {
          // Update cache with fresh data
          const updatedCache = cachedContacts.map(c => 
            c.id === id ? fetchedContact : c
          );
          this.saveToCache(updatedCache);
        }),
        catchError(error => {
          console.error('Error fetching contact from API, using cache', error);
          return contact ? of(contact) : throwError(() => error);
        })
      );
    } else {
      return contact ? of(contact) : throwError(() => new Error('Contact not found in cache'));
    }
  }

  // Create a new contact
  createContact(contact: Contact): Observable<Contact> {
    const tempId = Date.now(); // Temporary ID for offline mode
    const newContact = { ...contact, id: tempId };

    if (this.isOnline) {
      return this.http.post<Contact>(this.apiUrl, contact).pipe(
        tap(createdContact => {
          const cachedContacts = this.getFromCache();
          this.saveToCache([...cachedContacts, createdContact]);
        }),
        catchError(error => {
          console.error('Error creating contact online, saving offline', error);
          return this.createOffline(newContact);
        })
      );
    } else {
      return this.createOffline(newContact);
    }
  }

  private createOffline(contact: Contact): Observable<Contact> {
    // Add to cache
    const cachedContacts = this.getFromCache();
    this.saveToCache([...cachedContacts, contact]);

    // Add to pending operations
    this.addPendingOperation({
      id: `create_${contact.id}`,
      type: 'create',
      contact: contact,
      timestamp: Date.now()
    });

    return of(contact);
  }

  // Update a contact
  updateContact(id: number, contact: Contact): Observable<Contact> {
    if (this.isOnline) {
      return this.http.put<Contact>(`${this.apiUrl}/${id}`, contact).pipe(
        tap(updatedContact => {
          const cachedContacts = this.getFromCache();
          const updatedCache = cachedContacts.map(c => 
            c.id === id ? updatedContact : c
          );
          this.saveToCache(updatedCache);
        }),
        catchError(error => {
          console.error('Error updating contact online, saving offline', error);
          return this.updateOffline(id, contact);
        })
      );
    } else {
      return this.updateOffline(id, contact);
    }
  }

  private updateOffline(id: number, contact: Contact): Observable<Contact> {
    // Update cache
    const cachedContacts = this.getFromCache();
    const updatedCache = cachedContacts.map(c => 
      c.id === id ? { ...contact, id } : c
    );
    this.saveToCache(updatedCache);

    // Add to pending operations
    this.addPendingOperation({
      id: `update_${id}_${Date.now()}`,
      type: 'update',
      contact: { ...contact, id },
      contactId: id,
      timestamp: Date.now()
    });

    return of({ ...contact, id });
  }

  // Delete a contact
  deleteContact(id: number): Observable<any> {
    if (this.isOnline) {
      return this.http.delete(`${this.apiUrl}/${id}`).pipe(
        tap(() => {
          const cachedContacts = this.getFromCache();
          const updatedCache = cachedContacts.filter(c => c.id !== id);
          this.saveToCache(updatedCache);
        }),
        catchError(error => {
          console.error('Error deleting contact online, saving offline', error);
          return this.deleteOffline(id);
        })
      );
    } else {
      return this.deleteOffline(id);
    }
  }

  private deleteOffline(id: number): Observable<any> {
    // Remove from cache
    const cachedContacts = this.getFromCache();
    const updatedCache = cachedContacts.filter(c => c.id !== id);
    this.saveToCache(updatedCache);

    // Add to pending operations
    this.addPendingOperation({
      id: `delete_${id}`,
      type: 'delete',
      contactId: id,
      timestamp: Date.now()
    });

    return of({ success: true });
  }

  // Upload image
  uploadImage(contactId: number, formData: FormData): Observable<any> {
    if (this.isOnline) {
      return this.http.post(`${this.apiUrl}/${contactId}/upload-image`, formData).pipe(
        tap((response: any) => {
          // Update cache with new image path
          const cachedContacts = this.getFromCache();
          const updatedCache = cachedContacts.map(c => 
            c.id === contactId ? { ...c, image: response.path } : c
          );
          this.saveToCache(updatedCache);
        }),
        catchError(error => {
          console.error('Error uploading image online, saving offline', error);
          return this.uploadImageOffline(contactId, formData);
        })
      );
    } else {
      return this.uploadImageOffline(contactId, formData);
    }
  }

  private uploadImageOffline(contactId: number, formData: FormData): Observable<any> {
    // Store formData info (convert to storable format)
    const file = formData.get('image') as File;
    
    // Create a reader to convert file to base64
    return from(this.fileToBase64(file)).pipe(
      switchMap(base64 => {
        // Add to pending operations
        this.addPendingOperation({
          id: `upload_${contactId}_${Date.now()}`,
          type: 'upload',
          contactId: contactId,
          formData: base64,
          timestamp: Date.now()
        });

        // Update cache with temporary preview
        const cachedContacts = this.getFromCache();
        const updatedCache = cachedContacts.map(c => 
          c.id === contactId ? { ...c, image: base64 as string } : c
        );
        this.saveToCache(updatedCache);

        return of({ path: base64, pending: true });
      })
    );
  }

  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  generateRandomContacts(count: number): Observable<any> {
    let countitems = count || 10;
    if (this.isOnline) {
      return this.http.post(`${this.apiUrl}/generate?count=${countitems}`, {}).pipe(
        tap(() => {
          // Refresh cache after generation
          this.http.get<Contact[]>(this.apiUrl).subscribe(contacts => {
            this.saveToCache(contacts);
          });
        })
      );
    } else {
      return throwError(() => new Error('Cannot generate contacts in offline mode'));
    }
  }

  // Cache management
  private getFromCache(): Contact[] {
    const cached = localStorage.getItem(this.CONTACTS_KEY);
    return cached ? JSON.parse(cached) : [];
  }

  private saveToCache(contacts: Contact[]): void {
    localStorage.setItem(this.CONTACTS_KEY, JSON.stringify(contacts));
  }

  // Pending operations management
  private getPendingOperations(): PendingOperation[] {
    const pending = localStorage.getItem(this.PENDING_OPS_KEY);
    return pending ? JSON.parse(pending) : [];
  }

  private savePendingOperations(operations: PendingOperation[]): void {
    localStorage.setItem(this.PENDING_OPS_KEY, JSON.stringify(operations));
  }

  private addPendingOperation(operation: PendingOperation): void {
    const operations = this.getPendingOperations();
    operations.push(operation);
    this.savePendingOperations(operations);
    console.log('Added pending operation:', operation.type);
  }

  // Sync pending operations when back online
  syncPendingOperations(): void {
    if (!this.isOnline) {
      console.log('Cannot sync - offline');
      return;
    }

    const operations = this.getPendingOperations();
    if (operations.length === 0) {
      console.log('No pending operations to sync');
      return;
    }

    console.log(`Syncing ${operations.length} pending operations`);

    // Sort by timestamp to maintain order
    operations.sort((a, b) => a.timestamp - b.timestamp);

    const syncPromises = operations.map(op => this.executePendingOperation(op));

    Promise.all(syncPromises).then(() => {
      console.log('All operations synced successfully');
      this.savePendingOperations([]);
      localStorage.setItem(this.LAST_SYNC_KEY, Date.now().toString());
      
      // Refresh cache from server
      this.http.get<Contact[]>(this.apiUrl).subscribe(contacts => {
        this.saveToCache(contacts);
      });
    }).catch(error => {
      console.error('Error syncing operations:', error);
    });
  }

  private executePendingOperation(operation: PendingOperation): Promise<any> {
    console.log('Executing pending operation:', operation.type);

    switch (operation.type) {
      case 'create':
        return this.http.post(this.apiUrl, operation.contact).toPromise();
      
      case 'update':
        return this.http.put(`${this.apiUrl}/${operation.contactId}`, operation.contact).toPromise();
      
      case 'delete':
        return this.http.delete(`${this.apiUrl}/${operation.contactId}`).toPromise();
      
      case 'upload':
        // Convert base64 back to FormData
        return fetch(operation.formData as string)
          .then(res => res.blob())
          .then(blob => {
            const formData = new FormData();
            formData.append('image', blob, 'image.jpg');
            return this.http.post(`${this.apiUrl}/${operation.contactId}/upload-image`, formData).toPromise();
          });
      
      default:
        return Promise.resolve();
    }
  }

  // Get sync status
  getSyncStatus(): { hasPending: boolean; count: number; lastSync: Date | null } {
    const operations = this.getPendingOperations();
    const lastSyncStr = localStorage.getItem(this.LAST_SYNC_KEY);
    
    return {
      hasPending: operations.length > 0,
      count: operations.length,
      lastSync: lastSyncStr ? new Date(parseInt(lastSyncStr)) : null
    };
  }

  // Check if online
  isAppOnline(): boolean {
    return this.isOnline;
  }
}