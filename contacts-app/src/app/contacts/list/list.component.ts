import { Component, HostListener, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Contact, ContactService } from 'src/app/services/contact.service';
import { NotificationService } from 'src/app/services/notifications.service';

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss']

})
export class ListComponent implements OnInit {
  contacts: Contact[] = [];
  groupedContacts: { [key: string]: any[] } = {};
  isMenuOpen = false;
  searchOpen = false;
  searchTerm = '';
  filteredContacts: Contact[] = [];
  groupedList: { key: string, contacts: Contact[] }[] = [];
  filteredGroupedList: { key: string, contacts: Contact[] }[] = [];
  isOnline: boolean = true;
  syncStatus: { hasPending: boolean; count: number; lastSync: Date | null } = { hasPending: false, count: 0, lastSync: null };
  constructor(private contactService: ContactService, private notification: NotificationService) {
    this.isOnline = this.contactService.isAppOnline();
  }

  ngOnInit() {
    this.loadContacts();
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());
  }

  ngOnDestroy() {
    window.removeEventListener('online', () => this.handleOnline());
    window.removeEventListener('offline', () => this.handleOffline());
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
    console.log('Menu open:', this.isMenuOpen);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.sidebar') && !target.closest('.burger-btn')) {
      this.isMenuOpen = false;
    }
  }

  loadContacts() {
    this.contactService.getContacts().subscribe({
      next: (data) => {
        console.log('DATA FROM SERVER:', data);
        this.contacts = data;
        this.groupContacts()
      },
      error: (err) => console.error('Error fetching contacts', err)
    });
  }

  private buildGroupedFromArray(source: Contact[]) {
    const grouped: { [key: string]: Contact[] } = {};
  
    for (const contact of source) {
      const firstLetter = (contact.name && contact.name.charAt(0) || '#').toUpperCase();
      if (!grouped[firstLetter]) grouped[firstLetter] = [];
      grouped[firstLetter].push(contact);
    }
  
    // create sorted array of groups for deterministic UI order
    const groupedArray = Object.keys(grouped)
      .sort()
      .map(key => ({ key, contacts: grouped[key] }));
  
    return { grouped, groupedArray };
  }
  
  groupContacts() {
    const { grouped, groupedArray } = this.buildGroupedFromArray(this.contacts);
    this.groupedContacts = grouped;
    this.groupedList = groupedArray;
  
    // initial filtered list = full list (new array instance -> triggers render)
    this.filteredGroupedList = groupedArray.slice();
  }

  addRandom() {
    this.contactService.generateRandomContacts(10).subscribe({
      next: (data:any) => {
        console.log('Generate: ', data?.message);
        this.notification.show('10 Random contacts generated', 'success',3000);
        this.loadContacts();
      },
      error: (err) => {
        console.error('Error Generate contacts', err)
        if(err == 'Cannot generate contacts in offline mode')
          this.notification.show(err, 'error',3000);
        else
          this.notification.show('Error generating contacts', 'error',3000);
      }
    });
  }

  clearSearch() {
    this.searchTerm = '';
    this.searchOpen = false;
    this.filteredGroupedList = this.groupedList.slice();
  }

  filterContacts() {
    const term = (this.searchTerm || '').trim().toLowerCase();
  
    if (!term) {
      // restore full grouped list
      this.filteredGroupedList = this.groupedList.slice();
      return;
    }
  
    // filter original contacts, then regroup
    const filtered = this.contacts.filter(c => (c.name || '').toLowerCase().includes(term));
    const { groupedArray } = this.buildGroupedFromArray(filtered);
  
    this.filteredGroupedList = groupedArray;
  }

  handleOnline() {
    this.isOnline = true;
    this.notification.show('Back online! Syncing...', 'success', 2000);
    this.contactService.syncPendingOperations();
    setTimeout(() => {
      this.loadContacts();
      this.syncStatus = this.contactService.getSyncStatus();
    }, 2500);
  }
  
  handleOffline() {
    this.isOnline = false;
    this.notification.show('You are offline. Changes will sync when reconnected.', 'error', 3000);
    this.syncStatus = this.contactService.getSyncStatus();
  }
  
  manualSync() {
    if (this.isOnline) {
      this.contactService.syncPendingOperations();
      setTimeout(() => this.loadContacts(), 1000);
    }
  }
  
}
