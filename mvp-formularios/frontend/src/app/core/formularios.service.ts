import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  AttendanceResult,
  CitizenRegistration,
  Organizer,
  OrganizerCategory,
  TourismEvent,
} from './models';

@Injectable({ providedIn: 'root' })
export class FormulariosService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://127.0.0.1:8003/api';

  getOrganizers(): Observable<Organizer[]> {
    return this.http.get<Organizer[]>(`${this.apiUrl}/organizadores`);
  }

  createOrganizer(payload: {
    nombre: string;
    categoria: OrganizerCategory;
    contacto: string;
  }): Observable<Organizer> {
    return this.http.post<Organizer>(`${this.apiUrl}/organizadores`, payload);
  }

  getEvents(): Observable<TourismEvent[]> {
    return this.http.get<TourismEvent[]>(`${this.apiUrl}/eventos`);
  }

  createEvent(payload: {
    organizador_id: number;
    titulo: string;
    descripcion: string;
    fecha_evento: string;
    cupo_maximo: number;
    requiere_aprobacion: boolean;
  }): Observable<TourismEvent> {
    return this.http.post<TourismEvent>(`${this.apiUrl}/eventos`, payload);
  }

  updateEvent(
    id: number,
    payload: Partial<
      Pick<TourismEvent, 'titulo' | 'descripcion' | 'fecha_evento' | 'cupo_maximo' | 'requiere_aprobacion'>
    >,
  ): Observable<TourismEvent> {
    return this.http.patch<TourismEvent>(`${this.apiUrl}/eventos/${id}`, payload);
  }

  deleteEvent(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/eventos/${id}`);
  }

  getRegistrations(eventId?: number): Observable<CitizenRegistration[]> {
    const url = eventId
      ? `${this.apiUrl}/inscripciones?evento_id=${eventId}`
      : `${this.apiUrl}/inscripciones`;
    return this.http.get<CitizenRegistration[]>(url);
  }

  getRegistration(id: number): Observable<CitizenRegistration> {
    return this.http.get<CitizenRegistration>(`${this.apiUrl}/inscripciones/${id}`);
  }

  createRegistration(
    eventId: number,
    payload: { dni_ciudadano: string; nombre_apellido: string; email: string },
  ): Observable<CitizenRegistration> {
    return this.http.post<CitizenRegistration>(
      `${this.apiUrl}/inscripciones?evento_id=${eventId}`,
      payload,
    );
  }

  decideRegistration(
    id: number,
    estado: 'APROBADO' | 'RECHAZADO',
  ): Observable<CitizenRegistration> {
    return this.http.patch<CitizenRegistration>(`${this.apiUrl}/inscripciones/${id}/estado`, {
      estado,
    });
  }

  validateAttendance(codigo_qr: string): Observable<AttendanceResult> {
    return this.http.post<AttendanceResult>(`${this.apiUrl}/asistencia/validar`, {
      codigo_qr,
    });
  }
}
