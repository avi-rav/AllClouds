import { NgModule, isDevMode } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { ServiceWorkerModule } from '@angular/service-worker';
import { ListComponent } from './contacts/list/list.component';
import { DetailComponent } from './contacts/detail/detail.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ContactCardComponent } from './shared/contact-card/contact-card.component';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { NotificationsComponent } from './shared/notifications/notifications.component';

@NgModule({
  declarations: [
    AppComponent,
    ListComponent,
    DetailComponent,
    ContactCardComponent,
    NotificationsComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: !isDevMode(),
      // Register the ServiceWorker as soon as the application is stable
      // or after 30 seconds (whichever comes first).
      registrationStrategy: 'registerWhenStable:30000'
    }),
    BrowserAnimationsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
