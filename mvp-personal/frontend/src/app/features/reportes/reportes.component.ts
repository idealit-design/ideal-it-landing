import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AttendanceReport, ReportesService } from '../../core/services/reportes.service';

@Component({
  selector: 'mvp-reportes',
  standalone: true,
  imports: [FormsModule],
  template: `
    <section class="card">
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div><p class="text-sm font-semibold uppercase tracking-widest text-cyan-300">Lunes a viernes</p><h2 class="mt-1 text-xl font-bold">Reportes de asistencia</h2></div>
        <div class="flex flex-wrap gap-2">
          <input [(ngModel)]="fecha" name="fecha" type="date" />
          <button type="button" (click)="load('diario')">Diario</button>
          <button type="button" (click)="load('semanal')">Semanal</button>
        </div>
      </div>
      @if (error) { <p class="mt-4 text-sm text-rose-300">{{ error }}</p> }
      @if (report) {
        <div class="mt-5 grid gap-3 sm:grid-cols-3">
          <div class="rounded-xl bg-slate-950 p-4"><p class="text-sm text-slate-400">Presentes</p><p class="mt-1 text-2xl font-bold">{{ report.resumen.presente }}</p></div>
          <div class="rounded-xl bg-slate-950 p-4"><p class="text-sm text-slate-400">Ausentes</p><p class="mt-1 text-2xl font-bold">{{ report.resumen.ausente }}</p></div>
          <div class="rounded-xl bg-slate-950 p-4"><p class="text-sm text-slate-400">Justificadas</p><p class="mt-1 text-2xl font-bold">{{ report.resumen.justificada }}</p></div>
        </div>
        @if (report.dia_habil === false) { <p class="mt-4 text-sm text-amber-200">Fin de semana: excluido del cálculo.</p> }
        <div class="mt-4 overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="text-slate-400"><tr><th class="py-2">Fecha</th><th>DNI</th><th>Estado</th><th>Entrada</th><th>Salida</th></tr></thead>
            <tbody>@for (row of report.registros; track row.dni + row.fecha) {
              <tr class="border-t border-slate-800"><td class="py-2">{{ row.fecha }}</td><td>{{ row.dni }}</td><td>{{ row.estado }}{{ row.tipo_licencia ? ' · ' + row.tipo_licencia : '' }}</td><td>{{ row.entrada || '—' }}</td><td>{{ row.salida || '—' }}</td></tr>
            }</tbody>
          </table>
        </div>
      }
    </section>
  `,
})
export class ReportesComponent {
  private readonly api = inject(ReportesService);
  fecha = new Date().toISOString().slice(0, 10);
  report: AttendanceReport | null = null;
  error = '';

  load(period: 'diario' | 'semanal'): void {
    this.report = null;
    this.error = '';
    const request = period === 'diario' ? this.api.daily(this.fecha) : this.api.weekly(this.fecha);
    request.subscribe({
      next: (report) => this.report = report,
      error: (error: unknown) => { this.error = 'No se pudo generar el reporte.'; console.error(error); },
    });
  }
}
