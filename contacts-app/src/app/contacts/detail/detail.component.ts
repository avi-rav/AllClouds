import { Component } from '@angular/core';
import { ActivatedRoute, Route, Router } from '@angular/router';
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
    private router: Router,
    private contactService: ContactService
  ){    
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    const url = this.route.snapshot.url.map(segment => segment.path);
    console.log('URL SEGMENTS:', url, id);
    if (url.includes('new')) {
      this.mode = 'create';
      this.contact = {} as Contact;; 
    } else {
      if (url.includes('edit')) {
        this.mode = 'edit';
      } else {
        this.mode = 'view';
      }
      this.contactService.getContact(Number(id)).subscribe({
        next: (data) => {
          console.log('Contact data:', data);
          this.contact = data;
        },
        error: (err) => console.error('Error fetching contact', err)
      });
    }
  }

  save(mode:string){
    if(mode === 'create'){
      this.contactService.createContact(this.contact).subscribe({
        next: (data) => {
          console.log('Contact created:', data);
          this.backToView();
        },
        error: (err) => console.error('Error creating contact', err)
      });
    } else if(mode === 'edit'){
      this.contactService.updateContact(this.contact.id, this.contact).subscribe({
        next: (data) => {
          console.log('Contact updated:', data);
        },
        error: (err) => console.error('Error updating contact', err)
      });
    }
  }

  backToView() {
    this.mode = 'view';
    this.router.navigate(['/contacts', this.contact.id]);
  }

  editContact(mode:string) {
    if(mode === 'View'){
      this.mode = 'view';
      this.router.navigate(['/contacts', this.contact.id]);
    }
    else{
      this.mode = 'edit';
      this.router.navigate(['/contacts', this.contact.id, 'edit']);
    }
  }
  
  toContact() {
    this.router.navigate(['/contacts/list']);
  }
}
