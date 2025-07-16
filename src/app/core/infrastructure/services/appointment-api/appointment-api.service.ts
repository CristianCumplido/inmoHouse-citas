// src/app/core/infrastructure/services/appointments-api.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Appointment,
  AppointmentWithDetails,
  AppointmentCreateRequest,
  AppointmentUpdateRequest,
  AppointmentFilters,
  ApiResponse,
  Property,
  User,
} from '../../../domain/entities/appointment.entities';
import { environment } from 'src/environment/environment';

@Injectable({
  providedIn: 'root',
})
export class AppointmentsApiService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Appointments CRUD
  createAppointment(
    appointment: AppointmentCreateRequest
  ): Observable<ApiResponse<Appointment>> {
    return this.http.post<ApiResponse<Appointment>>(
      `${this.apiUrl}/appointments`,
      appointment,
      { headers: this.getHeaders() }
    );
  }

  getAppointments(
    filters?: AppointmentFilters
  ): Observable<ApiResponse<AppointmentWithDetails[]>> {
    let params = new HttpParams();

    if (filters) {
      Object.keys(filters).forEach((key) => {
        const value = (filters as any)[key];
        if (value !== undefined && value !== null) {
          if (value instanceof Date) {
            params = params.set(key, value.toISOString());
          } else {
            params = params.set(key, value.toString());
          }
        }
      });
    }

    return this.http.get<ApiResponse<AppointmentWithDetails[]>>(
      `${this.apiUrl}/appointments`,
      {
        headers: this.getHeaders(),
        params,
      }
    );
  }

  getAppointmentById(
    id: string
  ): Observable<ApiResponse<AppointmentWithDetails>> {
    return this.http.get<ApiResponse<AppointmentWithDetails>>(
      `${this.apiUrl}/appointments/${id}`,
      { headers: this.getHeaders() }
    );
  }

  getAppointmentsByProperty(
    propertyId: string,
    filters?: AppointmentFilters
  ): Observable<ApiResponse<AppointmentWithDetails[]>> {
    let params = new HttpParams();

    if (filters) {
      Object.keys(filters).forEach((key) => {
        const value = (filters as any)[key];
        if (value !== undefined && value !== null) {
          if (value instanceof Date) {
            params = params.set(key, value.toISOString());
          } else {
            params = params.set(key, value.toString());
          }
        }
      });
    }

    return this.http.get<ApiResponse<AppointmentWithDetails[]>>(
      `${this.apiUrl}/appointments/property/${propertyId}`,
      {
        headers: this.getHeaders(),
        params,
      }
    );
  }

  updateAppointment(
    id: string,
    updates: AppointmentUpdateRequest
  ): Observable<ApiResponse<Appointment>> {
    return this.http.put<ApiResponse<Appointment>>(
      `${this.apiUrl}/appointments/${id}`,
      updates,
      { headers: this.getHeaders() }
    );
  }

  cancelAppointment(id: string): Observable<ApiResponse<Appointment>> {
    return this.http.patch<ApiResponse<Appointment>>(
      `${this.apiUrl}/appointments/${id}/cancel`,
      {},
      { headers: this.getHeaders() }
    );
  }

  confirmAppointment(
    id: string,
    agentId: string
  ): Observable<ApiResponse<Appointment>> {
    return this.http.patch<ApiResponse<Appointment>>(
      `${this.apiUrl}/appointments/${id}/confirm`,
      { agentId },
      { headers: this.getHeaders() }
    );
  }

  completeAppointment(id: string): Observable<ApiResponse<Appointment>> {
    return this.http.patch<ApiResponse<Appointment>>(
      `${this.apiUrl}/appointments/${id}/complete`,
      {},
      { headers: this.getHeaders() }
    );
  }

  // Properties (para seleccionar en el formulario)
  getProperties(): Observable<ApiResponse<Property[]>> {
    return this.http.get<ApiResponse<Property[]>>(`${this.apiUrl}/properties`, {
      headers: this.getHeaders(),
    });
  }

  getPropertyById(id: string): Observable<ApiResponse<Property>> {
    return this.http.get<ApiResponse<Property>>(
      `${this.apiUrl}/properties/${id}`,
      { headers: this.getHeaders() }
    );
  }

  // Users (para obtener agentes)
  getAgents(): Observable<ApiResponse<User[]>> {
    return this.http.get<ApiResponse<User[]>>(
      `${this.apiUrl}/users?role=Agente`,
      { headers: this.getHeaders() }
    );
  }

  private getHeaders(): HttpHeaders {
    const token = sessionStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : '',
    });
  }
}
