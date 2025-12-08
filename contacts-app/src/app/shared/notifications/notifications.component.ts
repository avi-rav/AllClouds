import { Component } from '@angular/core';
import { NotificationService } from 'src/app/services/notifications.service';

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss']
})
export class NotificationsComponent {
  notifications = this.notificationService.notifications;

  constructor(public notificationService: NotificationService) {}
}
