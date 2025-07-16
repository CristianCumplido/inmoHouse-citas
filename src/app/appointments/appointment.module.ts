import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router'; // ✅ Importar RouterModule directamente

// Components
import { AppointmentsListComponent } from './components/appointments-list/appointments-list.component';
import { AppointmentFormComponent } from './components/appointment-form/appointment-form.component';
import { AppointmentDetailComponent } from './components/appointment-detail/appointment-detail.component';

// Services
import { AppointmentsApiService } from '../core/infrastructure/services/appointment-api/appointment-api.service';
import { AppointmentsService } from '../core/application/services/appointments/appointments.service';

// Angular Material Modules
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDividerModule } from '@angular/material/divider';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';

// Módulos adicionales para el formulario
import { MatStepperModule } from '@angular/material/stepper';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

// ✅ Definir rutas directamente aquí
const routes = [
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
  declarations: [
    AppointmentsListComponent,
    AppointmentFormComponent,
    AppointmentDetailComponent,
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule.forChild(routes),
    // Material Modules
    MatToolbarModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatExpansionModule,
    MatDividerModule,
    MatPaginatorModule,
    MatSnackBarModule,
    MatDialogModule,
    MatTooltipModule,

    MatStepperModule,
    MatDatepickerModule,
    MatNativeDateModule,
  ],
  providers: [AppointmentsApiService, AppointmentsService],
})
export class AppointmentsModule {}
