import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { GestionEventosComponent } from './features/gestion-eventos/gestion-eventos.component';
import { PortalCiudadanoComponent } from './features/portal-ciudadano/portal-ciudadano.component';
import { ScannerAsistenciaComponent } from './features/scanner-asistencia/scanner-asistencia.component';

type ActiveSection = 'portal' | 'gestion' | 'scanner';

@Component({
  selector: 'forms-root',
  standalone: true,
  imports: [
    CommonModule,
    GestionEventosComponent,
    PortalCiudadanoComponent,
    ScannerAsistenciaComponent,
  ],
  template: `
    <main class="app-shell container py-4 py-lg-5">
      <header class="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div class="d-flex align-items-center gap-3">
          <div class="brand-mark rounded-4 px-3 py-2 fw-bold">IT</div>
          <div>
            <div class="small text-uppercase fw-semibold text-success">Ideal-IT · Demo local</div>
            <h1 class="h3 mb-0">Turismo y eventos municipales</h1>
          </div>
        </div>
        <span class="badge text-bg-success-subtle text-success-emphasis border px-3 py-2">
          Formularios v0.1.2 · SQLite aislada
        </span>
      </header>

      <nav class="nav nav-pills flex-wrap gap-2 mb-4" aria-label="Secciones">
        <button class="nav-link" [class.active]="section === 'portal'" (click)="section = 'portal'">
          Portal ciudadano
        </button>
        <button class="nav-link" [class.active]="section === 'gestion'" (click)="section = 'gestion'">
          Gestión de eventos
        </button>
        <button class="nav-link" [class.active]="section === 'scanner'" (click)="section = 'scanner'">
          Escáner de asistencia
        </button>
      </nav>

      <forms-portal-ciudadano *ngIf="section === 'portal'" />
      <forms-gestion-eventos *ngIf="section === 'gestion'" />
      <forms-scanner-asistencia *ngIf="section === 'scanner'" />

      <footer class="border-top mt-5 pt-3 small text-secondary">
        MVP local de demostración. Utilice datos ficticios; no procesa información en servicios externos.
      </footer>
    </main>
  `,
})
export class AppComponent {
  section: ActiveSection = 'portal';
}
