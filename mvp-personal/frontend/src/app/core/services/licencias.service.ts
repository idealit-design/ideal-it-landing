import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export interface License {
  id: number;
  dni: string;
  tipo: 'MEDICA' | 'VACACION' | 'OTRO';
  fecha_inicio: string;
  fecha_fin: string;
  motivo: string;
  estado: 'PENDING' | 'APPROVED' | 'REJECTED';
}

@Injectable({ providedIn: 'root' })
export class LicenciasService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://127.0.0.1:8001/api/licencias';

  list(dni = ''): Observable<License[]> {
    let params = new HttpParams();
    if (dni) params = params.set('dni', dni);
    return this.http.get<License[]>(this.apiUrl, { params });
  }

  create(license: Omit<License, 'id'>): Observable<License> {
    return this.http.post<License>(this.apiUrl, license);
  }
}
