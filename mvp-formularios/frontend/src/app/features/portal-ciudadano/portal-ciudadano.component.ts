import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { FormulariosService } from '../../core/formularios.service';
import { CitizenRegistration, TourismEvent } from '../../core/models';

@Component({
  selector: 'forms-portal-ciudadano',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="card panel-card p-4 p-lg-5 mb-4 bg-white">
      <div class="row align-items-center g-4">
        <div class="col-lg-8">
          <span class="badge rounded-pill text-bg-success-subtle text-success-emphasis mb-3">Agenda municipal abierta</span>
          <h2 class="display-6 fw-bold">Encontrá tu próximo plan</h2>
          <p class="text-secondary mb-0">Los formularios habilitados aparecen aquí al instante. Elegí una actividad gratuita y reservá tu lugar.</p>
        </div>
        <div class="col-lg-4 text-lg-end"><span class="display-4" aria-hidden="true">🌿</span><div class="small text-secondary">Turismo · Cultura · Comunidad</div></div>
      </div>
    </section>

    <div class="d-flex justify-content-between align-items-end mb-3">
      <div><h2 class="h4 mb-1">Actividades disponibles</h2><p class="muted-label mb-0">Vista previa del portal ciudadano</p></div>
      <button class="btn btn-sm btn-outline-secondary" (click)="loadEvents()">Actualizar</button>
    </div>
    <div *ngIf="events.length === 0" class="card panel-card p-5 text-center">
      <div class="display-6 mb-2">🗓️</div><h3 class="h5">Próximamente nuevas actividades</h3>
      <p class="text-secondary mb-0">Cuando una secretaría o prestador publique un evento, su formulario aparecerá en esta sección.</p>
    </div>
    <div class="row g-3">
      <div class="col-md-6 col-xl-4" *ngFor="let event of events">
        <article class="card panel-card event-card h-100 p-4">
          <div class="d-flex justify-content-between gap-2 mb-3"><span class="badge text-bg-light">{{ event.categoria_organizador.replace('_', ' ') }}</span><span class="small text-success fw-semibold">GRATUITO</span></div>
          <h3 class="h5">{{ event.titulo }}</h3>
          <p class="text-secondary flex-grow-1">{{ event.descripcion || 'Una actividad para disfrutar en comunidad.' }}</p>
          <div class="small mb-1">{{ event.fecha_evento | date:'fullDate' }} · {{ event.fecha_evento | date:'shortTime' }}</div>
          <div class="small text-secondary mb-3">{{ event.organizador_nombre }} · {{ event.cupos_disponibles }} cupos disponibles</div>
          <button class="btn btn-success" [disabled]="event.cupos_disponibles === 0" (click)="selectedEvent = event">Inscribirme</button>
        </article>
      </div>
    </div>

    <div *ngIf="selectedEvent" class="card panel-card p-4 mt-4">
      <div class="d-flex justify-content-between align-items-start"><div><h3 class="h5">Inscripción: {{ selectedEvent.titulo }}</h3><p class="muted-label">{{ selectedEvent.requiere_aprobacion ? 'El organizador confirmará tu solicitud.' : 'La confirmación es inmediata.' }}</p></div><button class="btn-close" aria-label="Cerrar formulario" (click)="selectedEvent = null"></button></div>
      <form class="row g-3" (ngSubmit)="register()">
        <label class="col-md-4 form-label">DNI
          <input class="form-control mt-1" name="dni" [(ngModel)]="form.dni_ciudadano" minlength="6" required>
        </label>
        <label class="col-md-4 form-label">Nombre y apellido
          <input class="form-control mt-1" name="name" [(ngModel)]="form.nombre_apellido" required minlength="3">
        </label>
        <label class="col-md-4 form-label">Correo electrónico
          <input class="form-control mt-1" type="email" name="email" [(ngModel)]="form.email" required>
        </label>
        <div class="col-12"><button class="btn btn-success" [disabled]="submitting">Enviar inscripción</button></div>
      </form>
    </div>

    <div *ngIf="result" class="alert mt-4" [class.alert-success]="result.estado === 'APROBADO'" [class.alert-warning]="result.estado === 'PENDIENTE'" role="status">
      <div class="d-flex flex-wrap align-items-center justify-content-between gap-3">
        <div><strong>{{ result.estado === 'APROBADO' ? '¡Inscripción confirmada!' : 'Solicitud enviada' }}</strong><div>{{ result.evento_titulo }} · {{ result.nombre_apellido }}</div><div class="small">{{ result.estado === 'PENDIENTE' ? 'Recibirás el QR cuando el organizador apruebe tu solicitud.' : 'Presentá este QR al ingresar al evento.' }}</div></div>
        <img *ngIf="result.qr_data_url" class="qr-preview bg-white rounded p-2" [src]="result.qr_data_url" alt="Código QR de acceso">
        <button *ngIf="result.estado === 'PENDIENTE'" class="btn btn-sm btn-outline-success" (click)="refreshRegistration()">Consultar estado</button>
      </div>
    </div>
    <div *ngIf="error" class="alert alert-danger mt-3" role="alert">{{ error }}</div>
  `,
})
export class PortalCiudadanoComponent implements OnInit {
  private readonly api = inject(FormulariosService);
  events: TourismEvent[] = [];
  selectedEvent: TourismEvent | null = null;
  result: CitizenRegistration | null = null;
  submitting = false;
  error = '';
  form = { dni_ciudadano: '', nombre_apellido: '', email: '' };

  ngOnInit(): void {
    this.loadEvents();
  }

  loadEvents(): void {
    this.api.getEvents().subscribe({
      next: (events) => (this.events = events),
      error: () => (this.error = 'No se pudieron cargar los eventos. Confirme que la API local esté activa.'),
    });
  }

  register(): void {
    if (!this.selectedEvent) return;
    this.submitting = true;
    this.error = '';
    this.api.createRegistration(this.selectedEvent.id, this.form).subscribe({
      next: (registration) => {
        this.result = registration;
        this.form = { dni_ciudadano: '', nombre_apellido: '', email: '' };
        this.selectedEvent = null;
        this.submitting = false;
        this.loadEvents();
      },
      error: (error: { error?: { detail?: string } }) => {
        this.error = error.error?.detail ?? 'No se pudo completar la inscripción.';
        this.submitting = false;
      },
    });
  }

  refreshRegistration(): void {
    if (!this.result) return;
    this.api.getRegistration(this.result.id).subscribe({
      next: (registration) => {
        this.result = registration;
        this.error = '';
      },
      error: (error: { error?: { detail?: string } }) => {
        this.error = error.error?.detail ?? 'No se pudo consultar el estado de la inscripción.';
      },
    });
  }
}
