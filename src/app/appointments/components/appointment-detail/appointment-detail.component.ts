// src/app/appointments/components/appointment-detail/appointment-detail.component.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { Location } from '@angular/common';
import {
  AppointmentWithDetails,
  User,
  UserRole,
  AppointmentStatus,
} from '../../../core/domain/entities/appointment.entities';
import { AppointmentsService } from '../../../core/application/services/appointments/appointments.service';

@Component({
  selector: 'app-appointment-detail',
  templateUrl: './appointment-detail.component.html',
  styleUrls: ['./appointment-detail.component.scss'],
})
export class AppointmentDetailComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  appointment: AppointmentWithDetails | null = null;
  currentUser: User | null = null;
  loading = false;
  error: string = '';
  actionLoading = false;

  // Enums for template
  UserRole = UserRole;
  AppointmentStatus = AppointmentStatus;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private appointmentsService: AppointmentsService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
    // Get current user from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        this.currentUser = JSON.parse(userData);
      } catch (error) {
        console.error('Error parsing user data:', error);
        this.showSnackBar('Error al cargar información del usuario', 'error');
      }
    }
  }

  ngOnInit(): void {
    this.loadAppointment();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadAppointment(): void {
    const appointmentId = this.route.snapshot.paramMap.get('id');
    if (!appointmentId) {
      this.showSnackBar('ID de cita no válido', 'error');
      this.router.navigate(['/appointments']);
      return;
    }

    this.loading = true;
    this.error = '';

    this.appointmentsService
      .getAppointmentById(appointmentId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (appointment) => {
          this.appointment = appointment;
          this.loading = false;
        },
        error: (error) => {
          this.error = error.message || 'Error al cargar la cita';
          this.loading = false;
          this.showSnackBar(this.error, 'error');
        },
      });
  }

  // Navigation
  goBack(): void {
    this.location.back();
  }

  editAppointment(): void {
    if (this.appointment && this.canModifyAppointment()) {
      this.router.navigate(['/appointments', this.appointment.id, 'edit']);
    } else {
      this.showSnackBar('No tienes permisos para editar esta cita', 'warning');
    }
  }

  // Actions with confirmation dialogs
  cancelAppointment(): void {
    if (!this.appointment || !this.canCancelAppointment()) {
      this.showSnackBar('No puedes cancelar esta cita', 'warning');
      return;
    }

    const dialogRef = this.showConfirmationDialog(
      'Cancelar Cita',
      '¿Estás seguro de que deseas cancelar esta cita?',
      'Esta acción no se puede deshacer.',
      'Cancelar Cita',
      'warn'
    );

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.performCancelAppointment();
      }
    });
  }

  private performCancelAppointment(): void {
    if (!this.appointment) return;

    this.actionLoading = true;

    this.appointmentsService
      .cancelAppointment(this.appointment.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedAppointment) => {
          if (this.appointment) {
            this.appointment.status = updatedAppointment.status;
          }
          this.actionLoading = false;
          this.showSnackBar('Cita cancelada exitosamente', 'success');
        },
        error: (error) => {
          this.error = error.message || 'Error al cancelar la cita';
          this.actionLoading = false;
          this.showSnackBar(this.error, 'error');
        },
      });
  }

  confirmAppointment(): void {
    if (!this.appointment || !this.canConfirmAppointment()) {
      this.showSnackBar('No puedes confirmar esta cita', 'warning');
      return;
    }

    const agentId = this.currentUser?.id;
    if (!agentId) {
      this.showSnackBar('Error: No se pudo identificar al agente', 'error');
      return;
    }

    const dialogRef = this.showConfirmationDialog(
      'Confirmar Cita',
      '¿Deseas confirmar esta cita?',
      'Serás asignado como el agente responsable de esta cita.',
      'Confirmar',
      'primary'
    );

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.performConfirmAppointment(agentId);
      }
    });
  }

  private performConfirmAppointment(agentId: string): void {
    if (!this.appointment) return;

    this.actionLoading = true;

    this.appointmentsService
      .confirmAppointment(this.appointment.id, agentId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedAppointment) => {
          if (this.appointment) {
            this.appointment.status = updatedAppointment.status;
            this.appointment.agentId = updatedAppointment.agentId;
            // Refresh to get agent details
            this.loadAppointment();
          }
          this.actionLoading = false;
          this.showSnackBar('Cita confirmada exitosamente', 'success');
        },
        error: (error) => {
          this.error = error.message || 'Error al confirmar la cita';
          this.actionLoading = false;
          this.showSnackBar(this.error, 'error');
        },
      });
  }

  completeAppointment(): void {
    if (!this.appointment || !this.canCompleteAppointment()) {
      this.showSnackBar('No puedes completar esta cita', 'warning');
      return;
    }

    const dialogRef = this.showConfirmationDialog(
      'Completar Cita',
      '¿Confirmas que la cita fue completada?',
      'Marca esta cita como finalizada exitosamente.',
      'Completar',
      'accent'
    );

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.performCompleteAppointment();
      }
    });
  }

  private performCompleteAppointment(): void {
    if (!this.appointment) return;

    this.actionLoading = true;

    this.appointmentsService
      .completeAppointment(this.appointment.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedAppointment) => {
          if (this.appointment) {
            this.appointment.status = updatedAppointment.status;
          }
          this.actionLoading = false;
          this.showSnackBar('Cita marcada como completada', 'success');
        },
        error: (error) => {
          this.error = error.message || 'Error al completar la cita';
          this.actionLoading = false;
          this.showSnackBar(this.error, 'error');
        },
      });
  }

  // Permission checks
  canModifyAppointment(): boolean {
    if (!this.appointment || !this.currentUser) return false;
    return this.appointmentsService.canUserModifyAppointment(
      this.appointment,
      this.currentUser
    );
  }

  canCancelAppointment(): boolean {
    if (!this.appointment || !this.currentUser) return false;
    return this.appointmentsService.canUserCancelAppointment(
      this.appointment,
      this.currentUser
    );
  }

  canConfirmAppointment(): boolean {
    if (!this.appointment || !this.currentUser) return false;
    return (
      (this.currentUser.role === UserRole.AGENT ||
        this.currentUser.role === UserRole.ADMIN) &&
      this.appointment.status === AppointmentStatus.PENDING
    );
  }

  canCompleteAppointment(): boolean {
    if (!this.appointment || !this.currentUser) return false;
    return (
      (this.currentUser.role === UserRole.AGENT ||
        this.currentUser.role === UserRole.ADMIN) &&
      this.appointment.status === AppointmentStatus.CONFIRMED &&
      this.appointmentsService.isAppointmentInPast(this.appointment)
    );
  }

  // Material Design utility methods
  getStatusChipColor(
    status: AppointmentStatus
  ): 'primary' | 'accent' | 'warn' | undefined {
    switch (status) {
      case AppointmentStatus.PENDING:
        return 'accent';
      case AppointmentStatus.CONFIRMED:
        return 'primary';
      case AppointmentStatus.COMPLETED:
        return undefined; // default color
      case AppointmentStatus.CANCELLED:
        return 'warn';
      default:
        return undefined;
    }
  }

  getStatusIcon(status: AppointmentStatus): string {
    switch (status) {
      case AppointmentStatus.PENDING:
        return 'schedule';
      case AppointmentStatus.CONFIRMED:
        return 'event_available';
      case AppointmentStatus.COMPLETED:
        return 'check_circle';
      case AppointmentStatus.CANCELLED:
        return 'cancel';
      default:
        return 'help';
    }
  }

  // Utility methods
  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  formatTime(time: string): string {
    return time;
  }

  isAppointmentInPast(): boolean {
    if (!this.appointment) return false;
    return this.appointmentsService.isAppointmentInPast(this.appointment);
  }

  getTimeRemaining(): string {
    if (!this.appointment) return '';

    const appointmentDateTime = new Date(
      `${this.appointment.date.toString().split('T')[0]}T${
        this.appointment.startTime
      }:00`
    );
    const now = new Date();
    const diff = appointmentDateTime.getTime() - now.getTime();

    if (diff <= 0) return 'Tiempo transcurrido';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) {
      return `${days} día${days > 1 ? 's' : ''} y ${hours} hora${
        hours !== 1 ? 's' : ''
      }`;
    } else if (hours > 0) {
      return `${hours} hora${hours !== 1 ? 's' : ''} y ${minutes} minuto${
        minutes !== 1 ? 's' : ''
      }`;
    } else {
      return `${minutes} minuto${minutes !== 1 ? 's' : ''}`;
    }
  }

  clearError(): void {
    this.error = '';
  }

  // Helper methods for better UX
  private showSnackBar(
    message: string,
    type: 'success' | 'error' | 'warning' | 'info' = 'info'
  ): void {
    const config = {
      duration: 4000,
      horizontalPosition: 'end' as const,
      verticalPosition: 'top' as const,
      panelClass: [`snackbar-${type}`],
    };

    this.snackBar.open(message, 'Cerrar', config);
  }

  private showConfirmationDialog(
    title: string,
    message: string,
    subMessage: string,
    confirmText: string,
    color: 'primary' | 'accent' | 'warn'
  ) {
    // For now, we'll use the native confirm dialog
    // In a full implementation, you would create a custom Material dialog component
    return {
      afterClosed: () => ({
        subscribe: (callback: (result: boolean) => void) => {
          const result = confirm(`${title}\n\n${message}\n${subMessage}`);
          callback(result);
        },
      }),
    };
  }

  // Additional helper methods for better UX
  getAppointmentDuration(): string {
    if (!this.appointment) return '';

    const start = new Date(`2000-01-01T${this.appointment.startTime}`);
    const end = new Date(`2000-01-01T${this.appointment.endTime}`);
    const diffMs = end.getTime() - start.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    return `${diffHours} hora${diffHours !== 1 ? 's' : ''}`;
  }

  isAppointmentToday(): boolean {
    if (!this.appointment) return false;

    const today = new Date();
    const appointmentDate = new Date(this.appointment.date);

    return today.toDateString() === appointmentDate.toDateString();
  }

  isAppointmentUpcoming(): boolean {
    if (!this.appointment) return false;

    const now = new Date();
    const appointmentDateTime = new Date(
      `${this.appointment.date}T${this.appointment.startTime}`
    );
    const hoursDiff =
      (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    return hoursDiff > 0 && hoursDiff <= 24;
  }

  getAppointmentStatusMessage(): string {
    if (!this.appointment) return '';

    switch (this.appointment.status) {
      case AppointmentStatus.PENDING:
        return 'Esperando confirmación de un agente';
      case AppointmentStatus.CONFIRMED:
        return 'Cita confirmada, agente asignado';
      case AppointmentStatus.COMPLETED:
        return 'Cita completada exitosamente';
      case AppointmentStatus.CANCELLED:
        return 'Cita cancelada';
      default:
        return '';
    }
  }

  // Analytics and tracking (for future implementation)
  trackViewDetail(): void {
    // Analytics tracking for viewing appointment details
    console.log('Appointment detail viewed:', this.appointment?.id);
  }

  trackActionPerformed(action: string): void {
    // Analytics tracking for actions performed
    console.log(
      'Action performed:',
      action,
      'on appointment:',
      this.appointment?.id
    );
  }
}
