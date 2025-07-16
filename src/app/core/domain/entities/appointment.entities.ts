// src/app/core/domain/entities/appointment.entities.ts

export enum AppointmentStatus {
  PENDING = 'Pendiente',
  CONFIRMED = 'Confirmada',
  COMPLETED = 'Completada',
  CANCELLED = 'Cancelada',
}

export enum UserRole {
  ADMIN = 'Administrador',
  AGENT = 'Agente',
  CLIENT = 'Cliente',
}

export interface Appointment {
  id: string;
  propertyId: string;
  clientId: string;
  agentId?: string;
  date: Date;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  notes?: string;
  clientNotes?: string;
  agentNotes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AppointmentWithDetails extends Appointment {
  property?: {
    id: string;
    title: string;
    location: string;
    imageUrl: string;
    price: number;
    area?: string;
    bedrooms?: number;
    bathrooms?: number;
  };
  client?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  agent?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
}

export interface AppointmentCreateRequest {
  propertyId: string;
  date: Date;
  startTime: string;
  notes?: string;
}

export interface AppointmentUpdateRequest {
  date?: Date;
  startTime?: string;
  status?: AppointmentStatus;
  notes?: string;
  clientNotes?: string;
  agentNotes?: string;
  agentId?: string;
}

export interface AppointmentFilters {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  propertyId?: string;
  clientId?: string;
  agentId?: string;
  status?: AppointmentStatus;
  dateFrom?: Date;
  dateTo?: Date;
  location?: string;
}

export interface Property {
  id: string;
  title: string;
  imageUrl: string;
  location: string;
  price: number;
  area: number;
  bedrooms: number;
  bathrooms: number;
  parking: number;
  propertyType?: string;
  description?: string;
  amenities?: string[];
  isActive?: boolean;
  agentId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  photo?: string;
  createdAt?: Date;
  updatedAt?: Date;
  isActive?: boolean;
  phone?: string;
  address?: string;
  birthDate?: Date;
}

export interface ApiResponse<T> {
  message: string;
  data: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
