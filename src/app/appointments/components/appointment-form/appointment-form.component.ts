// src/app/appointments/components/appointment-form/appointment-form.component.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
} from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil, switchMap, of } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDatepickerInputEvent } from '@angular/material/datepicker';
import {
  AppointmentCreateRequest,
  AppointmentUpdateRequest,
  AppointmentWithDetails,
  Property,
  User,
  UserRole,
  AppointmentStatus,
} from '../../../core/domain/entities/appointment.entities';
import { AppointmentsService } from '../../../core/application/services/appointments/appointments.service';

@Component({
  selector: 'app-appointment-form',
  templateUrl: './appointment-form.component.html',
  styleUrls: ['./appointment-form.component.scss'],
})
export class AppointmentFormComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  appointmentForm!: FormGroup;
  properties: Property[] = [];
  agents: User[] = [];
  currentUser: User | null = null;
  isEditMode = false;
  appointmentId: string | null = null;
  currentAppointment: AppointmentWithDetails | null = null;
  loading = false;
  saving = false;
  error: string = '';

  // Available time slots
  availableTimes: string[] = [
    '09:00',
    '10:00',
    '11:00',
    '12:00',
    '13:00',
    '14:00',
    '15:00',
    '16:00',
    '17:00',
    '18:00',
    '19:00',
  ];

  // Enums for template
  UserRole = UserRole;
  AppointmentStatus = AppointmentStatus;

  constructor(
    private fb: FormBuilder,
    private appointmentsService: AppointmentsService,
    private router: Router,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
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

    this.initializeForm();
  }

  ngOnInit(): void {
    this.checkRouteParams();
    this.loadFormData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.appointmentForm = this.fb.group({
      propertyId: ['', [Validators.required]],
      date: ['', [Validators.required]],
      startTime: ['', [Validators.required]],
      notes: [''],
      clientNotes: [''],
      agentNotes: [''],
      agentId: [''],
      status: [AppointmentStatus.PENDING],
    });

    // Set minimum date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    this.appointmentForm.get('date')?.setValue(tomorrow);
  }

  private checkRouteParams(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      if (params['id']) {
        this.appointmentId = params['id'];
        this.isEditMode = true;
        this.loadAppointmentForEdit();
      }
    });
  }

  private loadFormData(): void {
    this.loading = true;

    // Load properties
    this.appointmentsService
      .getProperties()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (properties) => {
          this.properties = properties.filter((p) => p.isActive);
          this.loading = false;
        },
        error: (error) => {
          this.error = 'Error al cargar las propiedades';
          this.loading = false;
          this.showSnackBar('Error al cargar las propiedades', 'error');
        },
      });

    // Load agents for admins and agents
    if (
      this.currentUser?.role === UserRole.ADMIN ||
      this.currentUser?.role === UserRole.AGENT
    ) {
      this.appointmentsService
        .getAgents()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (agents) => {
            this.agents = agents.filter((a) => a.isActive);
          },
          error: (error) => {
            console.error('Error loading agents:', error);
            this.showSnackBar('Error al cargar los agentes', 'warning');
          },
        });
    }
  }

  private loadAppointmentForEdit(): void {
    if (!this.appointmentId) return;

    this.loading = true;
    this.appointmentsService
      .getAppointmentById(this.appointmentId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (appointment) => {
          this.currentAppointment = appointment;
          this.populateForm(appointment);
          this.loading = false;
        },
        error: (error) => {
          this.error = 'Error al cargar la cita';
          this.loading = false;
          this.showSnackBar('Error al cargar la cita', 'error');
        },
      });
  }

  private populateForm(appointment: AppointmentWithDetails): void {
    const date = new Date(appointment.date);

    this.appointmentForm.patchValue({
      propertyId: appointment.propertyId,
      date: date,
      startTime: appointment.startTime,
      notes: appointment.notes || '',
      clientNotes: appointment.clientNotes || '',
      agentNotes: appointment.agentNotes || '',
      agentId: appointment.agentId || '',
      status: appointment.status,
    });

    // Update form permissions
    this.updateFormPermissions();
  }

  private updateFormPermissions(): void {
    if (!this.currentUser || !this.currentAppointment) return;

    const canModify = this.appointmentsService.canUserModifyAppointment(
      this.currentAppointment,
      this.currentUser
    );

    if (!canModify) {
      this.appointmentForm.disable();
      this.showSnackBar(
        'No tienes permisos para modificar esta cita',
        'warning'
      );
      return;
    }

    // Clients can only modify certain fields and only for pending appointments
    if (this.currentUser.role === UserRole.CLIENT) {
      if (this.currentAppointment.status !== AppointmentStatus.PENDING) {
        this.appointmentForm.disable();
        this.showSnackBar('Solo puedes modificar citas pendientes', 'info');
      } else {
        // Enable only client-editable fields
        this.appointmentForm.get('propertyId')?.enable();
        this.appointmentForm.get('date')?.enable();
        this.appointmentForm.get('startTime')?.enable();
        this.appointmentForm.get('notes')?.enable();
        this.appointmentForm.get('clientNotes')?.enable();

        // Disable agent/admin fields
        this.appointmentForm.get('agentNotes')?.disable();
        this.appointmentForm.get('agentId')?.disable();
        this.appointmentForm.get('status')?.disable();
      }
    }
  }

  onSubmit(): void {
    if (this.appointmentForm.invalid || this.saving) {
      this.markFormGroupTouched(this.appointmentForm);
      this.showSnackBar(
        'Por favor, completa todos los campos requeridos',
        'warning'
      );
      return;
    }

    this.saving = true;
    this.error = '';

    const formValue = this.appointmentForm.value;

    if (this.isEditMode && this.appointmentId) {
      this.updateAppointment(formValue);
    } else {
      this.createAppointment(formValue);
    }
  }

  private createAppointment(formValue: any): void {
    const appointmentData: AppointmentCreateRequest = {
      propertyId: formValue.propertyId,
      date: new Date(formValue.date),
      startTime: formValue.startTime,
      notes: formValue.notes || undefined,
    };

    this.appointmentsService
      .createAppointment(appointmentData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.saving = false;
          this.showSnackBar('Cita creada exitosamente', 'success');
          this.router.navigate(['/appointments']);
        },
        error: (error) => {
          this.saving = false;
          this.error = error.message || 'Error al crear la cita';
          this.showSnackBar(this.error, 'error');
        },
      });
  }

  private updateAppointment(formValue: any): void {
    if (!this.appointmentId) return;

    const updateData: AppointmentUpdateRequest = {};

    // Only include changed fields
    if (this.hasFieldChanged('date', formValue.date)) {
      updateData.date = new Date(formValue.date);
    }
    if (this.hasFieldChanged('startTime', formValue.startTime)) {
      updateData.startTime = formValue.startTime;
    }
    if (this.hasFieldChanged('notes', formValue.notes)) {
      updateData.notes = formValue.notes;
    }
    if (this.hasFieldChanged('clientNotes', formValue.clientNotes)) {
      updateData.clientNotes = formValue.clientNotes;
    }

    // Agent/Admin only fields
    if (
      this.currentUser?.role === UserRole.AGENT ||
      this.currentUser?.role === UserRole.ADMIN
    ) {
      if (this.hasFieldChanged('agentNotes', formValue.agentNotes)) {
        updateData.agentNotes = formValue.agentNotes;
      }
      if (this.hasFieldChanged('agentId', formValue.agentId)) {
        updateData.agentId = formValue.agentId;
      }
      if (this.hasFieldChanged('status', formValue.status)) {
        updateData.status = formValue.status;
      }
    }

    this.appointmentsService
      .updateAppointment(this.appointmentId, updateData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.saving = false;
          this.showSnackBar('Cita actualizada exitosamente', 'success');
          this.router.navigate(['/appointments']);
        },
        error: (error) => {
          this.saving = false;
          this.error = error.message || 'Error al actualizar la cita';
          this.showSnackBar(this.error, 'error');
        },
      });
  }

  private hasFieldChanged(fieldName: string, newValue: any): boolean {
    if (!this.currentAppointment) return true;

    const currentValue = (this.currentAppointment as any)[fieldName];

    if (fieldName === 'date') {
      const currentDate = new Date(currentValue).toDateString();
      const newDate = new Date(newValue).toDateString();
      return currentDate !== newDate;
    }

    return currentValue !== (newValue || '');
  }

  onCancel(): void {
    this.router.navigate(['/appointments']);
  }

  onPropertyChange(): void {
    // Could add logic to filter available times based on property
    // or show property-specific information
    const selectedProperty = this.getSelectedProperty();
    if (selectedProperty) {
      this.showSnackBar(
        `Propiedad seleccionada: ${selectedProperty.title}`,
        'info'
      );
    }
  }

  onDateChange(event: MatDatepickerInputEvent<Date>): void {
    // Could add logic to filter available times based on date
    if (event.value) {
      const selectedDate = event.value;
      const today = new Date();

      if (selectedDate < today) {
        this.appointmentForm.get('date')?.setErrors({ pastDate: true });
        this.showSnackBar('No puedes seleccionar una fecha pasada', 'warning');
      }
    }
  }

  // Helper methods for template
  getMinDate(): Date {
    const today = new Date();
    today.setDate(today.getDate() + 1); // Minimum is tomorrow
    return today;
  }

  getSelectedProperty(): Property | undefined {
    const propertyId = this.appointmentForm.get('propertyId')?.value;
    return this.properties.find((p) => p.id === propertyId);
  }

  getAvailableTimes(): string[] {
    // Could filter based on existing appointments for the selected date
    return this.availableTimes;
  }

  getEndTime(): string {
    const startTime = this.appointmentForm.get('startTime')?.value;
    if (!startTime) return '';

    const [hours, minutes] = startTime.split(':').map(Number);
    const endHour = hours + 1;
    return `${endHour.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}`;
  }

  formatDate(date: Date): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  getDayOfWeek(date: Date): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('es-ES', { weekday: 'long' });
  }

  getDateTimeFormGroup(): AbstractControl | null {
    return this.appointmentForm.get('date');
  }

  canEditField(fieldName: string): boolean {
    if (!this.currentUser) return false;

    if (this.currentUser.role === UserRole.ADMIN) return true;

    if (this.currentUser.role === UserRole.AGENT) {
      return (
        ['agentNotes', 'agentId', 'status'].includes(fieldName) ||
        !this.isEditMode ||
        this.currentAppointment?.status === AppointmentStatus.PENDING
      );
    }

    if (this.currentUser.role === UserRole.CLIENT) {
      return (
        ['propertyId', 'date', 'startTime', 'notes', 'clientNotes'].includes(
          fieldName
        ) &&
        (!this.isEditMode ||
          this.currentAppointment?.status === AppointmentStatus.PENDING)
      );
    }

    return false;
  }

  getFormTitle(): string {
    if (this.isEditMode) {
      return this.currentUser?.role === UserRole.CLIENT
        ? 'Editar Mi Cita'
        : 'Editar Cita';
    }
    return 'Nueva Cita';
  }

  getSubmitButtonText(): string {
    if (this.saving) return 'Guardando...';
    return this.isEditMode ? 'Actualizar Cita' : 'Crear Cita';
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

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach((field) => {
      const control = formGroup.get(field);
      control?.markAsTouched({ onlySelf: true });

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
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
  isFieldInvalid(fieldName: string): boolean {
    const field = this.appointmentForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getFieldError(fieldName: string): string {
    const field = this.appointmentForm.get(fieldName);
    if (!field || !field.errors || !field.touched) return '';

    const errors = field.errors;
    if (errors['required']) return 'Este campo es requerido';
    if (errors['pastDate']) return 'No puedes seleccionar una fecha pasada';
    if (errors['invalidTime']) return 'Formato de hora inválido';

    return 'Campo inválido';
  }

  // Validation helper for date
  private dateValidator(
    control: AbstractControl
  ): { [key: string]: any } | null {
    const selectedDate = new Date(control.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      return { pastDate: true };
    }

    return null;
  }
}
