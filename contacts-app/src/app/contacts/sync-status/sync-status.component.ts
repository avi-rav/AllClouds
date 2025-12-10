import { Component, OnInit, OnDestroy } from '@angular/core';
import { ContactService } from 'src/app/services/contact.service';

@Component({
  selector: 'app-sync-status',
  templateUrl: './sync-status.component.html',
  styleUrls: ['./sync-status.component.scss']
})
export class SyncStatusComponent implements OnInit, OnDestroy {
  isOnline: boolean = true;
  syncStatus: { hasPending: boolean; count: number; lastSync: Date | null } = {
    hasPending: false,
    count: 0,
    lastSync: null
  };
  private intervalId: any;

  constructor(private contactService: ContactService) {}

  ngOnInit() {
    this.updateStatus();
    
    // Update status every 5 seconds
    this.intervalId = setInterval(() => {
      this.updateStatus();
    }, 5000);

    // Listen for online/offline events
    window.addEventListener('online', () => this.updateStatus());
    window.addEventListener('offline', () => this.updateStatus());
  }

  ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    window.removeEventListener('online', () => this.updateStatus());
    window.removeEventListener('offline', () => this.updateStatus());
  }

  updateStatus() {
    this.isOnline = this.contactService.isAppOnline();
    this.contactService.getSyncStatus().subscribe(status => {
      this.syncStatus = status;
    });
  }

  syncNow() {
    this.contactService.syncPendingOperations();
    setTimeout(() => this.updateStatus(), 1000);
  }

  formatLastSync(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }
}