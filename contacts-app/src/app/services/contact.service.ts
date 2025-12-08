// contact.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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

@Injectable({
  providedIn: 'root'
})
export class ContactService {

  private apiUrl = 'http://localhost:3000/contacts'; 

  constructor(private http: HttpClient) { }

  // Get all contacts
  getContacts(): Observable<Contact[]> {
    console.log('Fetching contacts from API:', this.apiUrl);
    return this.http.get<Contact[]>(this.apiUrl);
  }

  // Get a single contact
  getContact(id: number): Observable<Contact> {
    return this.http.get<Contact>(`${this.apiUrl}/${id}`);
  }

  // Create a new contact
  createContact(contact: Contact): Observable<Contact> {
    return this.http.post<Contact>(this.apiUrl, contact);
  }

  // Update a contact
  updateContact(id: number, contact: Contact): Observable<Contact> {
    return this.http.put<Contact>(`${this.apiUrl}/${id}`, contact);
  }

  // Delete a contact
  deleteContact(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  generateRandomContacts(count: number) {
    let countitems = count || 10;
    return this.http.post(`${this.apiUrl}/generate?count=${countitems}`, {});
  }

  uploadImage(contactId: number, formData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/${contactId}/upload-image`, formData);
  }
}
