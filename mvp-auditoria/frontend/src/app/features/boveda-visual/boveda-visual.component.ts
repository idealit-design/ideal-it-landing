import { Component, inject } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { AuditoriaService, VaultDocument } from '../../core/services/auditoria.service';

@Component({
  selector: 'audit-boveda-visual',
  standalone: true,
  imports: [FormsModule],
  template: `
    <section class="card stack">
      <h2>Bóveda documental local</h2>
      <input [(ngModel)]="dni" name="dni" placeholder="DNI del prestador" />
      <div class="row"><input type="file" accept=".pdf,.png,.jpg,.jpeg" (change)="selectFile($event)" /><select [(ngModel)]="tipo" name="tipo"><option>ORDEN</option><option>INFORME</option><option>CERTIFICADO</option><option>DOCUMENTO</option><option>OTRO</option></select></div>
      <button type="button" [disabled]="!file || uploading" (click)="upload()">Guardar archivo local</button>
      @if (error) { <p class="error">{{ error }}</p> }
      <ul class="list">
        @for (document of documents; track document.id) {
          <li class="row">
            @if (document.extension === 'pdf') {
              <iframe class="pdf-thumb" title="Miniatura PDF" [src]="thumbnailUrl(document)" (click)="preview(document)"></iframe>
            } @else {
              <img class="thumb" alt="Miniatura del certificado" [src]="documentUrl(document)" (click)="preview(document)" />
            }
            <span>{{ document.nombre_archivo }}<br><small class="muted">{{ document.tipo_documento }}</small></span>
            <button class="secondary" type="button" (click)="preview(document)">Previsualizar</button>
          </li>
        }
      </ul>
      @if (previewDocument) {
        @if (previewDocument.extension === 'pdf') { <iframe class="preview" title="Vista previa del documento" [src]="previewSafeUrl"></iframe> }
        @else { <img class="preview" alt="Vista previa del documento" [src]="previewUrl" /> }
      }
    </section>
  `,
})
export class BovedaVisualComponent {
  private readonly service = inject(AuditoriaService);
  private readonly sanitizer = inject(DomSanitizer);
  dni = '';
  tipo = 'ORDEN';
  file: File | null = null;
  documents: VaultDocument[] = [];
  previewDocument: VaultDocument | null = null;
  previewUrl = '';
  previewSafeUrl: SafeResourceUrl | null = null;
  uploading = false;
  error = '';

  constructor() { this.load(); }

  selectFile(event: Event): void {
    this.file = (event.target as HTMLInputElement).files?.[0] ?? null;
  }

  load(): void {
    this.service.documents(this.dni || undefined).subscribe({
      next: (documents) => (this.documents = documents),
      error: () => (this.error = 'No se pudieron cargar los documentos locales.'),
    });
  }

  upload(): void {
    if (!this.file) return;
    this.uploading = true;
    const file = this.file;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = String(reader.result).split(',', 2)[1];
      this.service.upload({
        dni_prestador: this.dni,
        nombre_archivo: file.name,
        tipo_documento: this.tipo,
        contenido_base64: base64,
      }).subscribe({
        next: (document) => {
          this.documents = [document, ...this.documents];
          this.file = null;
          this.uploading = false;
        },
        error: (error: { error?: { detail?: string | string[] } }) => {
          this.error = Array.isArray(error.error?.detail) ? error.error.detail.join(', ') : error.error?.detail ?? 'No se pudo guardar el archivo.';
          this.uploading = false;
        },
      });
    };
    reader.onerror = () => {
      this.error = 'No se pudo leer el archivo seleccionado.';
      this.uploading = false;
    };
    reader.readAsDataURL(file);
  }

  preview(document: VaultDocument): void {
    this.previewDocument = document;
    this.previewUrl = this.service.contentUrl(document);
    this.previewSafeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.previewUrl);
  }

  thumbnailUrl(document: VaultDocument): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(`${this.service.contentUrl(document)}#page=1&view=FitH`);
  }

  documentUrl(document: VaultDocument): string {
    return this.service.contentUrl(document);
  }
}
