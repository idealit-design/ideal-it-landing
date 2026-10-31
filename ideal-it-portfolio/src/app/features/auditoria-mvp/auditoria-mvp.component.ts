import { Component, OnInit, inject } from '@angular/core';
import { NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  AuditDocument,
  AuditoriaMvpService,
  NomenclatorItem,
  RegistryResult,
} from './auditoria-mvp.service';

@Component({
  selector: 'app-auditoria-mvp',
  standalone: true,
  imports: [FormsModule, NgClass, RouterLink],
  templateUrl: './auditoria-mvp.component.html',
})
export class AuditoriaMvpComponent implements OnInit {
  private readonly auditoriaService = inject(AuditoriaMvpService);

  documents: AuditDocument[] = [];
  selectedDocument: AuditDocument | null = null;
  nomenclatorItems: NomenclatorItem[] = [];
  selectedCode: NomenclatorItem | null = null;
  license = '';
  dni = '';
  specialty = '';
  nomenclatorSearch = '';
  auditNotes = '';
  registryResults: RegistryResult[] = [];
  errorMessage = '';
  successMessage = '';
  private searchTimeout: ReturnType<typeof setTimeout> | null = null;

  ngOnInit(): void {
    this.auditoriaService.getDocuments().subscribe({
      next: (documents) => {
        this.documents = documents;
        this.selectedDocument = documents[0] ?? null;
      },
      error: (error: unknown) => this.setError('No se pudieron cargar los documentos demo.', error),
    });
    this.loadNomenclator();
  }

  selectDocument(document: AuditDocument): void {
    this.selectedDocument = document;
  }

  checkLicense(): void {
    this.clearMessages();
    this.auditoriaService.getRegistryByLicense(this.license).subscribe({
      next: (result) => this.registryResults = [result, ...this.registryResults],
      error: (error: unknown) => this.setError('No se pudo consultar la matrícula simulada.', error),
    });
  }

  checkIdentity(): void {
    this.clearMessages();
    this.auditoriaService.getIdentityByDni(this.dni).subscribe({
      next: (result) => this.registryResults = [result, ...this.registryResults],
      error: (error: unknown) => this.setError('No se pudo consultar la identidad simulada.', error),
    });
  }

  onNomenclatorFilterChange(): void {
    if (this.searchTimeout !== null) clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => this.loadNomenclator(), 250);
  }

  selectCode(item: NomenclatorItem): void {
    this.selectedCode = item;
    this.specialty = item.specialty;
  }

  createAuditCase(): void {
    if (!this.selectedCode) {
      this.errorMessage = 'Seleccioná un código del catálogo demo antes de crear la auditoría.';
      return;
    }
    this.clearMessages();
    this.auditoriaService.createAuditCase({
      specialty: this.selectedCode.specialty,
      nomenclator_code: this.selectedCode.code,
      notes: this.auditNotes,
    }).subscribe({
      next: ({ id }) => {
        this.successMessage = `Auditoría demo #${id} creada.`;
        this.auditNotes = '';
      },
      error: (error: unknown) => this.setError('No se pudo crear el caso de auditoría.', error),
    });
  }

  private loadNomenclator(): void {
    this.auditoriaService.searchNomenclator(this.specialty, this.nomenclatorSearch).subscribe({
      next: (items) => this.nomenclatorItems = items,
      error: (error: unknown) => this.setError('No se pudo consultar el nomenclador simulado.', error),
    });
  }

  private clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }

  private setError(message: string, error: unknown): void {
    console.error(message, error);
    this.errorMessage = message;
  }
}
