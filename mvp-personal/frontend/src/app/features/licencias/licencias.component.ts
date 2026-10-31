import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { License, LicenciasService } from '../../core/services/licencias.service';

@Component({
  selector: 'mvp-licencias',
  standalone: true,
  imports: [FormsModule],
  template: `
    <section class="card">
      <h2 class="text-xl font-bold">Licencias y vacaciones</h2>
      <form class="mt-4 grid gap-3 sm:grid-cols-2" (ngSubmit)="create()">
        <input name="dni" [(ngModel)]="dni" placeholder="DNI del personal" required />
        <select name="tipo" [(ngModel)]="tipo">
          <option value="MEDICA">Médica</option><option value="VACACION">Vacaciones</option><option value="OTRO">Otro</option>
        </select>
        <label class="text-sm text-slate-400">Desde<input class="mt-1 w-full" type="date" name="inicio" [(ngModel)]="inicio" required /></label>
        <label class="text-sm text-slate-400">Hasta<input class="mt-1 w-full" type="date" name="fin" [(ngModel)]="fin" required /></label>
        <input class="sm:col-span-2" name="motivo" [(ngModel)]="motivo" placeholder="Motivo" />
        <button class="sm:col-span-2" type="submit" [disabled]="saving">Registrar licencia aprobada</button>
      </form>
      @if (error) { <p class="mt-3 text-sm text-rose-300">{{ error }}</p> }
      <ul class="mt-4 divide-y divide-slate-800">
        @for (license of licenses; track license.id) {
          <li class="py-2 text-sm text-slate-300">{{ license.dni }} · {{ license.tipo }} · {{ license.fecha_inicio }} — {{ license.fecha_fin }} · {{ license.estado }}</li>
        }
      </ul>
    </section>
  `,
})
export class LicenciasComponent {
  private readonly service = inject(LicenciasService);
  licenses: License[] = [];
  dni = '';
  tipo: License['tipo'] = 'MEDICA';
  inicio = '';
  fin = '';
  motivo = '';
  saving = false;
  error = '';

  constructor() {
    this.load();
  }

  load(): void {
    this.service.list().subscribe({
      next: (licenses) => (this.licenses = licenses),
      error: () => (this.error = 'No se pudieron cargar las licencias.'),
    });
  }

  create(): void {
    this.saving = true;
    this.error = '';
    this.service.create({
      dni: this.dni,
      tipo: this.tipo,
      fecha_inicio: this.inicio,
      fecha_fin: this.fin,
      motivo: this.motivo,
      estado: 'APPROVED',
    }).subscribe({
      next: (license) => {
        this.licenses = [license, ...this.licenses];
        this.saving = false;
        this.motivo = '';
      },
      error: (error: { error?: { detail?: string } }) => {
        this.error = error.error?.detail ?? 'No se pudo registrar la licencia.';
        this.saving = false;
      },
    });
  }
}
