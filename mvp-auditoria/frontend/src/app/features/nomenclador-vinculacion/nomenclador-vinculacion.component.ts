import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuditoriaService, AuditCase, CatalogItem } from '../../core/services/auditoria.service';

@Component({
  selector: 'audit-nomenclador-vinculacion',
  standalone: true,
  imports: [FormsModule],
  template: `
    <section class="card stack">
      <h2>Nomenclador y resolución</h2>
      <form class="stack" (ngSubmit)="createCatalogItem()">
        <div class="row"><input [(ngModel)]="catalogForm.codigo" name="codigo" placeholder="Código nuevo" required /><input [(ngModel)]="catalogForm.especialidad" name="especialidad" placeholder="Especialidad" required /></div>
        <input [(ngModel)]="catalogForm.descripcion" name="descripcion" placeholder="Descripción" required />
        <input [(ngModel)]="catalogForm.requisitos_exigidos" name="requisitos" placeholder="Requisitos (separados por coma)" />
        <button type="submit">Agregar código al catálogo local</button>
      </form>
      <input [(ngModel)]="query" name="query" placeholder="Filtrar por código, descripción o especialidad" (input)="search()" />
      <ul class="list">
        @for (item of catalog; track item.codigo) {
          <li><div class="row"><strong>{{ item.codigo }} · {{ item.descripcion }}</strong><span class="muted">{{ item.especialidad }}</span></div><p class="muted">Requisitos: {{ item.requisitos_exigidos || 'Sin requisitos documentales' }}</p>
            <div class="row"><input [(ngModel)]="dniPorCodigo[item.codigo]" [name]="'dni-' + item.codigo" placeholder="DNI prestador" /><button type="button" (click)="openCase(item)">Abrir caso</button></div>
          </li>
        }
      </ul>
      @if (error) { <p class="error">{{ error }}</p> }
      <h3>Casos abiertos</h3>
      <ul class="list">
        @for (auditCase of cases; track auditCase.id) {
          <li><div class="row"><span>#{{ auditCase.id }} · {{ auditCase.dni_prestador }} · {{ auditCase.codigo_nomenclador }}</span><strong>{{ auditCase.estado_autorizacion }}</strong></div>
            @if (auditCase.estado_autorizacion === 'PENDIENTE') { <div class="row"><button type="button" (click)="resolve(auditCase, 'APROBADO')">Aprobar</button><button class="secondary" type="button" (click)="resolve(auditCase, 'RECHAZADO')">Rechazar</button></div> }
          </li>
        }
      </ul>
    </section>
  `,
})
export class NomencladorVinculacionComponent {
  private readonly service = inject(AuditoriaService);
  query = '';
  catalog: CatalogItem[] = [];
  cases: AuditCase[] = [];
  dniPorCodigo: Record<string, string> = {};
  catalogForm: CatalogItem = { codigo: '', descripcion: '', especialidad: '', requisitos_exigidos: '' };
  error = '';

  constructor() {
    this.search();
    this.loadCases();
  }

  search(): void {
    this.service.catalog(this.query).subscribe({
      next: (catalog) => (this.catalog = catalog),
      error: () => (this.error = 'No se pudo consultar el nomenclador local.'),
    });
  }

  createCatalogItem(): void {
    this.error = '';
    this.service.createCatalog(this.catalogForm).subscribe({
      next: (item) => {
        this.catalog = [...this.catalog, item].sort((a, b) => a.codigo.localeCompare(b.codigo));
        this.catalogForm = { codigo: '', descripcion: '', especialidad: '', requisitos_exigidos: '' };
      },
      error: (error: { error?: { detail?: string } }) => (this.error = error.error?.detail ?? 'No se pudo agregar el código.'),
    });
  }

  loadCases(): void {
    this.service.cases().subscribe({
      next: (cases) => (this.cases = cases),
      error: () => (this.error = 'No se pudieron cargar los casos.'),
    });
  }

  openCase(item: CatalogItem): void {
    this.error = '';
    this.service.createCase({
      dni_prestador: this.dniPorCodigo[item.codigo] ?? '',
      codigo_nomenclador: item.codigo,
      observaciones: '',
      auditor_id: 'auditor-local',
    }).subscribe({
      next: (auditCase) => (this.cases = [auditCase, ...this.cases]),
      error: (error: { error?: { detail?: string } }) => (this.error = error.error?.detail ?? 'No se pudo abrir el caso.'),
    });
  }

  resolve(auditCase: AuditCase, status: AuditCase['estado_autorizacion']): void {
    this.error = '';
    this.service.updateCase(auditCase.id, status).subscribe({
      next: (updated) => (this.cases = this.cases.map((item) => item.id === updated.id ? updated : item)),
      error: (error: { error?: { detail?: string | string[] } }) => {
        this.error = Array.isArray(error.error?.detail) ? error.error.detail.join(' ') : error.error?.detail ?? 'No se pudo resolver el caso.';
      },
    });
  }
}
