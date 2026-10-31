import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

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
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://127.0.0.1:8002/api/auditoria';

  getDocuments(): Observable<AuditDocument[]> {
    return this.http.get<AuditDocument[]>(`${this.apiUrl}/documents`);
  }

  getRegistryByLicense(license: string): Observable<RegistryResult> {
    return this.http.get<RegistryResult>(
      `${this.apiUrl}/registry/matricula/${encodeURIComponent(license)}`,
    );
  }

  getIdentityByDni(dni: string): Observable<RegistryResult> {
    return this.http.get<RegistryResult>(
      `${this.apiUrl}/registry/renaper/${encodeURIComponent(dni)}`,
    );
  }

  searchNomenclator(specialty: string, search: string): Observable<NomenclatorItem[]> {
    let params = new HttpParams();
    if (specialty) params = params.set('specialty', specialty);
    if (search.trim()) params = params.set('q', search.trim());
    return this.http.get<NomenclatorItem[]>(`${this.apiUrl}/nomenclator`, { params });
  }

  createAuditCase(payload: {
    specialty: string;
    nomenclator_code: string;
    notes: string;
  }): Observable<{ id: number; status: string; created_at: string }> {
    return this.http.post<{ id: number; status: string; created_at: string }>(
      `${this.apiUrl}/cases`,
      payload,
    );
  }
}
