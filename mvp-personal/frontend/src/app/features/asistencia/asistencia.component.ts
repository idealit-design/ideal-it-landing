import { Component, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

interface AttendanceMark {
  id: number;
  ip_dispositivo: string;
  marca_tiempo: string;
  tipo_evento: string;
  estado_verificacion: string;
  dispositivo_modelo: string;
}

@Component({
  selector: 'mvp-asistencia',
  standalone: true,
  imports: [DatePipe, FormsModule],
  template: `
    <section class="card">
      <h2 class="text-xl font-bold">Historial de asistencia por DNI</h2>
      <form class="mt-4 flex flex-wrap gap-3" (ngSubmit)="search()">
        <input [(ngModel)]="dni" name="dni" required pattern="[0-9]{7,8}" placeholder="Ingresá el DNI" />
        <button type="submit">Buscar historial</button>
      </form>
      @if (error) { <p class="mt-3 text-sm text-rose-300">{{ error }}</p> }
      @if (searched && !error && !marks.length) { <p class="mt-4 text-sm text-slate-400">No hay marcas registradas para este DNI.</p> }
      <ul class="mt-4 divide-y divide-slate-800">
        @for (mark of marks; track mark.id) {
          <li class="flex flex-wrap justify-between gap-2 py-3 text-sm">
            <span>{{ mark.tipo_evento }} · {{ mark.estado_verificacion }} · {{ mark.dispositivo_modelo }}</span>
            <span class="text-slate-400">{{ mark.marca_tiempo | date:'medium' }} · {{ mark.ip_dispositivo }}</span>
          </li>
        }
      </ul>
    </section>
  `,
})
export class AsistenciaComponent {
  private readonly http = inject(HttpClient);
  dni = '';
  marks: AttendanceMark[] = [];
  error = '';
  searched = false;

  search(): void {
    this.error = '';
    this.searched = true;
    this.http.get<{ historial: AttendanceMark[] }>(
      `/api/asistencia/${encodeURIComponent(this.dni.trim())}`,
    ).subscribe({
      next: (response) => this.marks = response.historial,
      error: (error: unknown) => { this.marks = []; this.error = 'No se pudo consultar el historial del DNI.'; console.error(error); },
    });
  }
}
