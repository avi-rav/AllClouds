import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss']

})
export class ListComponent implements OnInit {
  contacts: any[] = [];
  groupedContacts: { [key: string]: any[] } = {};
  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.http.get('http://localhost:3000/contacts').subscribe((data: any) => {
      this.contacts = data;
      this.groupContacts();
    });
  }

  groupContacts() {
    this.groupedContacts = this.contacts.reduce((groups: any, contact: any) => {
      const letter = contact.name.charAt(0).toUpperCase();
      if (!groups[letter]) groups[letter] = [];
      groups[letter].push(contact);
      return groups;
    }, {});
  }

  addRandom() {
    this.http.post('http://localhost:3000/contacts/random', {}).subscribe((newContact: any) => {
      this.contacts.push(newContact);
      this.groupContacts();
    })
  }
}
