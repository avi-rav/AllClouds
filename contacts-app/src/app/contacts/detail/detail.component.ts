import { Component } from '@angular/core';
import { ActivatedRoute, Route, Router } from '@angular/router';
import { Contact, ContactService } from 'src/app/services/contact.service';
import { NotificationService } from 'src/app/services/notifications.service';

@Component({
  selector: 'app-detail',
  templateUrl: './detail.component.html',
  styleUrls: ['./detail.component.scss'],
})
export class DetailComponent {
  contact:Contact = {} as Contact;
  mode: 'create' | 'edit' | 'view' = 'view';
  selectedImageUrl: string | null = null;
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private contactService: ContactService,
    private notification: NotificationService
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
        error: (err) => {
          console.error('Error fetching contact', err);
          this.notification.show('Error fetching contact', 'error',3000);
        }
      });
    }
  }

  save(mode:string){
    if(mode === 'create'){
      this.contactService.createContact(this.contact).subscribe({
        next: (data) => {
          console.log('Contact created:', data);
          this.notification.show('Contact created successfully!', 'success',3000);
          this.backToView();
        },
        error: (err) => {
          console.error('Error creating contact', err)
          this.notification.show('Error creating contact', 'error',3000);
        }
      });
    } else if(mode === 'edit'){
      this.contactService.updateContact(this.contact.id, this.contact).subscribe({
        next: (data) => {
          console.log('Contact updated:', data);
          this.notification.show('Contact updated successfully!', 'success',3000);
          this.backToView();
        },
        error: (err) => {
          console.error('Error updating contact', err)
          this.notification.show('Error updating contact', 'error',3000);
        }
      });
    }
  }

  backToView() {
    this.mode = 'view';
  }

  editContact(mode:string) {
    if(mode === 'View'){
      this.mode = 'view';
      // this.router.navigate(['/contacts', this.contact.id]); to do cancel changes
    }
    else{
      this.mode = 'edit';
    }
  }
  
  toContact() {
    this.router.navigate(['/contacts/list']);
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;
  
    const formData = new FormData();
    formData.append('image', file);
      
    this.contactService.uploadImage(this.contact.id, formData).subscribe({
      next: (response: any) => {
        console.log('Image uploaded successfully:', response);
        this.notification.show('Image uploaded successfully!', 'success',3000);
        this.contact.image = response.path;
      },
      error: (err) => {
        console.error('Error uploading image', err)
        this.notification.show('Error uploading image', 'error',3000);
      }
    });
  }
  
  onImageUrlEntered(event: any) {
    this.selectedImageUrl = event.target.value;
  }
  
  applyUrlImage() {
    if (!this.selectedImageUrl) return;
    this.contact.image = this.selectedImageUrl;
  }

  deleteItem() {
    this.contactService.deleteContact(this.contact.id).subscribe({
      next: (data) => {
        console.log('Contact deleted:', data);
        this.notification.show('Contact deleted successfully!', 'success',3000);
        this.router.navigate(['/contacts/list']);
      },
      error: (err) => {
        console.error('Error deleting contact', err)
        this.notification.show('Error deleting contact', 'error',3000);
      }
    });
  }
}
