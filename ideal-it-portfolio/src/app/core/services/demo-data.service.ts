import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Demo, DemoApiSample } from '../models/demo.model';

const DEMO_DATA: Demo[] = [
  {
    id: 'personal-biometrico',
    title: 'MVP Personal & Control Biométrico',
    summary: 'Gestión de nómina, áreas y simulación de tramas IP (ZKBio/Suprema).',
    description:
      'Subsistema local e independiente para gestionar personal, áreas, licencias y reportes de asistencia. El simulador biométrico genera actividad sintética: no se conecta a terminales reales.',
    category: 'Gestión de personal',
    technologies: ['Angular', 'Tailwind', 'FastAPI', 'SQLite'],
    status: 'mvp',
    sourcePaths: [
      'mvp-personal/',
      'portfolio/Sistema DOSEP Prestadores/pmvp/prestadores-mvp-2110/prestadores-mvp/',
    ],
  },
  {
    id: 'auditoria-healthcore',
    title: 'MVP Auditoría & Bóveda Documental (HealthCore)',
    summary: 'Visor de documentos de salud, validaciones y nomencladores médicos.',
    description:
      'Panel independiente de auditoría médica y documental con previsualizaciones de muestra, validaciones ficticias de matrícula/identidad y un catálogo demostrativo. No consulta registros oficiales ni contiene historias clínicas reales.',
    category: 'Salud & auditoría',
    technologies: ['Angular', 'Tailwind', 'FastAPI', 'SQLite'],
    status: 'mvp',
    sourcePaths: [
      'mvp-auditoria/',
      'portfolio/Sistema DOSEP Prestadores/pmvp/prestadores-mvp-2110/prestadores-mvp/',
    ],
  },
  {
    id: 'formularios-turismo',
    title: 'MVP Formularios & Turismo Municipal',
    summary: 'Eventos turísticos, inscripciones ciudadanas y validación por códigos QR.',
    description:
      'Plataforma local para publicar eventos gratuitos, gestionar inscripciones y registrar la asistencia mediante códigos QR. El subsistema conserva su propia API y base de datos.',
    category: 'Turismo & GovTech',
    technologies: ['Angular standalone', 'Bootstrap', 'FastAPI', 'SQLite'],
    status: 'mvp',
    previewPath: '/mvp/formularios',
    sourcePaths: [
      'mvp-formularios/',
      'portfolio/Sistema ALANTIA Formularios/gestion-form-lp/panel/',
    ],
  },
  {
    id: 'osma-inspecciones',
    title: 'MVP OSMA Inspecciones',
    summary: 'Inspecciones de campo mobile-first con PWA y operación offline.',
    description:
      'Subsistema independiente para digitalizar planillas de campo, consultar afiliados y sincronizar una cola local cuando regresa la conectividad. Su frontend React PWA y backend FastAPI se ejecutan por separado.',
    category: 'Inspecciones & PWA',
    technologies: ['React PWA', 'FastAPI', 'SQLAlchemy', 'SQLite'],
    status: 'mvp',
    sourcePaths: [
      'mvp-osma-inspecciones/',
      'portfolio/Sistema OSMA Inspecciones/OSMApre/',
    ],
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
