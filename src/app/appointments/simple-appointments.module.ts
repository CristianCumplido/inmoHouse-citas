// simple-appointments.module.ts
import { NgModule, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // ✅ Agregar esta importación

@Component({
  selector: 'app-appointments-simple',
  template: `
    <div
      style="padding: 20px; background: #e8f5e8; border: 2px solid #4CAF50; border-radius: 8px;"
    >
      <h2>✅ Appointments Micro Frontend</h2>
      <p><strong>Cargado exitosamente!</strong></p>

      <div style="margin: 20px 0;">
        <h3>Funcionalidades:</h3>
        <button
          (click)="showList = !showList"
          style="margin: 5px; padding: 8px;"
        >
          {{ showList ? 'Ocultar' : 'Mostrar' }} Lista de Citas
        </button>
        <button
          (click)="showForm = !showForm"
          style="margin: 5px; padding: 8px;"
        >
          {{ showForm ? 'Ocultar' : 'Mostrar' }} Formulario
        </button>
        <button
          (click)="addAppointment()"
          style="margin: 5px; padding: 8px; background: #4CAF50; color: white;"
        >
          Agregar Cita de Prueba
        </button>
      </div>

      <div
        *ngIf="showList"
        style="background: white; padding: 15px; margin: 10px 0; border-radius: 4px;"
      >
        <h4>Lista de Citas:</h4>
        <ul>
          <li *ngFor="let apt of appointments; let i = index">
            <strong>{{ apt.client }}</strong> - {{ apt.date }} -
            <span [style.color]="getStatusColor(apt.status)">{{
              apt.status
            }}</span>
            <button
              (click)="removeAppointment(i)"
              style="margin-left: 10px; padding: 2px 6px; background: #f44336; color: white; border: none;"
            >
              Eliminar
            </button>
          </li>
        </ul>
      </div>

      <div
        *ngIf="showForm"
        style="background: white; padding: 15px; margin: 10px 0; border-radius: 4px;"
      >
        <h4>Nueva Cita:</h4>
        <div style="margin: 10px 0;">
          <label>Cliente: </label>
          <input
            [(ngModel)]="newAppointment.client"
            style="margin-left: 10px; padding: 5px;"
          />
        </div>
        <div style="margin: 10px 0;">
          <label>Fecha: </label>
          <input
            type="date"
            [(ngModel)]="newAppointment.date"
            style="margin-left: 10px; padding: 5px;"
          />
        </div>
        <div style="margin: 10px 0;">
          <label>Estado: </label>
          <select
            [(ngModel)]="newAppointment.status"
            style="margin-left: 10px; padding: 5px;"
          >
            <option value="Pendiente">Pendiente</option>
            <option value="Confirmada">Confirmada</option>
            <option value="Completada">Completada</option>
          </select>
        </div>
        <button
          (click)="saveAppointment()"
          style="padding: 8px 15px; background: #2196F3; color: white; border: none;"
        >
          Guardar Cita
        </button>
      </div>

      <div
        style="margin-top: 20px; padding: 10px; background: #fff3cd; border-radius: 4px;"
      >
        <small>
          <strong>Info:</strong> Total de citas: {{ appointments.length }} |
          Micro frontend funcionando sin RouterModule
        </small>
      </div>
    </div>
  `,
})
export class AppointmentsSimpleComponent {
  showList = true;
  showForm = false;

  appointments = [
    { client: 'Juan Pérez', date: '2025-07-15', status: 'Pendiente' },
    { client: 'María García', date: '2025-07-16', status: 'Confirmada' },
    { client: 'Carlos López', date: '2025-07-17', status: 'Completada' },
  ];

  newAppointment = {
    client: '',
    date: '',
    status: 'Pendiente',
  };

  addAppointment() {
    const randomNames = [
      'Ana Silva',
      'Pedro Martín',
      'Lucía Torres',
      'Diego Ramírez',
    ];
    const randomName =
      randomNames[Math.floor(Math.random() * randomNames.length)];

    this.appointments.push({
      client: randomName,
      date: new Date().toISOString().split('T')[0],
      status: 'Pendiente',
    });
  }

  removeAppointment(index: number) {
    this.appointments.splice(index, 1);
  }

  saveAppointment() {
    if (this.newAppointment.client && this.newAppointment.date) {
      this.appointments.push({ ...this.newAppointment });
      this.newAppointment = { client: '', date: '', status: 'Pendiente' };
      this.showForm = false;
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'Pendiente':
        return '#ff9800';
      case 'Confirmada':
        return '#2196f3';
      case 'Completada':
        return '#4caf50';
      default:
        return '#666';
    }
  }
}

@NgModule({
  declarations: [AppointmentsSimpleComponent],
  imports: [
    CommonModule,
    FormsModule, // ✅ Agregar FormsModule aquí
  ],
})
export class AppointmentsModule {}
