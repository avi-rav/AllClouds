import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-contact-card',
  templateUrl: './contact-card.component.html',
  styleUrls: ['./contact-card.component.scss']
})
export class ContactCardComponent {
  @Input() contact: any;

  constructor(private router: Router) {}

  openDetail(id: number) {
    this.router.navigate(['/contacts', id]);
  }
}
