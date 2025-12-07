import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Contact, ContactService } from 'src/app/services/contact.service';

@Component({
  selector: 'app-detail',
  templateUrl: './detail.component.html',
  styleUrls: ['./detail.component.scss'],
})
export class DetailComponent {
  contact:Contact = {} as Contact;
  isNew:boolean = false;

  constructor(
    private route: ActivatedRoute, 
    private contactService: ContactService
  ){    
  }

  ngOnInit() {
    const param = this.route.snapshot.paramMap.get('id');

    if (param === 'new' || param === null) {
      this.isNew = true;
      this.contact = {} as Contact;; 
    } else {
      this.isNew = false;
      this.contactService.getContact(Number(param)).subscribe({
        next: (data) => {
          console.log('Contact data:', data);
          this.contact = data;
        },
        error: (err) => console.error('Error fetching contact', err)
      });
    }
    
    
  }
  // contact:Contact = {
  //   name: 'Kyle Dickenson',
  //   cell: '+1 (415) 123-4567',
  //   email: 'kyle@piedpiper.com',
  //   id: 1, 
  //   phone: '039333333',
  //   registrationDate: new Date('2023-01-15'),
  //   age: 30,
  //   image: 'assets/images/kyle.jpg'
  // };
}
