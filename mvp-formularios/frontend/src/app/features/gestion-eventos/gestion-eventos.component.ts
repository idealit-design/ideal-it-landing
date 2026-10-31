import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { FormulariosService } from '../../core/formularios.service';
import {
  CitizenRegistration,
  Organizer,
  OrganizerCategory,
  TourismEvent,
} from '../../core/models';

@Component({
  selector: 'forms-gestion-eventos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="row g-4">
      <section class="col-lg-5">
        <div class="card panel-card p-4 mb-4">
          <h2 class="h5">Organizador</h2>
          <p class="muted-label">Registre un prestador o una secretaría para habilitar eventos.</p>
          <form (ngSubmit)="createOrganizer()" class="vstack gap-3">
            <label class="form-label mb-0">Nombre
              <input class="form-control mt-1" name="organizerName" [(ngModel)]="organizerForm.nombre" required minlength="2">
            </label>
            <div class="row g-2">
              <label class="form-label col-sm-6 mb-0">Categoría
                <select class="form-select mt-1" name="organizerCategory" [(ngModel)]="organizerForm.categoria">
                  <option *ngFor="let category of categories" [ngValue]="category">{{ categoryLabel(category) }}</option>
                </select>
              </label>
              <label class="form-label col-sm-6 mb-0">Contacto
                <input class="form-control mt-1" name="organizerContact" [(ngModel)]="organizerForm.contacto" required minlength="3">
              </label>
            </div>
            <button class="btn btn-outline-success align-self-start" [disabled]="busy">Agregar organizador</button>
          </form>
        </div>

        <div class="card panel-card p-4">
          <h2 class="h5">Crear evento gratuito</h2>
          <form (ngSubmit)="createEvent()" class="vstack gap-3">
            <label class="form-label mb-0">Organizador
              <select class="form-select mt-1" name="eventOrganizer" [(ngModel)]="eventForm.organizador_id" required>
                <option [ngValue]="0" disabled>Seleccione un organizador</option>
                <option *ngFor="let organizer of organizers" [ngValue]="organizer.id">{{ organizer.nombre }} · {{ categoryLabel(organizer.categoria) }}</option>
              </select>
            </label>
            <label class="form-label mb-0">Título
              <input class="form-control mt-1" name="eventTitle" [(ngModel)]="eventForm.titulo" required minlength="3">
            </label>
            <label class="form-label mb-0">Descripción
              <textarea class="form-control mt-1" name="eventDescription" [(ngModel)]="eventForm.descripcion" rows="2"></textarea>
            </label>
            <div class="row g-2">
              <label class="form-label col-sm-7 mb-0">Fecha y hora
                <input class="form-control mt-1" type="datetime-local" name="eventDate" [(ngModel)]="eventForm.fecha_evento" required>
              </label>
              <label class="form-label col-sm-5 mb-0">Cupo
                <input class="form-control mt-1" type="number" min="1" name="eventCapacity" [(ngModel)]="eventForm.cupo_maximo" required>
              </label>
            </div>
            <div class="form-check">
              <input class="form-check-input" id="requiresApproval" type="checkbox" name="requiresApproval" [(ngModel)]="eventForm.requiere_aprobacion">
              <label class="form-check-label" for="requiresApproval">Requiere aprobación del organizador</label>
            </div>
            <button class="btn btn-success align-self-start" [disabled]="busy || organizers.length === 0">Publicar evento</button>
            <p *ngIf="organizers.length === 0" class="small text-warning-emphasis mb-0">Primero agregue un organizador.</p>
          </form>
        </div>
      </section>

      <section class="col-lg-7">
        <div class="card panel-card p-4 mb-4">
          <div class="d-flex justify-content-between align-items-center">
            <div><h2 class="h5 mb-1">Eventos publicados</h2><p class="muted-label mb-0">Aforo e inscripciones del portal ciudadano.</p></div>
            <button class="btn btn-sm btn-outline-secondary" (click)="refresh()">Actualizar</button>
          </div>
          <div *ngIf="events.length === 0" class="alert alert-light border mt-3 mb-0">Todavía no hay eventos publicados.</div>
          <article *ngFor="let event of events" class="event-card border rounded-3 p-3 mt-3">
            <div class="d-flex flex-wrap justify-content-between gap-2">
              <div><h3 class="h6 mb-1">{{ event.titulo }}</h3><div class="small text-secondary">{{ event.organizador_nombre }} · {{ event.fecha_evento | date:'medium' }}</div></div>
              <span class="badge" [class.text-bg-warning]="event.requiere_aprobacion" [class.text-bg-success]="!event.requiere_aprobacion">{{ event.requiere_aprobacion ? 'Con aprobación' : 'Inscripción directa' }}</span>
            </div>
            <div class="small mt-2">Cupo: {{ event.inscriptos }}/{{ event.cupo_maximo }} · Disponibles: {{ event.cupos_disponibles }}</div>
            <form *ngIf="editingEventId === event.id" class="row g-2 mt-2" (ngSubmit)="saveEvent(event)">
              <label class="col-md-6 small">Título<input class="form-control form-control-sm" name="editTitle" [(ngModel)]="editForm.titulo" required></label>
              <label class="col-md-6 small">Fecha y hora<input class="form-control form-control-sm" type="datetime-local" name="editDate" [(ngModel)]="editForm.fecha_evento" required></label>
              <label class="col-md-8 small">Descripción<input class="form-control form-control-sm" name="editDescription" [(ngModel)]="editForm.descripcion"></label>
              <label class="col-md-4 small">Cupo<input class="form-control form-control-sm" type="number" min="1" name="editCapacity" [(ngModel)]="editForm.cupo_maximo" required></label>
              <label class="col-12 form-check ms-2"><input class="form-check-input" type="checkbox" name="editApproval" [(ngModel)]="editForm.requiere_aprobacion"><span class="form-check-label">Requiere aprobación</span></label>
              <div class="col-12 d-flex gap-2"><button class="btn btn-sm btn-success">Guardar cambios</button><button type="button" class="btn btn-sm btn-outline-secondary" (click)="editingEventId = null">Cancelar</button></div>
            </form>
            <div class="d-flex gap-2 mt-2">
              <button class="btn btn-sm btn-outline-success" (click)="startEdit(event)">Editar evento</button>
              <button class="btn btn-sm btn-outline-danger" (click)="deleteEvent(event.id)">Eliminar evento</button>
            </div>
          </article>
        </div>

        <div class="card panel-card p-4">
          <h2 class="h5">Solicitudes de inscripción</h2>
          <p class="muted-label">Apruebe para emitir el QR o rechace la solicitud.</p>
          <div *ngIf="pending.length === 0" class="alert alert-light border mb-0">No hay solicitudes pendientes.</div>
          <div *ngFor="let registration of pending" class="border-top py-3 d-flex flex-wrap justify-content-between align-items-center gap-2">
            <div><strong>{{ registration.nombre_apellido }}</strong><div class="small text-secondary">{{ registration.evento_titulo }} · DNI {{ registration.dni_ciudadano }}</div></div>
            <div class="d-flex gap-2">
              <button class="btn btn-sm btn-success" (click)="decide(registration, 'APROBADO')">Aprobar</button>
              <button class="btn btn-sm btn-outline-danger" (click)="decide(registration, 'RECHAZADO')">Rechazar</button>
            </div>
          </div>
        </div>
      </section>
    </div>
    <div *ngIf="message" class="alert mt-3" [class.alert-danger]="isError" [class.alert-success]="!isError" role="status">{{ message }}</div>
  `,
})
export class GestionEventosComponent implements OnInit {
  private readonly api = inject(FormulariosService);
  readonly categories: OrganizerCategory[] = [
    'MUSEO',
    'BOLICHE',
    'RESTAURANTE',
    'SECRETARIA_MUNICIPAL',
  ];
  organizers: Organizer[] = [];
  events: TourismEvent[] = [];
  pending: CitizenRegistration[] = [];
  busy = false;
  message = '';
  isError = false;
  editingEventId: number | null = null;
  editForm = {
    titulo: '',
    descripcion: '',
    fecha_evento: '',
    cupo_maximo: 1,
    requiere_aprobacion: false,
  };
  organizerForm = { nombre: '', categoria: 'MUSEO' as OrganizerCategory, contacto: '' };
  eventForm = {
    organizador_id: 0,
    titulo: '',
    descripcion: '',
    fecha_evento: new Date(Date.now() + 86_400_000).toISOString().slice(0, 16),
    cupo_maximo: 30,
    requiere_aprobacion: true,
  };

  ngOnInit(): void {
    this.refresh();
  }

  categoryLabel(category: OrganizerCategory): string {
    return category.replaceAll('_', ' ').toLowerCase().replace(/^\w/, (letter) => letter.toUpperCase());
  }

  refresh(): void {
    this.api.getOrganizers().subscribe({
      next: (rows) => (this.organizers = rows),
      error: (error: unknown) => this.showError(error),
    });
    this.api.getEvents().subscribe({
      next: (rows) => (this.events = rows),
      error: (error: unknown) => this.showError(error),
    });
    this.api.getRegistrations().subscribe({
      next: (rows) => (this.pending = rows.filter((row) => row.estado === 'PENDIENTE')),
      error: (error: unknown) => this.showError(error),
    });
  }

  createOrganizer(): void {
    this.busy = true;
    this.api.createOrganizer(this.organizerForm).subscribe({
      next: () => {
        this.organizerForm = { nombre: '', categoria: 'MUSEO', contacto: '' };
        this.message = 'Organizador agregado.';
        this.isError = false;
        this.busy = false;
        this.refresh();
      },
      error: (error: unknown) => {
        this.busy = false;
        this.showError(error);
      },
    });
  }

  createEvent(): void {
    this.busy = true;
    this.api.createEvent({
      ...this.eventForm,
      fecha_evento: new Date(this.eventForm.fecha_evento).toISOString(),
    }).subscribe({
      next: () => {
        this.eventForm.titulo = '';
        this.eventForm.descripcion = '';
        this.message = 'Evento publicado en el portal ciudadano.';
        this.isError = false;
        this.busy = false;
        this.refresh();
      },
      error: (error: unknown) => {
        this.busy = false;
        this.showError(error);
      },
    });
  }

  decide(registration: CitizenRegistration, estado: 'APROBADO' | 'RECHAZADO'): void {
    this.api.decideRegistration(registration.id, estado).subscribe({
      next: () => {
        this.message = estado === 'APROBADO' ? 'Solicitud aprobada; QR emitido.' : 'Solicitud rechazada.';
        this.isError = false;
        this.refresh();
      },
      error: (error: unknown) => this.showError(error),
    });
  }

  startEdit(event: TourismEvent): void {
    this.editingEventId = event.id;
    this.editForm = {
      titulo: event.titulo,
      descripcion: event.descripcion,
      fecha_evento: new Date(event.fecha_evento).toISOString().slice(0, 16),
      cupo_maximo: event.cupo_maximo,
      requiere_aprobacion: event.requiere_aprobacion,
    };
  }

  saveEvent(event: TourismEvent): void {
    this.api.updateEvent(event.id, {
      ...this.editForm,
      fecha_evento: new Date(this.editForm.fecha_evento).toISOString(),
    }).subscribe({
      next: () => {
        this.editingEventId = null;
        this.message = 'Evento actualizado.';
        this.isError = false;
        this.refresh();
      },
      error: (error: unknown) => this.showError(error),
    });
  }

  deleteEvent(id: number): void {
    this.api.deleteEvent(id).subscribe({
      next: () => {
        this.message = 'Evento eliminado.';
        this.isError = false;
        this.refresh();
      },
      error: (error: unknown) => this.showError(error),
    });
  }

  private showError(error: unknown): void {
    this.isError = true;
    this.message =
      error instanceof HttpErrorResponse
        ? error.error?.detail ?? error.message
        : error instanceof Error
          ? error.message
          : 'No se pudo completar la operación. Verifique la conexión con la API.';
  }
}
