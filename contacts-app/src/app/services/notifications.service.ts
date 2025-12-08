// notification.service.ts
import { Injectable, signal } from '@angular/core';

export interface Notification {
  id: number;
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  // Use signal with initial empty array
  notifications = signal<Notification[]>([]);
  private nextId = 0;

  show(message: string, type: 'info' | 'success' | 'error' = 'info', duration = 3000) {
    const id = this.nextId++;
    const newNotification: Notification = { id, message, type, duration };
    this.notifications.update(n => [...n, newNotification]);

    setTimeout(() => {
      this.notifications.update(n => n.filter(x => x.id !== id));
    }, duration);
  }
}
