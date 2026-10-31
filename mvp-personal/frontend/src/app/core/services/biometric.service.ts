import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export type BiometricDevice = 'ZKBio' | 'Suprema' | 'Hikvision';
export type MarkEvent = 'ENTRADA' | 'SALIDA';
export type Verification = 'VERIFIED' | 'FAILED';

export interface BiometricMark {
  id: number;
  dni: string;
  ip_dispositivo: string;
  marca_tiempo: string;
  tipo_evento: MarkEvent;
  estado_verificacion: Verification;
  dispositivo_modelo: BiometricDevice;
  simulado: true;
}

@Injectable({ providedIn: 'root' })
export class BiometricService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://127.0.0.1:8001/api/biometric/simular';

  simulate(mark: {
    dni?: string;
    ip_dispositivo: string;
    tipo_evento?: MarkEvent;
    estado_verificacion?: Verification;
    dispositivo_modelo: BiometricDevice;
  }): Observable<BiometricMark> {
    return this.http.post<BiometricMark>(this.apiUrl, mark);
  }
}
