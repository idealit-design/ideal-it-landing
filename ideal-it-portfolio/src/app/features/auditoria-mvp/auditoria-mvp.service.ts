import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

export interface AuditDocument {
  id: number;
  title: string;
  document_type: string;
  page_count: number;
  status: string;
  demo_only: true;
}

export interface RegistryResult {
  source: 'MATRICULA_NACIONAL' | 'RENAPER';
  query: string;
  simulated: true;
  result: string;
  message: string;
}

export interface NomenclatorItem {
  code: string;
  description: string;
  specialty: string;
  demo_only: true;
}

@Injectable({ providedIn: 'root' })
export class AuditoriaMvpService {
  private readonly documents: AuditDocument[] = [
    { id: 1, title: 'Orden de práctica · DEMO', document_type: 'orden', page_count: 2, status: 'Muestra', demo_only: true },
    { id: 2, title: 'Informe técnico · DEMO', document_type: 'informe', page_count: 3, status: 'Muestra', demo_only: true },
    { id: 3, title: 'Constancia profesional · DEMO', document_type: 'constancia', page_count: 1, status: 'Muestra', demo_only: true },
  ];
  private readonly nomenclator: NomenclatorItem[] = [
    { code: 'DEMO-001', description: 'Consulta profesional de ejemplo', specialty: 'Clínica médica', demo_only: true },
    { code: 'DEMO-002', description: 'Estudio ambulatorio de ejemplo', specialty: 'Diagnóstico por imágenes', demo_only: true },
    { code: 'DEMO-003', description: 'Control preventivo de ejemplo', specialty: 'Clínica médica', demo_only: true },
  ];
  private nextCaseId = 1;

  getDocuments(): Observable<AuditDocument[]> {
    return of(this.documents.map((document) => ({ ...document })));
  }

  getRegistryByLicense(license: string): Observable<RegistryResult> {
    return of({
      source: 'MATRICULA_NACIONAL',
      query: license,
      simulated: true,
      result: 'DEMO',
      message: 'Resultado ficticio; no se consultó la Matrícula Nacional.',
    });
  }

  getIdentityByDni(dni: string): Observable<RegistryResult> {
    return of({
      source: 'RENAPER',
      query: dni,
      simulated: true,
      result: 'DEMO',
      message: 'Resultado ficticio; no se consultó RENAPER.',
    });
  }

  searchNomenclator(specialty: string, search: string): Observable<NomenclatorItem[]> {
    const query = search.trim().toLocaleLowerCase();
    return of(this.nomenclator
      .filter((item) => !specialty || item.specialty === specialty)
      .filter((item) => !query || `${item.code} ${item.description} ${item.specialty}`.toLocaleLowerCase().includes(query))
      .map((item) => ({ ...item })));
  }

  createAuditCase(payload: {
    specialty: string;
    nomenclator_code: string;
    notes: string;
  }): Observable<{ id: number; status: string; created_at: string }> {
    void payload;
    return of({
      id: this.nextCaseId++,
      status: 'DEMO',
      created_at: new Date().toISOString(),
    });
  }
}
