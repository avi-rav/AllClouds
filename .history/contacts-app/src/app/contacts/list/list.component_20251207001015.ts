import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Contact, ContactService } from 'src/app/services/contact.service';

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss']

})
export class ListComponent implements OnInit {
  contacts: Contact[] = [];
  groupedContacts: { [key: string]: any[] } = {};
  constructor(private contactService: ContactService) {}

  ngOnInit() {
    this.loadContacts();
  }

  loadContacts() {
    this.contactService.getContacts().subscribe({
      next: (data) => {
        console.log('DATA FROM SERVER:', data);
        this.contacts = data;
      },
      error: (err) => console.error('Error fetching contacts', err)
    });
  }

  // groupContacts() {
  //   this.groupedContacts = this.contacts.reduce((groups: any, contact: any) => {
  //     const letter = contact.name.charAt(0).toUpperCase();
  //     if (!groups[letter]) groups[letter] = [];
  //     groups[letter].push(contact);
  //     return groups;
  //   }, {});
  // }

  addRandom() {
   
  }
}
