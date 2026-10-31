import { DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  BiometricDevice,
  BiometricMark,
  BiometricService,
  MarkEvent,
  Verification,
} from '../../core/services/biometric.service';

@Component({
  selector: 'mvp-biometric-sim',
  standalone: true,
  imports: [DatePipe, FormsModule],
  template: `
    <section class="card">
      <div class="mb-4">
        <p class="text-sm font-semibold uppercase tracking-widest text-cyan-300">Simulador IP</p>
        <h2 class="mt-1 text-xl font-bold">Fichaje biométrico</h2>
        <p class="mt-1 text-sm text-slate-400">Tramas locales mockeadas; nunca se contacta el dispositivo.</p>
      </div>
      <form class="grid gap-3 md:grid-cols-2" (ngSubmit)="simulate()">
        <input [(ngModel)]="dni" name="dni" inputmode="numeric" placeholder="DNI (opcional: autoasignar)" />
        <input [(ngModel)]="ip" name="ip" required placeholder="IP local" />
        <select [(ngModel)]="device" name="device">
          <option value="ZKBio">ZKBio</option><option value="Suprema">Suprema</option><option value="Hikvision">Hikvision</option>
        </select>
        <select [(ngModel)]="eventType" name="eventType">
          <option value="">Evento aleatorio</option><option value="ENTRADA">Entrada</option><option value="SALIDA">Salida</option>
        </select>
        <select [(ngModel)]="verification" name="verification">
          <option value="">Verificación aleatoria</option><option value="VERIFIED">Verified</option><option value="FAILED">Failed</option>
        </select>
        <button type="submit" [disabled]="loading">{{ loading ? 'Simulando…' : 'Simular fichaje' }}</button>
      </form>
      @if (error) { <p class="mt-3 text-sm text-rose-300">{{ error }}</p> }
      @if (lastMark) {
        <div class="mt-4 rounded-xl border border-slate-700 bg-slate-950 p-4 text-sm">
          <strong>{{ lastMark.tipo_evento }} · {{ lastMark.estado_verificacion }}</strong>
          <p class="mt-1 text-slate-300">{{ lastMark.dni }} · {{ lastMark.dispositivo_modelo }} · {{ lastMark.ip_dispositivo }}</p>
          <p class="mt-1 text-slate-500">{{ lastMark.marca_tiempo | date:'medium' }}</p>
        </div>
      }
    </section>
  `,
})
export class BiometricSimComponent {
  private readonly api = inject(BiometricService);
  dni = '';
  ip = '192.168.1.105';
  device: BiometricDevice = 'ZKBio';
  eventType: MarkEvent | '' = '';
  verification: Verification | '' = '';
  lastMark: BiometricMark | null = null;
  error = '';
  loading = false;

  simulate(): void {
    this.error = '';
    this.loading = true;
    this.api.simulate({
      dni: this.dni.trim() || undefined,
      ip_dispositivo: this.ip,
      tipo_evento: this.eventType || undefined,
      estado_verificacion: this.verification || undefined,
      dispositivo_modelo: this.device,
    }).subscribe({
      next: (mark) => { this.lastMark = mark; this.loading = false; },
      error: (error: unknown) => { this.error = 'No se pudo simular el fichaje. Verifique la IP local y el DNI.'; this.loading = false; console.error(error); },
    });
  }
}
