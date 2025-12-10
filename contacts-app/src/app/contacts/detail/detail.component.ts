import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Contact, ContactService } from 'src/app/services/contact.service';
import { NotificationService } from 'src/app/services/notifications.service';

@Component({
  selector: 'app-detail',
  templateUrl: './detail.component.html',
  styleUrls: ['./detail.component.scss'],
})
export class DetailComponent {
  contact: Contact = {} as Contact;
  mode: 'create' | 'edit' | 'view' = 'view';
  selectedImageUrl: string | null = null;
  formData: FormData = new FormData();
  previewImage: string | ArrayBuffer | null = null;
  isOnline: boolean = true;

  syncStatus: { hasPending: boolean; count: number; lastSync: Date | null } = {
    hasPending: false,
    count: 0,
    lastSync: null
  };

  touched = {
    name: false,
    email: false,
    phone: false,
    cell: false
  };
  
  valid = {
    name: true,
    email: true,
    phone: true,
    cell: true
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private contactService: ContactService,
    private notification: NotificationService
  ) {
    this.isOnline = this.contactService.isAppOnline();
  }

  ngOnInit() {

    this.updateOnlineStatus();
    window.addEventListener('online', () => this.updateOnlineStatus());
    window.addEventListener('offline', () => this.updateOnlineStatus());

    const id = this.route.snapshot.paramMap.get('id');
    const url = this.route.snapshot.url.map(segment => segment.path);
    console.log('URL SEGMENTS:', url, id);
    
    if (url.includes('new')) {
      this.mode = 'create';
      this.contact = {} as Contact;
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
          this.notification.show(
            this.isOnline ? 'Error fetching contact' : 'Contact not available offline',
            'error',
            3000
          );
        }
      });
    }
  }

  ngOnDestroy() {
    window.removeEventListener('online', () => this.updateOnlineStatus());
    window.removeEventListener('offline', () => this.updateOnlineStatus());
  }

  updateOnlineStatus() {
    this.isOnline = this.contactService.isAppOnline();
    this.syncStatus = this.contactService.getSyncStatus();
    
    if (this.isOnline && this.syncStatus.hasPending) {
      this.notification.show(
        `Syncing ${this.syncStatus.count} pending changes...`,
        'info',
        3000
      );
    }
  }

  save(mode: string) {
    this.touched.name = this.touched.email = this.touched.phone = this.touched.cell = true;
    this.validateFields();

    if (!this.valid.name || !this.valid.email || !this.valid.phone || !this.valid.cell) {
      this.notification.show("Please fill in all required fields correctly", "error", 3000);
      return;
    }

    const offlineMessage = this.isOnline ? '' : ' (will sync when online)';
    
    if (mode === 'create') {
      this.contactService.createContact(this.contact).subscribe({
        next: (data) => {
          console.log('Contact created:', data);
          this.contact.id = data.id;
          if (this.formData.has('image')) {
            this.uploadImg(true);
          }
          this.notification.show('Contact created successfully!' + offlineMessage, 'success', 3000);
          this.router.navigate(['/contacts']); // This is the requirments!
        },
        error: (err) => {
          console.error('Error creating contact', err);
          this.notification.show('Error creating contact', 'error', 3000);
        }
      });
    } else if (mode === 'edit') {   
      if (this.formData.has('image')) {
        this.uploadImg();
      }   
      this.contactService.updateContact(this.contact.id, this.contact).subscribe({
        next: (data) => {
          console.log('Contact updated:', data);
          this.notification.show('Contact updated successfully!' + offlineMessage, 'success', 3000);
          this.backToView();
        },
        error: (err) => {
          console.error('Error updating contact', err);
          this.notification.show('Error updating contact', 'error', 3000);
        }
      });
    }
  }

  backToView() {
    this.mode = 'view';
  }

  editContact(mode: string) {
    if (mode === 'View') {
      this.mode = 'view';
      // Reload contact to cancel changes
      // this.contactService.getContact(this.contact.id).subscribe({
      //   next: (data) => {
      //     this.contact = data;
      //     this.previewImage = null;
      //   },
      //   error: (err) => {
      //     console.error('Error reloading contact', err);
      //   }
      // });
    } else {
      this.mode = 'edit';
    }
  }
  
  toContact() {
    this.router.navigate(['/contacts/list']);
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;
    
    this.formData = new FormData();
    this.formData.append('image', file);
          
    const reader = new FileReader();
    reader.onload = () => {
      this.previewImage = reader.result;
    };
    reader.readAsDataURL(file);
  }

  uploadImg(isNew:boolean = false) {
    if (!this.formData.has('image')) {
      return;
    }

    const offlineMessage = this.isOnline ? '' : ' (will sync when online)';
    
    this.contactService.uploadImage(this.contact.id, this.formData).subscribe({
      next: (response: any) => {
        console.log('Image uploaded successfully:', response);
        this.notification.show('Image uploaded successfully!' + offlineMessage, 'success',3000);
        this.contact.image = response.path;
        if(isNew)
          this.contactService.updateContact(this.contact.id, this.contact).subscribe();
        this.formData = new FormData();
      },
      error: (err) => {
        console.error('Error uploading image', err);
        this.notification.show('Error uploading image', 'error', 3000);
      }
    });
  }
 
  deleteItem() {
    const offlineMessage = this.isOnline ? '' : ' (will sync when online)';

    this.contactService.deleteContact(this.contact.id).subscribe({
      next: (data) => {
        console.log('Contact deleted:', data);
        this.notification.show('Contact deleted successfully!' + offlineMessage, 'success',3000);
        this.router.navigate(['/contacts/list']);
      },
      error: (err) => {
        console.error('Error deleting contact', err);
        this.notification.show('Error deleting contact', 'error', 3000);
      }
    });
  }

  imgPath() {
    if (this.previewImage) 
      return this.previewImage;
    else {
      if (this.contact && this.contact.image) {
        // Check if it's a base64 image (offline uploaded)
        if (this.contact.image.startsWith('data:')) {
          return this.contact.image;
        }
        // Check if it's a server path
        return (this.contact.image.startsWith('/uploads/')) 
          ? 'http://localhost:3000' + this.contact.image 
          : this.contact.image;
      } else {
        return 'assets/images/avatar.png';
      }
    }
  }

  validateFields() {
    // Validate name (required)
    this.valid.name = !!(this.contact.name && this.contact.name.trim().length > 0);
    
    // Validate email (required and format)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    this.valid.email = !!(this.contact.email && emailRegex.test(this.contact.email));
    
    // Validate phone (required and format)
    const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,4}$/;
    this.valid.phone = !!(this.contact.phone && phoneRegex.test(this.contact.phone));
    
    // Validate cell (optional but must be valid format if provided)
    this.valid.cell = !this.contact.cell || phoneRegex.test(this.contact.cell);
  }

  manualSync() {
    if (this.isOnline) {
      this.contactService.syncPendingOperations();
      this.notification.show('Syncing pending changes...', 'info', 2000);
      
      // Update status after a delay
      setTimeout(() => {
        this.updateOnlineStatus();
      }, 1000);
    } else {
      this.notification.show('Cannot sync while offline', 'error', 2000);
    }
  }
}