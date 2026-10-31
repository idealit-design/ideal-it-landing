import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Area, Person, PersonalService } from '../../core/services/personal.service';

@Component({
  selector: 'mvp-personal-mgmt',
  standalone: true,
  imports: [FormsModule],
  template: `
    <section class="card">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <h2 class="text-xl font-bold">Personal y estructura</h2>
        <form class="flex gap-2" (ngSubmit)="filterPeople()">
          <input [(ngModel)]="filterDni" name="filterDni" inputmode="numeric" placeholder="Filtrar por DNI" />
          <button type="submit">Filtrar</button>
          @if (filterDni) { <button type="button" class="!bg-slate-700 !text-slate-100" (click)="filterDni = ''; filterPeople()">Limpiar</button> }
        </form>
      </div>
      <form class="mt-4 grid gap-3 md:grid-cols-3" (ngSubmit)="savePerson()">
        <input [(ngModel)]="person.dni" name="dni" [readonly]="!!editingDni" required pattern="[0-9]{7,8}" placeholder="DNI" />
        <input [(ngModel)]="person.nombre" name="nombre" required placeholder="Nombre" />
        <input [(ngModel)]="person.apellido" name="apellido" required placeholder="Apellido" />
        <input [(ngModel)]="person.legajo" name="legajo" required placeholder="Legajo" />
        <select [(ngModel)]="person.area_id" name="area">
          <option [ngValue]="null">Sin área</option>
          @for (area of areas; track area.id) { <option [ngValue]="area.id">{{ area.nombre_area }} · Piso {{ area.piso }}</option> }
        </select>
        <button type="submit">{{ editingDni ? 'Guardar cambios' : 'Dar de alta' }}</button>
        @if (editingDni) { <button type="button" class="!bg-slate-700 !text-slate-100" (click)="cancelEdit()">Cancelar</button> }
      </form>
      <form class="mt-5 grid gap-3 border-t border-slate-800 pt-5 md:grid-cols-4" (ngSubmit)="saveArea()">
        <input [(ngModel)]="area.nombre_area" name="areaNombre" required placeholder="Nueva área" />
        <input [(ngModel)]="area.piso" name="areaPiso" required placeholder="Piso" />
        <input [(ngModel)]="area.departamento" name="departamento" required placeholder="Departamento" />
        <button type="submit">{{ editingAreaId ? 'Guardar área' : 'Crear área' }}</button>
        @if (editingAreaId) { <button type="button" class="!bg-slate-700 !text-slate-100" (click)="cancelAreaEdit()">Cancelar</button> }
      </form>
      <ul class="mt-3 flex flex-wrap gap-2 text-xs">
        @for (area of areas; track area.id) {
          <li class="rounded-lg border border-slate-700 px-3 py-2">{{ area.nombre_area }} · Piso {{ area.piso }} · {{ area.departamento }}
            <button type="button" class="ml-2 !px-2 !py-1" (click)="editArea(area)">Editar</button>
          </li>
        }
      </ul>
      <div class="mt-5 overflow-x-auto">
        <table class="w-full text-left text-sm">
          <thead class="text-slate-400"><tr><th class="py-2">DNI</th><th>Personal</th><th>Legajo</th><th>Estado</th><th></th></tr></thead>
          <tbody>
            @for (person of people; track person.dni) {
              <tr class="border-t border-slate-800">
                <td class="py-3">{{ person.dni }}</td><td>{{ person.apellido }}, {{ person.nombre }}</td><td>{{ person.legajo }}</td>
                <td>{{ person.activo ? 'Activo' : 'Inactivo' }}</td>
                <td class="flex gap-2 py-2">
                  <button class="!px-3 !py-1 text-xs" type="button" (click)="editPerson(person)">Editar</button>
                  <button class="!px-3 !py-1 text-xs" type="button" (click)="toggle(person)">{{ person.activo ? 'Desactivar' : 'Activar' }}</button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
      @if (message) { <p class="mt-3 text-sm text-cyan-200">{{ message }}</p> }
      @if (error) { <p class="mt-3 text-sm text-rose-300">{{ error }}</p> }
    </section>
  `,
})
export class PersonalMgmtComponent implements OnInit {
  private readonly peopleApi = inject(PersonalService);
  people: Person[] = [];
  areas: Area[] = [];
  error = '';
  message = '';
  filterDni = '';
  editingDni: string | null = null;
  editingAreaId: number | null = null;
  person = { dni: '', nombre: '', apellido: '', legajo: '', area_id: null as number | null, activo: true, fecha_alta: new Date().toISOString().slice(0, 10) };
  area = { nombre_area: '', piso: '', departamento: '' };

  ngOnInit(): void { this.reload(); }

  reload(): void {
    this.peopleApi.list(this.filterDni).subscribe({ next: (data) => this.people = data, error: (error: unknown) => this.fail('No se pudo cargar el personal.', error) });
    this.peopleApi.listAreas().subscribe({ next: (data) => this.areas = data, error: (error: unknown) => this.fail('No se pudieron cargar las áreas.', error) });
  }

  filterPeople(): void {
    this.peopleApi.list(this.filterDni).subscribe({
      next: (data) => this.people = data,
      error: (error: unknown) => this.fail('No se pudo filtrar el personal.', error),
    });
  }

  savePerson(): void {
    this.clear();
    if (this.editingDni) {
      const { nombre, apellido, legajo, area_id, activo } = this.person;
      this.peopleApi.update(this.editingDni, { nombre, apellido, legajo, area_id, activo }).subscribe({
        next: () => { this.message = 'Datos del personal actualizados.'; this.cancelEdit(); this.reload(); },
        error: (error: unknown) => this.fail('No se pudo actualizar el personal.', error),
      });
      return;
    }
    this.peopleApi.create(this.person).subscribe({
      next: () => { this.message = 'Personal registrado.'; this.person = { dni: '', nombre: '', apellido: '', legajo: '', area_id: null, activo: true, fecha_alta: new Date().toISOString().slice(0, 10) }; this.reload(); },
      error: (error: unknown) => this.fail('No se pudo registrar el personal.', error),
    });
  }

  editPerson(person: Person): void {
    this.editingDni = person.dni;
    this.person = { ...person };
  }

  cancelEdit(): void {
    this.editingDni = null;
    this.person = { dni: '', nombre: '', apellido: '', legajo: '', area_id: null, activo: true, fecha_alta: new Date().toISOString().slice(0, 10) };
  }

  saveArea(): void {
    this.clear();
    if (this.editingAreaId !== null) {
      this.peopleApi.updateArea(this.editingAreaId, this.area).subscribe({
        next: () => { this.message = 'Área actualizada.'; this.cancelAreaEdit(); this.reload(); },
        error: (error: unknown) => this.fail('No se pudo actualizar el área.', error),
      });
      return;
    }
    this.peopleApi.createArea(this.area).subscribe({
      next: () => { this.message = 'Área creada.'; this.area = { nombre_area: '', piso: '', departamento: '' }; this.reload(); },
      error: (error: unknown) => this.fail('No se pudo crear el área.', error),
    });
  }

  editArea(area: Area): void {
    this.editingAreaId = area.id;
    this.area = { nombre_area: area.nombre_area, piso: area.piso, departamento: area.departamento };
  }

  cancelAreaEdit(): void {
    this.editingAreaId = null;
    this.area = { nombre_area: '', piso: '', departamento: '' };
  }

  toggle(person: Person): void {
    this.peopleApi.setActive(person.dni, !person.activo).subscribe({
      next: () => this.reload(),
      error: (error: unknown) => this.fail('No se pudo cambiar el estado.', error),
    });
  }

  private clear(): void { this.error = ''; this.message = ''; }
  private fail(message: string, error: unknown): void { this.error = message; console.error(message, error); }
}
