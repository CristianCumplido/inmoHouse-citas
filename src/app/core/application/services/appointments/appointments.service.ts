// src/app/core/application/services/appointments.service.ts

import { Injectable } from '@angular/core';
import {
  Observable,
  BehaviorSubject,
  map,
  tap,
  catchError,
  throwError,
} from 'rxjs';
import {
  Appointment,
  AppointmentWithDetails,
  AppointmentCreateRequest,
  AppointmentUpdateRequest,
  AppointmentFilters,
  AppointmentStatus,
  Property,
  User,
  UserRole,
} from '../../../domain/entities/appointment.entities';
import { AppointmentsApiService } from '../../../infrastructure/services/appointment-api/appointment-api.service';

@Injectable({
  providedIn: 'root',
})
export class AppointmentsService {
  private appointmentsSubject = new BehaviorSubject<AppointmentWithDetails[]>(
    []
  );
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string | null>(null);

  public appointments$ = this.appointmentsSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();
  public error$ = this.errorSubject.asObservable();

  constructor(private apiService: AppointmentsApiService) {}

  // CRUD Operations
  createAppointment(
    appointment: AppointmentCreateRequest
  ): Observable<Appointment> {
    this.setLoading(true);
    this.setError(null);

    return this.apiService.createAppointment(appointment).pipe(
      map((response) => response.data),
      tap(() => {
        this.loadAppointments(); // Refresh list
        this.setLoading(false);
      }),
      catchError((error) => {
        this.setLoading(false);
        this.setError(this.extractErrorMessage(error));
        return throwError(() => error);
      })
    );
  }

  loadAppointments(
    filters?: AppointmentFilters
  ): Observable<AppointmentWithDetails[]> {
    this.setLoading(true);
    this.setError(null);

    return this.apiService.getAppointments(filters).pipe(
      map((response) => response.data),
      tap((appointments) => {
        this.appointmentsSubject.next(appointments);
        this.setLoading(false);
      }),
      catchError((error) => {
        this.setLoading(false);
        this.setError(this.extractErrorMessage(error));
        return throwError(() => error);
      })
    );
  }

  getAppointmentById(id: string): Observable<AppointmentWithDetails> {
    this.setLoading(true);
    this.setError(null);

    return this.apiService.getAppointmentById(id).pipe(
      map((response) => response.data),
      tap(() => this.setLoading(false)),
      catchError((error) => {
        this.setLoading(false);
        this.setError(this.extractErrorMessage(error));
        return throwError(() => error);
      })
    );
  }

  updateAppointment(
    id: string,
    updates: AppointmentUpdateRequest
  ): Observable<Appointment> {
    this.setLoading(true);
    this.setError(null);

    return this.apiService.updateAppointment(id, updates).pipe(
      map((response) => response.data),
      tap(() => {
        this.loadAppointments(); // Refresh list
        this.setLoading(false);
      }),
      catchError((error) => {
        this.setLoading(false);
        this.setError(this.extractErrorMessage(error));
        return throwError(() => error);
      })
    );
  }

  cancelAppointment(id: string): Observable<Appointment> {
    this.setLoading(true);
    this.setError(null);

    return this.apiService.cancelAppointment(id).pipe(
      map((response) => response.data),
      tap(() => {
        this.loadAppointments(); // Refresh list
        this.setLoading(false);
      }),
      catchError((error) => {
        this.setLoading(false);
        this.setError(this.extractErrorMessage(error));
        return throwError(() => error);
      })
    );
  }

  confirmAppointment(id: string, agentId: string): Observable<Appointment> {
    this.setLoading(true);
    this.setError(null);

    return this.apiService.confirmAppointment(id, agentId).pipe(
      map((response) => response.data),
      tap(() => {
        this.loadAppointments(); // Refresh list
        this.setLoading(false);
      }),
      catchError((error) => {
        this.setLoading(false);
        this.setError(this.extractErrorMessage(error));
        return throwError(() => error);
      })
    );
  }

  completeAppointment(id: string): Observable<Appointment> {
    this.setLoading(true);
    this.setError(null);

    return this.apiService.completeAppointment(id).pipe(
      map((response) => response.data),
      tap(() => {
        this.loadAppointments(); // Refresh list
        this.setLoading(false);
      }),
      catchError((error) => {
        this.setLoading(false);
        this.setError(this.extractErrorMessage(error));
        return throwError(() => error);
      })
    );
  }

  // Helper methods for forms
  getProperties(): Observable<Property[]> {
    return this.apiService.getProperties().pipe(
      map((response) => response.data),
      catchError((error) => {
        this.setError(this.extractErrorMessage(error));
        return throwError(() => error);
      })
    );
  }

  getAgents(): Observable<User[]> {
    return this.apiService.getAgents().pipe(
      map((response) => response.data),
      catchError((error) => {
        this.setError(this.extractErrorMessage(error));
        return throwError(() => error);
      })
    );
  }

  // Utility methods
  canUserModifyAppointment(
    appointment: AppointmentWithDetails,
    currentUser: User
  ): boolean {
    if (currentUser.role === UserRole.ADMIN) return true;
    if (currentUser.role === UserRole.AGENT) return true;
    if (
      currentUser.role === UserRole.CLIENT &&
      appointment.clientId === currentUser.id
    ) {
      return appointment.status === AppointmentStatus.PENDING;
    }
    return false;
  }

  canUserCancelAppointment(
    appointment: AppointmentWithDetails,
    currentUser: User
  ): boolean {
    if (currentUser.role === UserRole.ADMIN) return true;
    if (currentUser.role === UserRole.AGENT) return true;
    if (
      currentUser.role === UserRole.CLIENT &&
      appointment.clientId === currentUser.id
    ) {
      return (
        appointment.status === AppointmentStatus.PENDING ||
        appointment.status === AppointmentStatus.CONFIRMED
      );
    }
    return false;
  }

  isAppointmentInPast(appointment: AppointmentWithDetails): boolean {
    const appointmentDateTime = new Date(
      `${appointment.date.toString().split('T')[0]}T${appointment.startTime}:00`
    );
    return appointmentDateTime < new Date();
  }

  getStatusColor(status: AppointmentStatus): string {
    switch (status) {
      case AppointmentStatus.PENDING:
        return 'warning';
      case AppointmentStatus.CONFIRMED:
        return 'primary';
      case AppointmentStatus.COMPLETED:
        return 'success';
      case AppointmentStatus.CANCELLED:
        return 'danger';
      default:
        return 'secondary';
    }
  }

  // State management helpers
  private setLoading(loading: boolean): void {
    this.loadingSubject.next(loading);
  }

  private setError(error: string | null): void {
    this.errorSubject.next(error);
  }

  private extractErrorMessage(error: any): string {
    if (error?.error?.message) {
      return error.error.message;
    }
    if (error?.message) {
      return error.message;
    }
    return 'An unexpected error occurred';
  }

  // Clear state
  clearError(): void {
    this.setError(null);
  }

  clearAppointments(): void {
    this.appointmentsSubject.next([]);
  }
}
