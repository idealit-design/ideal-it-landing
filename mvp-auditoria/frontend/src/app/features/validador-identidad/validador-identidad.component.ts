import { Component, inject } from '@angular/core';
import { JsonPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuditoriaService } from '../../core/services/auditoria.service';

@Component({
  selector: 'audit-validador-identidad',
  standalone: true,
  imports: [FormsModule, JsonPipe],
  template: `
    <section class="card stack">
      <h2>Validación de identidad y matrícula</h2>
      <input [(ngModel)]="dni" name="dni" placeholder="DNI del prestador" />
      <div class="row"><button type="button" (click)="check('renaper')">Consultar RENAPER mock</button><button type="button" class="secondary" (click)="check('matricula')">Consultar matrícula mock</button></div>
      @if (result) { <pre class="muted">{{ result | json }}</pre> }
      @if (error) { <p class="error">{{ error }}</p> }
      <p class="muted">Simulación local: no se conecta a registros externos.</p>
    </section>
  `,
})
export class ValidadorIdentidadComponent {
  private readonly service = inject(AuditoriaService);
  dni = '';
  result: Record<string, string> | null = null;
  error = '';

  check(type: 'renaper' | 'matricula'): void {
    this.error = '';
    this.result = null;
    this.service.validate(this.dni, type).subscribe({
      next: (result) => (this.result = result),
      error: (error: { error?: { detail?: string } }) => (this.error = error.error?.detail ?? 'No se pudo validar.'),
    });
  }
}
