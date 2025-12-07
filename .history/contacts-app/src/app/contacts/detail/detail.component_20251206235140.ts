import { Component } from '@angular/core';
import { Contact } from 'src/app/services/contact.service';

@Component({
  selector: 'app-detail',
  templateUrl: './detail.component.html',
  styleUrls: ['./detail.component.scss'],
})
export class DetailComponent {
  contact:Contact = {
    name: 'Kyle Dickenson',
    cell: '+1 (415) 123-4567',
    email: 'kyle@piedpiper.com',
    id: 1, 
    phone: '039333333',
    registrationDate: new Date('2023-01-15'),
    age: 30,
    image: 'assets/images/kyle.jpg'
  };
}
