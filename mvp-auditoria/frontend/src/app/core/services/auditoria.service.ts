import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export interface Provider {
  dni: string; nombre: string; apellido: string; cuit: string; especialidad: string;
  estado_matricula: 'ACTIVA' | 'INACTIVA'; estado_renaper: 'VALIDADO' | 'NO_VALIDADO';
}
export interface VaultDocument {
  id: number; dni_prestador: string; nombre_archivo: string; tipo_documento: string;
  extension: string; url_contenido: string;
}
export interface CatalogItem {
  codigo: string; descripcion: string; especialidad: string; requisitos_exigidos: string;
}
export interface AuditCase {
  id: number; dni_prestador: string; codigo_nomenclador: string;
  estado_autorizacion: 'APROBADO' | 'RECHAZADO' | 'PENDIENTE';
  observaciones: string; auditor_id: string;
}

@Injectable({ providedIn: 'root' })
export class AuditoriaService {
  private readonly http = inject(HttpClient);
  private readonly base = 'http://127.0.0.1:8002/api';

  providers(): Observable<Provider[]> { return this.http.get<Provider[]>(`${this.base}/validaciones/prestadores`); }
  createProvider(provider: Omit<Provider, 'estado_matricula' | 'estado_renaper'> & Partial<Pick<Provider, 'estado_matricula' | 'estado_renaper'>>): Observable<Provider> {
    return this.http.post<Provider>(`${this.base}/validaciones/prestadores`, provider);
  }
  validate(dni: string, type: 'renaper' | 'matricula'): Observable<Record<string, string>> {
    return this.http.get<Record<string, string>>(`${this.base}/validaciones/${type}/${encodeURIComponent(dni)}`);
  }
  documents(dni?: string): Observable<VaultDocument[]> {
    let params = new HttpParams();
    if (dni) params = params.set('dni_prestador', dni);
    return this.http.get<VaultDocument[]>(`${this.base}/boveda`, { params });
  }
  upload(document: { dni_prestador: string; nombre_archivo: string; tipo_documento: string; contenido_base64: string }): Observable<VaultDocument> {
    return this.http.post<VaultDocument>(`${this.base}/boveda`, document);
  }
  catalog(q = ''): Observable<CatalogItem[]> {
    let params = new HttpParams();
    if (q) params = params.set('q', q);
    return this.http.get<CatalogItem[]>(`${this.base}/nomenclador`, { params });
  }
  createCatalog(item: CatalogItem): Observable<CatalogItem> {
    return this.http.post<CatalogItem>(`${this.base}/nomenclador`, item);
  }
  cases(): Observable<AuditCase[]> { return this.http.get<AuditCase[]>(`${this.base}/casos`); }
  createCase(payload: Pick<AuditCase, 'dni_prestador' | 'codigo_nomenclador' | 'observaciones' | 'auditor_id'>): Observable<AuditCase> {
    return this.http.post<AuditCase>(`${this.base}/casos`, payload);
  }
  updateCase(id: number, status: AuditCase['estado_autorizacion']): Observable<AuditCase> {
    return this.http.patch<AuditCase>(`${this.base}/casos/${id}`, { estado_autorizacion: status });
  }
  contentUrl(document: VaultDocument): string { return `http://127.0.0.1:8002${document.url_contenido}`; }
}
