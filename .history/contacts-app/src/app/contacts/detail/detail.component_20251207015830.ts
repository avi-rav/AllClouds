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
  mode: 'create' | 'edit' | 'view' = 'view';

  constructor(
    private route: ActivatedRoute, 
    private contactService: ContactService
  ){    
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    const url = this.route.snapshot.url.map(segment => segment.path);
    console.log('URL SEGMENTS:', url, id);
    if (id === 'new') {
      this.mode = 'create';
      this.contact = {} as Contact;; 
    } else {
      this.contactService.getContact(Number(id)).subscribe({
        next: (data) => {
          console.log('Contact data:', data);
          this.contact = data;
        },
        error: (err) => console.error('Error fetching contact', err)
      });
      if (url.includes('edit')) {
        this.mode = 'edit';
      } else {
        this.mode = 'view';
      }
    }
  }
}
