import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, from, throwError } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { IndexedDBService } from './indexeddb.service';

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
  type: 'create_new' | 'create' | 'update' | 'delete' | 'upload';
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
  private isOnline: boolean = navigator.onLine;
  private isSyncing: boolean = false;

  constructor(
    private http: HttpClient,
    private indexedDB: IndexedDBService
  ) {
    // Monitor online/offline status
    window.addEventListener('online', () => {
      this.isOnline = true;
      console.log('🌐 App is online - syncing pending operations');
      this.syncPendingOperations();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      console.log('📴 App is offline');
    });

    // Initial sync if online
    if (this.isOnline) {
      this.syncPendingOperations();
    }
  }

  // ========== CONTACTS CRUD ==========

  getContacts(): Observable<Contact[]> {
    console.log('📞 getContacts called - Online:', this.isOnline);
    
    if (this.isOnline) {
      console.log('🌐 Fetching from server...');
      return this.http.get<Contact[]>(this.apiUrl).pipe(
        switchMap(contacts => {
          console.log('✅ Server returned', contacts.length, 'contacts');
          // Save to IndexedDB
          return from(this.indexedDB.saveAllContacts(contacts)).pipe(
            map(() => contacts)
          );
        }),
        catchError(error => {
          console.error('❌ Server error, loading from IndexedDB:', error);
          return from(this.indexedDB.getAllContacts());
        })
      );
    } else {
      // When offline, return data from IndexedDB
      console.log('📴 Offline - loading from IndexedDB');
      return from(this.indexedDB.getAllContacts());
    }
  }

  getContact(id: number): Observable<Contact> {
    if (this.isOnline) {
      return this.http.get<Contact>(`${this.apiUrl}/${id}`).pipe(
        switchMap(contact => {
          // Save to IndexedDB
          return from(this.indexedDB.saveContact(contact)).pipe(
            map(() => contact)
          );
        }),
        catchError(error => {
          console.error('❌ Error fetching contact from API, using IndexedDB', error);
          return from(this.indexedDB.getContact(id)).pipe(
            switchMap(cachedContact => 
              cachedContact ? of(cachedContact) : throwError(() => error)
            )
          );
        })
      );
    } else {
      return from(this.indexedDB.getContact(id)).pipe(
        switchMap(contact => 
          contact ? of(contact) : throwError(() => new Error('Contact not found in IndexedDB'))
        )
      );
    }
  }

  createContact(contact: Contact): Observable<Contact> {
    const tempId = Date.now();
    const newContact = { ...contact, id: tempId };

    if (this.isOnline) {
      return this.http.post<Contact>(this.apiUrl, contact).pipe(
        switchMap(createdContact => {
          // Save to IndexedDB
          return from(this.indexedDB.saveContact(createdContact)).pipe(
            map(() => createdContact)
          );
        }),
        catchError(error => {
          console.error('❌ Error creating contact online, saving offline', error);
          return this.createOffline(newContact);
        })
      );
    } else {
      return this.createOffline(newContact);
    }
  }

  private createOffline(contact: Contact): Observable<Contact> {
    return from(
      this.indexedDB.saveContact(contact).then(() => {
        // Add to pending operations
        return this.indexedDB.addPendingOp({
          id: `create_${contact.id}`,
          type: 'create_new',
          contact: contact,
          timestamp: Date.now()
        });
      })
    ).pipe(map(() => contact));
  }

  updateContact(id: number, contact: Contact): Observable<Contact> {
    if (this.isOnline) {
      return this.http.put<Contact>(`${this.apiUrl}/${id}`, contact).pipe(
        switchMap(updatedContact => {
          // Update in IndexedDB
          return from(this.indexedDB.saveContact(updatedContact)).pipe(
            map(() => updatedContact)
          );
        }),
        catchError(error => {
          console.error('❌ Error updating contact online, saving offline', error);
          return this.updateOffline(id, contact);
        })
      );
    } else {
      return this.updateOffline(id, contact);
    }
  }

  private updateOffline(id: number, contact: Contact): Observable<Contact> {
    const updatedContact = { ...contact, id };
    
    return from(
      this.indexedDB.saveContact(updatedContact).then(() => {
        // Add to pending operations
        return this.indexedDB.addPendingOp({
          id: `update_${id}_${Date.now()}`,
          type: 'update',
          contact: updatedContact,
          contactId: id,
          timestamp: Date.now()
        });
      })
    ).pipe(map(() => updatedContact));
  }

  deleteContact(id: number): Observable<any> {
    if (this.isOnline) {
      return this.http.delete(`${this.apiUrl}/${id}`).pipe(
        switchMap(() => {
          // Delete from IndexedDB
          return from(this.indexedDB.deleteContact(id)).pipe(
            map(() => ({ success: true }))
          );
        }),
        catchError(error => {
          console.error('❌ Error deleting contact online, saving offline', error);
          return this.deleteOffline(id);
        })
      );
    } else {
      return this.deleteOffline(id);
    }
  }

  private deleteOffline(id: number): Observable<any> {
    return from(
      this.indexedDB.deleteContact(id).then(() => {
        // Add to pending operations
        return this.indexedDB.addPendingOp({
          id: `delete_${id}`,
          type: 'delete',
          contactId: id,
          timestamp: Date.now()
        });
      })
    ).pipe(map(() => ({ success: true })));
  }

  // ========== IMAGE UPLOAD ==========

  uploadImage(contactId: number, formData: FormData): Observable<any> {
    if (this.isOnline) {
      return this.http.post(`${this.apiUrl}/${contactId}/upload-image`, formData).pipe(
        switchMap((response: any) => {
          // Save image to IndexedDB
          const file = formData.get('image') as File;
          return from(this.indexedDB.saveImage(contactId, file)).pipe(
            switchMap(() => {
              // Update contact with image path
              return from(this.indexedDB.getContact(contactId)).pipe(
                switchMap(contact => {
                  if (contact) {
                    contact.image = response.path;
                    return from(this.indexedDB.saveContact(contact)).pipe(
                      map(() => response)
                    );
                  }
                  return of(response);
                })
              );
            })
          );
        }),
        catchError(error => {
          console.error('❌ Error uploading image online, saving offline', error);
          return this.uploadImageOffline(contactId, formData);
        })
      );
    } else {
      return this.uploadImageOffline(contactId, formData);
    }
  }

  private uploadImageOffline(contactId: number, formData: FormData): Observable<any> {
    const file = formData.get('image') as File;
    
    return from(
      this.fileToBlob(file).then(blob => {
        // Save image blob to IndexedDB
        return this.indexedDB.saveImage(contactId, blob).then(() => {
          // Create object URL for preview
          const objectURL = URL.createObjectURL(blob);
          
          // Update contact with temp image path
          return this.indexedDB.getContact(contactId).then(contact => {
            if (contact) {
              contact.image = objectURL;
              return this.indexedDB.saveContact(contact);
            }
            return Promise.resolve(); // ADD THIS - return empty promise if no contact
          }).then(() => {
            // Add to pending operations
            return this.indexedDB.addPendingOp({
              id: `upload_${contactId}_${Date.now()}`,
              type: 'upload',
              contactId: contactId,
              formData: blob,
              timestamp: Date.now()
            });
          }).then(() => {
            return { path: objectURL, pending: true }; // ADD return here
          });
        });
      })
    );
  }

  private fileToBlob(file: File): Promise<Blob> {
    return Promise.resolve(file);
  }

  // ========== SYNC ==========

  syncPendingOperations(): void {
    if (!this.isOnline) {
      console.log('❌ Cannot sync - offline');
      return;
    }

    if (this.isSyncing) {
      console.log('⏳ Sync already in progress, skipping...');
      return;
    }

    from(this.indexedDB.getAllPendingOps()).subscribe(operations => {
      if (operations.length === 0) {
        console.log('✅ No pending operations to sync');
        return;
      }

      console.log(`🔄 Syncing ${operations.length} pending operations`);
      this.isSyncing = true;

      // Sort by timestamp
      operations.sort((a, b) => a.timestamp - b.timestamp);

      this.syncAndMapIds(operations)
        .then(() => {
          console.log('✅ All operations synced successfully');
          return this.indexedDB.clearPendingOps();
        })
        .then(() => {
          return this.indexedDB.setMetadata('last_sync', Date.now());
        })
        .then(() => {
          // Refresh from server
          console.log('🔄 Refreshing data from server...');
          this.http.get<Contact[]>(this.apiUrl).subscribe(contacts => {
            this.indexedDB.saveAllContacts(contacts).then(() => {
              console.log('✅ Data refreshed from server');
            });
          });
        })
        .catch(error => {
          console.error('❌ Error syncing operations:', error);
        })
        .finally(() => {
          this.isSyncing = false;
        });
    });
  }

  private async syncAndMapIds(operations: PendingOperation[]): Promise<void> {
    const idMapping: { [tempId: number]: number } = {};

    for (const op of operations) {
      try {
        if (op.type === 'create_new' && op.contact) {
          const tempId = op.contact.id;
          const contactToCreate = { ...op.contact };
          contactToCreate.id = -1;
          
          const result: any = await this.http.post(this.apiUrl, contactToCreate).toPromise();
          const realId = result.id;
          
          console.log(`✅ Created contact: temp ID ${tempId} -> real ID ${realId}`);
          idMapping[tempId] = realId;
          
          // Update IndexedDB with real ID
          await this.indexedDB.deleteContact(tempId);
          await this.indexedDB.saveContact({ ...op.contact, id: realId });
          
          // Update image if exists
          const imageBlob = await this.indexedDB.getImage(tempId);
          if (imageBlob) {
            await this.indexedDB.deleteImage(tempId);
            await this.indexedDB.saveImage(realId, imageBlob);
          }
          
          this.updatePendingOperationsIds(operations, tempId, realId);
          
        } else if (op.type === 'upload' && op.contactId) {
          const realId = idMapping[op.contactId] || op.contactId;
          
          console.log(`📤 Uploading image for contact ${realId}`);
          
          const blob = op.formData as Blob;
          const formData = new FormData();
          formData.append('image', blob, 'image.jpg');
          await this.http.post(`${this.apiUrl}/${realId}/upload-image`, formData).toPromise();
          
        } else if (op.type === 'update' && op.contactId) {
          const realId = idMapping[op.contactId] || op.contactId;
          console.log(`✏️ Updating contact ${realId}`);
          await this.http.put(`${this.apiUrl}/${realId}`, op.contact).toPromise();
          
        } else if (op.type === 'delete' && op.contactId) {
          const realId = idMapping[op.contactId] || op.contactId;
          console.log(`🗑️ Deleting contact ${realId}`);
          await this.http.delete(`${this.apiUrl}/${realId}`).toPromise();
        }
        
      } catch (error) {
        console.error('❌ Failed to execute:', op.type, error);
        throw error;
      }
    }
  }

  private updatePendingOperationsIds(operations: PendingOperation[], oldId: number, newId: number): void {
    operations.forEach(op => {
      if (op.contactId === oldId) {
        console.log(`🔄 Updating operation ${op.type}: contactId ${oldId} -> ${newId}`);
        op.contactId = newId;
      }
      
      if (op.contact && op.contact.id === oldId) {
        console.log(`🔄 Updating operation ${op.type}: contact.id ${oldId} -> ${newId}`);
        op.contact.id = newId;
      }
    });
  }

  // ========== UTILITY ==========

  generateRandomContacts(count: number): Observable<any> {
    let countitems = count || 10;
    if (this.isOnline) {
      return this.http.post(`${this.apiUrl}/generate?count=${countitems}`, {}).pipe(
        tap(() => {
          // Refresh IndexedDB after generation
          this.http.get<Contact[]>(this.apiUrl).subscribe(contacts => {
            this.indexedDB.saveAllContacts(contacts);
          });
        })
      );
    } else {
      return throwError(() => new Error('Cannot generate contacts in offline mode'));
    }
  }

  getSyncStatus(): Observable<{ hasPending: boolean; count: number; lastSync: Date | null }> {
    return from(
      Promise.all([
        this.indexedDB.getAllPendingOps(),
        this.indexedDB.getMetadata('last_sync')
      ])
    ).pipe(
      map(([operations, lastSyncTimestamp]) => {
        return {
          hasPending: operations.length > 0,
          count: operations.length,
          lastSync: lastSyncTimestamp ? new Date(lastSyncTimestamp) : null
        };
      })
    );
  }

  isAppOnline(): boolean {
    return this.isOnline;
  }
}