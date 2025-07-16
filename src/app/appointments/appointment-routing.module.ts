import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AppointmentsListComponent } from './components/appointments-list/appointments-list.component';
import { AppointmentFormComponent } from './components/appointment-form/appointment-form.component';
import { AppointmentDetailComponent } from './components/appointment-detail/appointment-detail.component';

const routes: Routes = [
  {
    path: '',
    component: AppointmentsListComponent,
    data: { title: 'Gestión de Citas' },
  },
  {
    path: 'new',
    component: AppointmentFormComponent,
    data: { title: 'Nueva Cita' },
  },
  {
    path: ':id',
    component: AppointmentDetailComponent,
    data: { title: 'Detalle de Cita' },
  },
  {
    path: ':id/edit',
    component: AppointmentFormComponent,
    data: { title: 'Editar Cita' },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AppointmentsRoutingModule {}
