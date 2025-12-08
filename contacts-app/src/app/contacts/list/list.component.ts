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

  constructor(private contactService: ContactService, private notification: NotificationService) {}

  ngOnInit() {
    this.loadContacts();
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

  groupContacts() {
    this.groupedContacts = {};
  
    for (const contact of this.contacts) {
      const firstLetter = contact.name.charAt(0).toUpperCase();
  
      if (!this.groupedContacts[firstLetter]) {
        this.groupedContacts[firstLetter] = [];
      }
  
      this.groupedContacts[firstLetter].push(contact);
    }  
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
        this.notification.show('Error generating contacts', 'error',3000);
      }
    });
  }
}
