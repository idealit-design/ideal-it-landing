import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export interface AttendanceRow {
  dni: string;
  fecha: string;
  estado: 'PRESENTE' | 'AUSENTE' | 'JUSTIFICADA';
  tipo_licencia: string | null;
  entrada: string | null;
  salida: string | null;
  marcas: number;
}

export interface AttendanceReport {
  fecha?: string;
  desde?: string;
  hasta?: string;
  dia_habil?: boolean;
  dias_incluidos?: string[];
  registros: AttendanceRow[];
  resumen: { presente: number; ausente: number; justificada: number };
}

@Injectable({ providedIn: 'root' })
export class ReportesService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://127.0.0.1:8001/api/reportes';

  daily(fecha: string): Observable<AttendanceReport> {
    return this.http.get<AttendanceReport>(`${this.apiUrl}/diario`, {
      params: new HttpParams().set('fecha', fecha),
    });
  }

  weekly(fecha: string): Observable<AttendanceReport> {
    return this.http.get<AttendanceReport>(`${this.apiUrl}/semanal`, {
      params: new HttpParams().set('fecha', fecha),
    });
  }
}
