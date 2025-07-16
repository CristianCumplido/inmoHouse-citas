import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
const routes: Routes = [
  // {
  //   path: 'appointments',
  //   loadChildren: () =>
  //     import('../app/appointments/appointment.module').then(
  //       (m) => m.AppointmentsModule
  //     ),
  // },
  // {
  //   path: '',
  //   redirectTo: '/appointments',
  //   pathMatch: 'full',
  // },
  // {
  //   path: '**',
  //   redirectTo: '/appointments',
  // },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
