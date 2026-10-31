import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Demo, DemoApiSample } from '../models/demo.model';

const DEMO_DATA: Demo[] = [
  {
    id: 'healthcore-vault',
    title: 'HealthCore Vault & Audit System',
    summary: 'Gestión documental, Biometría IP y Auditoría',
    description:
      'Un espacio seguro para centralizar documentación clínica, registrar accesos y consultar una bitácora de auditoría.',
    category: 'Salud & seguridad',
    technologies: ['Angular', 'Tailwind', 'Python API', 'SQLite'],
    status: 'live',
  },
  {
    id: 'alantia-forms',
    title: 'Alantia Forms',
    summary: 'Formularios digitales y flujos de aprobación',
    description:
      'Diseña formularios adaptables, organiza solicitudes y acompaña cada proceso con estados y responsables.',
    category: 'Automatización',
    technologies: ['Angular', 'Tailwind', 'API'],
    status: 'mvp',
  },
  {
    id: 'crypto-bot',
    title: 'Crypto Bot',
    summary: 'Panel de seguimiento para activos digitales',
    description:
      'Una experiencia de seguimiento de mercado con alertas y vistas de datos pensadas para una lectura rápida.',
    category: 'Fintech',
    technologies: ['Angular', 'Python API'],
    status: 'coming-soon',
  },
  {
    id: 'municipium',
    title: 'Municipium',
    summary: 'Servicios y gestiones para la comunidad',
    description:
      'Un punto de acceso digital para acercar trámites, novedades y servicios municipales a cada vecino.',
    category: 'GovTech',
    technologies: ['Angular', 'API'],
    status: 'mvp',
  },
];

@Injectable({ providedIn: 'root' })
export class DemoDataService {
  private readonly http = inject(HttpClient);

  readonly apiUrl = 'https://jsonplaceholder.typicode.com';

  getDemos(): Observable<Demo[]> {
    return of(DEMO_DATA);
  }

  getSampleResponse(): Observable<DemoApiSample> {
    return this.http.get<DemoApiSample>(`${this.apiUrl}/posts/1`);
  }
}
