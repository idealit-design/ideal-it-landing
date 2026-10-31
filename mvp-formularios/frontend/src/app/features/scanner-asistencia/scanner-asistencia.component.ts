import { CommonModule } from '@angular/common';
import { Component, OnDestroy, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { BarcodeFormat } from '@zxing/library';
import { FormulariosService } from '../../core/formularios.service';
import { AttendanceResult } from '../../core/models';

@Component({
  selector: 'forms-scanner-asistencia',
  standalone: true,
  imports: [CommonModule, FormsModule, ZXingScannerModule],
  template: `
    <div class="row g-4">
      <section class="col-lg-7">
        <div class="card panel-card p-4">
          <h2 class="h4">Control de acceso</h2>
          <p class="text-secondary">Escanee el QR emitido al aprobar la inscripción. El lector funciona en localhost o HTTPS con permiso de cámara.</p>
          <div class="scanner-frame mb-3">
            <zxing-scanner
              *ngIf="scannerEnabled"
              [formats]="allowedFormats"
              (scanSuccess)="onCodeResult($event)">
            </zxing-scanner>
            <div *ngIf="!scannerEnabled" class="text-center text-white p-5">
              <div class="display-5 mb-2">▦</div><div>Escáner pausado durante la validación</div>
            </div>
          </div>
          <form class="input-group" (ngSubmit)="validateManual()">
            <input class="form-control" name="manualCode" [(ngModel)]="manualCode" placeholder="O ingrese MVPF:… manualmente" aria-label="Código QR">
            <button class="btn btn-success" [disabled]="busy || !manualCode.trim()">Validar código</button>
          </form>
          <p class="muted-label mt-2 mb-0">Si el dispositivo no admite cámara, puede probar el ingreso manual pegando el valor del QR.</p>
        </div>
      </section>
      <section class="col-lg-5">
        <div class="card panel-card p-4 h-100">
          <h2 class="h5">Resultado del último escaneo</h2>
          <div *ngIf="!result && !error" class="text-secondary py-4">Esperando un código QR aprobado…</div>
          <div *ngIf="result" class="alert alert-success mb-0">
            <div class="display-6 mb-2">✓</div><strong>Asistencia registrada</strong>
            <div class="mt-2">{{ result.nombre_apellido }}</div>
            <div>{{ result.evento }}</div>
            <div class="small mt-2">{{ result.fecha_hora | date:'medium' }}</div>
          </div>
          <div *ngIf="error" class="alert alert-danger mb-0" role="alert">{{ error }}</div>
        </div>
      </section>
    </div>
  `,
})
export class ScannerAsistenciaComponent implements OnDestroy {
  private readonly api = inject(FormulariosService);
  readonly allowedFormats = [BarcodeFormat.QR_CODE];
  scannerEnabled = true;
  busy = false;
  manualCode = '';
  result: AttendanceResult | null = null;
  error = '';
  private resumeTimer: ReturnType<typeof setTimeout> | null = null;

  onCodeResult(code: string): void {
    this.validate(code);
  }

  validateManual(): void {
    this.validate(this.manualCode);
  }

  ngOnDestroy(): void {
    if (this.resumeTimer) clearTimeout(this.resumeTimer);
  }

  private validate(code: string): void {
    const normalized = code.trim();
    if (this.busy || !normalized) return;
    this.busy = true;
    this.scannerEnabled = false;
    this.error = '';
    this.api.validateAttendance(normalized).subscribe({
      next: (result) => {
        this.result = result;
        this.manualCode = '';
        this.resumeScanner();
      },
      error: (error: { error?: { detail?: string } }) => {
        this.result = null;
        this.error = error.error?.detail ?? 'No se pudo validar el código con la API local.';
        this.resumeScanner();
      },
    });
  }

  private resumeScanner(): void {
    this.busy = false;
    this.resumeTimer = setTimeout(() => (this.scannerEnabled = true), 1200);
  }
}
