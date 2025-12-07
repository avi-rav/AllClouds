import { Component } from '@angular/core';

@Component({
  selector: 'app-detail',
  templateUrl: './detail.component.html',
  styleUrls: ['./detail.component.scss']
})
export class DetailComponent {
  contact = {
    name: 'Kyle Dickenson',
    company: 'Pied Piper',
    mobile: '+1 (415) 123-4567',
    work: '+1 (408) 987-6543',
    email: 'kyle@piedpiper.com'
  };
}
