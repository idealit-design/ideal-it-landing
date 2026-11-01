import { DatePipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AttendanceReport, ReportesService } from '../../core/services/reportes.service';
import { License, LicenciasService } from '../../core/services/licencias.service';
import { Person, PersonalService } from '../../core/services/personal.service';

@Component({
  selector: 'mvp-personal-dashboard',
  standalone: true,
  imports: [DatePipe, RouterLink],
  template: `
    <section class="space-y-5">
      <header class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">Operaciones · {{ today | date:'fullDate' }}</p>
          <h2 class="mt-2 text-2xl font-bold sm:text-3xl">Estado de asistencia</h2>
          <p class="mt-1 text-sm text-slate-400">Vista diaria de personal y novedades operativas.</p>
        </div>
        <a routerLink="/fichajes" class="rounded-lg bg-cyan-400 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-cyan-300">Registrar fichaje</a>
      </header>

      <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article class="card">
          <p class="text-xs uppercase tracking-wide text-slate-400">Personal activo</p>
          <p class="mt-2 text-3xl font-bold">{{ activeCount }}</p>
          <p class="mt-1 text-xs text-slate-500">de {{ staff.length }} personas registradas</p>
        </article>
        <article class="card">
          <p class="text-xs uppercase tracking-wide text-slate-400">Presentes hoy</p>
          <p class="mt-2 text-3xl font-bold text-emerald-300">{{ attendance?.resumen?.presente ?? '—' }}</p>
          <p class="mt-1 text-xs text-slate-500">con entrada verificada</p>
        </article>
        <article class="card">
          <p class="text-xs uppercase tracking-wide text-slate-400">Ausentes hoy</p>
          <p class="mt-2 text-3xl font-bold text-amber-200">{{ attendance?.resumen?.ausente ?? '—' }}</p>
          <p class="mt-1 text-xs text-slate-500">según el reporte diario</p>
        </article>
        <article class="card">
          <p class="text-xs uppercase tracking-wide text-slate-400">Licencias pendientes</p>
          <p class="mt-2 text-3xl font-bold text-sky-200">{{ pendingLeaves.length }}</p>
          <a routerLink="/licencias" class="mt-1 inline-block text-xs text-cyan-300 hover:text-cyan-100">Revisar solicitudes →</a>
        </article>
      </div>

      <div class="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section class="card min-w-0">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p class="text-xs font-semibold uppercase tracking-widest text-cyan-300">Control diario</p>
              <h3 class="mt-1 text-lg font-bold">Personal y estado</h3>
            </div>
            <a routerLink="/personal" class="text-xs font-semibold text-cyan-300 hover:text-cyan-100">Administrar personal →</a>
          </div>

          @if (staffError) {
            <p role="alert" class="mt-4 rounded-lg border border-rose-400/30 bg-rose-400/10 p-3 text-sm text-rose-200">{{ staffError }}</p>
          } @else if (loadingStaff) {
            <p class="mt-5 text-sm text-slate-400">Cargando personal…</p>
          } @else if (staff.length === 0) {
            <p class="mt-5 rounded-lg border border-slate-800 p-4 text-sm text-slate-400">No hay personal registrado. <a routerLink="/personal" class="text-cyan-300 underline">Dar de alta</a>.</p>
          } @else {
            <div class="mt-4 max-h-[28rem] overflow-auto">
              <table class="w-full min-w-[560px] text-left text-sm">
                <thead class="sticky top-0 bg-slate-900 text-xs uppercase tracking-wide text-slate-500">
                  <tr><th class="py-2 pr-3">Personal</th><th class="pr-3">DNI</th><th class="pr-3">Legajo</th><th>Estado diario</th></tr>
                </thead>
                <tbody>
                  @for (person of staff; track person.dni) {
                    <tr class="border-t border-slate-800" [class.opacity-50]="!person.activo">
                      <td class="py-3 pr-3 font-medium">{{ person.apellido }}, {{ person.nombre }}</td>
                      <td class="pr-3 text-slate-400">{{ person.dni }}</td>
                      <td class="pr-3 text-slate-400">{{ person.legajo }}</td>
                      <td>
                        @if (!person.activo) {
                          <span class="text-slate-500">Inactivo</span>
                        } @else if (attendanceError) {
                          <span class="text-rose-300">No disponible</span>
                        } @else if (loadingAttendance) {
                          <span class="text-slate-500">Consultando…</span>
                        } @else {
                          <span [class]="attendanceClass(person.dni)">{{ attendanceStatus(person.dni) }}</span>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
          @if (attendanceError) {
            <p role="alert" class="mt-3 text-xs text-rose-300">{{ attendanceError }}</p>
          } @else if (attendance?.dia_habil === false) {
            <p class="mt-3 text-xs text-amber-200">El día consultado es fin de semana y queda excluido del cómputo.</p>
          }
        </section>

        <aside class="card">
          <div class="flex items-start justify-between gap-3">
            <div>
              <p class="text-xs font-semibold uppercase tracking-widest text-cyan-300">Acceso directo</p>
              <h3 class="mt-1 text-lg font-bold">Licencias y vacaciones</h3>
            </div>
            <a routerLink="/licencias" aria-label="Ir a licencias" class="rounded-lg border border-slate-700 px-2.5 py-1 text-xs text-cyan-200 hover:border-cyan-400">Abrir</a>
          </div>
          @if (leaveError) {
            <p role="alert" class="mt-4 text-sm text-rose-300">{{ leaveError }}</p>
          } @else if (loadingLeaves) {
            <p class="mt-4 text-sm text-slate-400">Cargando novedades…</p>
          } @else if (leaves.length === 0) {
            <p class="mt-4 text-sm text-slate-400">Sin licencias registradas.</p>
          } @else {
            <ul class="mt-3 divide-y divide-slate-800">
              @for (leave of leaves.slice(0, 7); track leave.id) {
                <li class="py-3">
                  <div class="flex items-center justify-between gap-2">
                    <span class="text-sm font-medium">{{ leave.dni }}</span>
                    <span class="rounded-full px-2 py-1 text-[10px] uppercase tracking-wide">
                      [class.bg-amber-300/10]="leave.estado === 'PENDING'"
                      [class.text-amber-200]="leave.estado === 'PENDING'"
                      [class.bg-emerald-300/10]="leave.estado === 'APPROVED'"
                      [class.text-emerald-200]="leave.estado === 'APPROVED'"
                      [class.bg-rose-300/10]="leave.estado === 'REJECTED'"
                      [class.text-rose-200]="leave.estado === 'REJECTED'">{{ leave.estado }}</span>
                  </div>
                  <p class="mt-1 text-xs text-slate-400">{{ leaveType(leave.tipo) }} · {{ leave.fecha_inicio }} — {{ leave.fecha_fin }}</p>
                </li>
              }
            </ul>
          }
          <a routerLink="/licencias" class="mt-3 inline-block text-xs font-semibold text-cyan-300 hover:text-cyan-100">Gestionar novedades →</a>
        </aside>
      </div>
    </section>
  `,
})
export class PersonalDashboardComponent implements OnInit {
  private readonly personalService = inject(PersonalService);
  private readonly reportesService = inject(ReportesService);
  private readonly licenciasService = inject(LicenciasService);

  readonly today = new Date();
  staff: Person[] = [];
  leaves: License[] = [];
  attendance: AttendanceReport | null = null;
  loadingStaff = true;
  loadingLeaves = true;
  loadingAttendance = true;
  staffError = '';
  leaveError = '';
  attendanceError = '';

  get activeCount(): number {
    return this.staff.filter((person) => person.activo).length;
  }

  get pendingLeaves(): License[] {
    return this.leaves.filter((leave) => leave.estado === 'PENDING');
  }

  ngOnInit(): void {
    this.personalService.list().subscribe({
      next: (staff) => {
        this.staff = staff;
        this.loadingStaff = false;
      },
      error: (error: unknown) => {
        this.staffError = 'No se pudo cargar el personal.';
        this.loadingStaff = false;
        console.error(this.staffError, error);
      },
    });

    this.reportesService.daily(this.today.toISOString().slice(0, 10)).subscribe({
      next: (report) => {
        this.attendance = report;
        this.loadingAttendance = false;
      },
      error: (error: unknown) => {
        this.attendanceError = 'No se pudo consultar el reporte diario.';
        this.loadingAttendance = false;
        console.error(this.attendanceError, error);
      },
    });

    this.licenciasService.list().subscribe({
      next: (leaves) => {
        this.leaves = leaves;
        this.loadingLeaves = false;
      },
      error: (error: unknown) => {
        this.leaveError = 'No se pudieron cargar las licencias.';
        this.loadingLeaves = false;
        console.error(this.leaveError, error);
      },
    });
  }

  attendanceStatus(dni: string): string {
    return this.attendance?.registros.find((record) => record.dni === dni)?.estado ?? 'Sin marca';
  }

  attendanceClass(dni: string): string {
    const status = this.attendance?.registros.find((record) => record.dni === dni)?.estado;
    if (status === 'PRESENTE') return 'text-emerald-300';
    if (status === 'JUSTIFICADA') return 'text-sky-200';
    if (status === 'AUSENTE') return 'text-amber-200';
    return 'text-slate-400';
  }

  leaveType(type: License['tipo']): string {
    if (type === 'MEDICA') return 'Licencia médica';
    if (type === 'VACACION') return 'Vacaciones';
    return 'Otro';
  }
}
