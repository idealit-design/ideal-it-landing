import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { Demo } from '../../core/models/demo.model';
import { DemoDataService } from '../../core/services/demo-data.service';
import { DemosHubComponent } from './demos-hub.component';

const DEMOS: Demo[] = [
  {
    id: 'personal-biometrico',
    title: 'MVP Personal & Control Biométrico',
    summary: 'Gestión de nómina, áreas y simulación de tramas IP (ZKBio/Suprema).',
    description: 'Demo de gestión documental segura.',
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
    description: 'MVP independiente de auditoría documental.',
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
    description: 'MVP local de turismo municipal.',
    category: 'Turismo & GovTech',
    technologies: ['Angular', 'Bootstrap/Tailwind', 'FastAPI', 'SQLite'],
    status: 'mvp',
    sourcePaths: [
      'mvp-formularios/',
      'portfolio/Sistema ALANTIA Formularios/gestion-form-lp/panel/',
    ],
  },
  {
    id: 'osma-inspecciones',
    title: 'MVP OSMA Inspecciones',
    summary: 'Inspecciones de campo mobile-first con PWA y operación offline.',
    description: 'MVP local de inspecciones.',
    category: 'Inspecciones & PWA',
    technologies: ['React PWA', 'FastAPI', 'SQLAlchemy', 'SQLite'],
    status: 'mvp',
    sourcePaths: [
      'mvp-osma-inspecciones/',
      'portfolio/Sistema OSMA Inspecciones/OSMApre/',
    ],
  },
];

describe('DemosHubComponent', () => {
  let fixture: ComponentFixture<DemosHubComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DemosHubComponent],
      providers: [
        provideRouter([]),
        {
          provide: DemoDataService,
          useValue: { getDemos: () => of(DEMOS) },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DemosHubComponent);
    fixture.detectChanges();
  });

  it('renders the portfolio hero, MVP cards, and technology tags', () => {
    const content = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(content).toContain('Soluciones de software');
    expect(content).toContain('Nuestros trabajos');
    expect(content).toContain('MVP Personal & Control Biométrico');
    expect(content).toContain('MVP Auditoría & Bóveda Documental (HealthCore)');
    expect(content).toContain('MVP Formularios & Turismo Municipal');
    expect(content).toContain('MVP OSMA Inspecciones');
    expect(content).toContain('Bootstrap/Tailwind');
    expect((fixture.nativeElement as HTMLElement).querySelectorAll('app-demo-card').length).toBe(4);
    for (const technology of DEMOS[0].technologies) {
      expect(content).toContain(technology);
    }
  });

  it('marks portfolio projects as local MVPs rather than public demos', () => {
    const buttons = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('button'),
    );
    const projectButtons = buttons.filter((button) =>
      button.textContent?.includes('Ver detalles del MVP'),
    );

    expect(projectButtons.length).toBe(4);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('MVP local');
  });

  it('shows the corresponding relative subsystem reference in each card detail', () => {
    const element = fixture.nativeElement as HTMLElement;
    const cards = Array.from(element.querySelectorAll('app-demo-card'));

    expect(cards.length).toBe(DEMOS.length);
    cards.forEach((card, index) => {
      card.querySelector<HTMLButtonElement>('button')?.click();
      fixture.detectChanges();

      const dialogContent = element.querySelector('[role="dialog"]')?.textContent ?? '';
      for (const sourcePath of DEMOS[index].sourcePaths) {
        expect(dialogContent).toContain(sourcePath);
      }

      element.querySelector<HTMLButtonElement>('[aria-label="Cerrar detalle"]')?.click();
      fixture.detectChanges();
    });
  });

  it('opens and closes the selected demo details', () => {
    const element = fixture.nativeElement as HTMLElement;
    const enterButton = Array.from(element.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Ver detalles del MVP'),
    );

    enterButton?.click();
    fixture.detectChanges();
    expect(element.querySelector('[role="dialog"]')?.textContent).toContain(
      'MVP aislado de ejecución local.',
    );

    element.querySelector<HTMLButtonElement>('[aria-label="Cerrar detalle"]')?.click();
    fixture.detectChanges();
    expect(element.querySelector('[role="dialog"]')).toBeNull();
  });
});
