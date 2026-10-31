import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuditoriaService, Provider } from '../../core/services/auditoria.service';

@Component({
  selector: 'audit-dashboard',
  standalone: true,
  imports: [FormsModule],
  template: `
    <section class="card stack">
      <h2>Prestadores auditados</h2>
      <form class="stack" (ngSubmit)="create()">
        <div class="row"><input name="dni" [(ngModel)]="form.dni" placeholder="DNI" required /><input name="cuit" [(ngModel)]="form.cuit" placeholder="CUIT (11 dígitos)" required /></div>
        <div class="row"><input name="nombre" [(ngModel)]="form.nombre" placeholder="Nombre" required /><input name="apellido" [(ngModel)]="form.apellido" placeholder="Apellido" required /></div>
        <input name="especialidad" [(ngModel)]="form.especialidad" placeholder="Especialidad" required />
        <button type="submit" [disabled]="saving">Registrar prestador</button>
      </form>
      @if (error) { <p class="error">{{ error }}</p> }
      <ul class="list">
        @for (provider of providers; track provider.dni) {
          <li><strong>{{ provider.apellido }}, {{ provider.nombre }}</strong> · {{ provider.especialidad }}<br><small class="muted">DNI {{ provider.dni }} · Matrícula {{ provider.estado_matricula }} · Identidad {{ provider.estado_renaper }}</small></li>
        }
      </ul>
    </section>
  `,
})
export class AuditoriaDashboardComponent {
  private readonly service = inject(AuditoriaService);
  providers: Provider[] = [];
  form = { dni: '', cuit: '', nombre: '', apellido: '', especialidad: '' };
  saving = false;
  error = '';

  constructor() { this.load(); }

  load(): void {
    this.service.providers().subscribe({
      next: (providers) => (this.providers = providers),
      error: () => (this.error = 'No se pudieron cargar los prestadores.'),
    });
  }

  create(): void {
    this.saving = true;
    this.error = '';
    this.service.createProvider(this.form).subscribe({
      next: (provider) => {
        this.providers = [...this.providers, provider];
        this.form = { dni: '', cuit: '', nombre: '', apellido: '', especialidad: '' };
        this.saving = false;
      },
      error: (error: { error?: { detail?: string } }) => {
        this.error = error.error?.detail ?? 'No se pudo registrar el prestador.';
        this.saving = false;
      },
    });
  }
}
