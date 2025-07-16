// src/app/appointments/components/appointments-list/appointments-list.component.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, takeUntil, combineLatest } from 'rxjs';
import { PageEvent } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  AppointmentWithDetails,
  AppointmentStatus,
  AppointmentFilters,
  User,
  UserRole,
} from '../../../core/domain/entities/appointment.entities';
import { AppointmentsService } from '../../../core/application/services/appointments/appointments.service';

@Component({
  selector: 'app-appointments-list',
  templateUrl: './appointments-list.component.html',
  styleUrls: ['./appointments-list.component.scss'],
})
export class AppointmentsListComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  appointments: AppointmentWithDetails[] = [];
  filteredAppointments: AppointmentWithDetails[] = [];
  loading = false;
  error: string | null = null;
  currentUser: User | null = null;

  // Filters
  statusFilter: AppointmentStatus | 'ALL' = 'ALL';
  dateFilter: 'ALL' | 'TODAY' | 'WEEK' | 'MONTH' = 'ALL';
  searchTerm = '';

  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;

  // Enums for template
  AppointmentStatus = AppointmentStatus;
  UserRole = UserRole;

  constructor(
    protected appointmentsService: AppointmentsService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    // Get current user from localStorage (assuming JWT auth)
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
    this.loadAppointments();
    this.subscribeToState();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private subscribeToState(): void {
    combineLatest([
      this.appointmentsService.appointments$,
      this.appointmentsService.loading$,
      this.appointmentsService.error$,
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([appointments, loading, error]) => {
        this.appointments = appointments;
        this.loading = loading;
        this.error = error;
        this.applyFilters();
      });
  }

  loadAppointments(): void {
    const filters: AppointmentFilters = {
      page: this.currentPage,
      limit: this.itemsPerPage,
      sortBy: 'date',
      sortOrder: 'desc',
    };

    this.appointmentsService.loadAppointments(filters).subscribe({
      error: (error) => {
        console.error('Error loading appointments:', error);
        this.showSnackBar('Error al cargar las citas', 'error');
      },
    });
  }

  applyFilters(): void {
    let filtered = [...this.appointments];

    // Filter by status
    if (this.statusFilter !== 'ALL') {
      filtered = filtered.filter((apt) => apt.status === this.statusFilter);
    }

    // Filter by date
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (this.dateFilter) {
      case 'TODAY':
        filtered = filtered.filter((apt) => {
          const aptDate = new Date(apt.date);
          const aptDay = new Date(
            aptDate.getFullYear(),
            aptDate.getMonth(),
            aptDate.getDate()
          );
          return aptDay.getTime() === today.getTime();
        });
        break;
      case 'WEEK':
        const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter((apt) => {
          const aptDate = new Date(apt.date);
          return aptDate >= today && aptDate <= weekFromNow;
        });
        break;
      case 'MONTH':
        const monthFromNow = new Date(
          today.getFullYear(),
          today.getMonth() + 1,
          today.getDate()
        );
        filtered = filtered.filter((apt) => {
          const aptDate = new Date(apt.date);
          return aptDate >= today && aptDate <= monthFromNow;
        });
        break;
    }

    // Filter by search term
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(
        (apt) =>
          apt.property?.title.toLowerCase().includes(term) ||
          apt.property?.location.toLowerCase().includes(term) ||
          apt.client?.name.toLowerCase().includes(term) ||
          apt.agent?.name.toLowerCase().includes(term)
      );
    }

    this.filteredAppointments = filtered;
    this.totalItems = filtered.length;

    // Reset to first page if current page is out of bounds
    if (this.currentPage > this.getTotalPages() && this.getTotalPages() > 0) {
      this.currentPage = 1;
    }
  }

  onStatusFilterChange(status: AppointmentStatus | 'ALL'): void {
    this.statusFilter = status;
    this.currentPage = 1;
    this.applyFilters();
  }

  onDateFilterChange(filter: 'ALL' | 'TODAY' | 'WEEK' | 'MONTH'): void {
    this.dateFilter = filter;
    this.currentPage = 1;
    this.applyFilters();
  }

  onSearchChange(term: any | null): void {
    console.log('Search term changed:', term);
    this.searchTerm = term.data || '';
    this.currentPage = 1;
    this.applyFilters();
  }

  onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex + 1;
    this.itemsPerPage = event.pageSize;
    this.loadAppointments();
  }

  // Actions
  viewAppointment(appointment: AppointmentWithDetails): void {
    this.router.navigate(['/appointments', appointment.id]);
  }

  editAppointment(appointment: AppointmentWithDetails): void {
    if (this.canModifyAppointment(appointment)) {
      this.router.navigate(['/appointments', appointment.id, 'edit']);
    } else {
      this.showSnackBar('No tienes permisos para editar esta cita', 'warning');
    }
  }

  cancelAppointment(appointment: AppointmentWithDetails): void {
    if (this.canCancelAppointment(appointment)) {
      // Here you could use MatDialog for a more sophisticated confirmation
      if (confirm('¿Está seguro de que desea cancelar esta cita?')) {
        this.appointmentsService.cancelAppointment(appointment.id).subscribe({
          next: () => {
            this.showSnackBar('Cita cancelada exitosamente', 'success');
          },
          error: (error) => {
            console.error('Error cancelling appointment:', error);
            this.showSnackBar('Error al cancelar la cita', 'error');
          },
        });
      }
    } else {
      this.showSnackBar('No puedes cancelar esta cita', 'warning');
    }
  }

  confirmAppointment(appointment: AppointmentWithDetails): void {
    if (this.canConfirmAppointment(appointment)) {
      const agentId = this.currentUser?.id;
      if (agentId) {
        this.appointmentsService
          .confirmAppointment(appointment.id, agentId)
          .subscribe({
            next: () => {
              this.showSnackBar('Cita confirmada exitosamente', 'success');
            },
            error: (error) => {
              console.error('Error confirming appointment:', error);
              this.showSnackBar('Error al confirmar la cita', 'error');
            },
          });
      }
    } else {
      this.showSnackBar(
        'No tienes permisos para confirmar esta cita',
        'warning'
      );
    }
  }

  completeAppointment(appointment: AppointmentWithDetails): void {
    if (this.canCompleteAppointment(appointment)) {
      if (confirm('¿Confirmar que la cita fue completada?')) {
        this.appointmentsService.completeAppointment(appointment.id).subscribe({
          next: () => {
            this.showSnackBar('Cita marcada como completada', 'success');
          },
          error: (error) => {
            console.error('Error completing appointment:', error);
            this.showSnackBar('Error al completar la cita', 'error');
          },
        });
      }
    } else {
      this.showSnackBar('No puedes completar esta cita', 'warning');
    }
  }

  createNewAppointment(): void {
    this.router.navigate(['/appointments/new']);
  }

  // Permission checks
  canModifyAppointment(appointment: AppointmentWithDetails): boolean {
    if (!this.currentUser) return false;
    return this.appointmentsService.canUserModifyAppointment(
      appointment,
      this.currentUser
    );
  }

  canCancelAppointment(appointment: AppointmentWithDetails): boolean {
    if (!this.currentUser) return false;
    return this.appointmentsService.canUserCancelAppointment(
      appointment,
      this.currentUser
    );
  }

  canConfirmAppointment(appointment: AppointmentWithDetails): boolean {
    if (!this.currentUser) return false;
    return (
      (this.currentUser.role === UserRole.AGENT ||
        this.currentUser.role === UserRole.ADMIN) &&
      appointment.status === AppointmentStatus.PENDING
    );
  }

  canCompleteAppointment(appointment: AppointmentWithDetails): boolean {
    if (!this.currentUser) return false;
    return (
      (this.currentUser.role === UserRole.AGENT ||
        this.currentUser.role === UserRole.ADMIN) &&
      appointment.status === AppointmentStatus.CONFIRMED &&
      this.appointmentsService.isAppointmentInPast(appointment)
    );
  }

  // Utility methods for Material Design
  getStatusColor(
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

  formatDateTime(date: Date, time: string): string {
    const dateObj = new Date(date);
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      weekday: 'short',
    };
    return `${dateObj.toLocaleDateString('es-ES', options)}`;
  }

  isAppointmentInPast(appointment: AppointmentWithDetails): boolean {
    return this.appointmentsService.isAppointmentInPast(appointment);
  }

  getPaginatedAppointments(): AppointmentWithDetails[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredAppointments.slice(startIndex, endIndex);
  }

  getTotalPages(): number {
    return Math.ceil(this.totalItems / this.itemsPerPage);
  }

  min(a: number, b: number): number {
    return Math.min(a, b);
  }

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

  // Additional helper methods for better UX
  getAppointmentTypeIcon(appointment: AppointmentWithDetails): string {
    // You can customize this based on property type or appointment type
    return 'home';
  }

  isAppointmentToday(appointment: AppointmentWithDetails): boolean {
    const today = new Date();
    const aptDate = new Date(appointment.date);
    return today.toDateString() === aptDate.toDateString();
  }

  isAppointmentUpcoming(appointment: AppointmentWithDetails): boolean {
    const now = new Date();
    const aptDateTime = new Date(
      `${appointment.date}T${appointment.startTime}`
    );
    const hoursDiff =
      (aptDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursDiff > 0 && hoursDiff <= 24;
  }

  trackByAppointmentId(
    index: number,
    appointment: AppointmentWithDetails
  ): string {
    return appointment.id;
  }
}
