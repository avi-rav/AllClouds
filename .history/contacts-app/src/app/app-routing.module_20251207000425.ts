import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ListComponent } from './contacts/list/list.component';
import { DetailComponent } from './contacts/detail/detail.component';

const routes: Routes = [
  { path: '', redirectTo: 'contacts/list', pathMatch: 'full' },
  { path: 'contacts', redirectTo: 'contacts/list', pathMatch: 'full' },
  { path: 'contacts/list', component: ListComponent },
  { path: 'contacts/new', component: DetailComponent },
  { path: 'contacts/:id', component: DetailComponent },
];


@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
