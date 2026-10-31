import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { Demo } from '../../core/models/demo.model';
import { DemoDataService } from '../../core/services/demo-data.service';
import { DemosHubComponent } from './demos-hub.component';

const DEMOS: Demo[] = [
  {
    id: 'healthcore-vault',
    title: 'HealthCore Vault & Audit System',
    summary: 'Gestión documental, Biometría IP y Auditoría',
    description: 'Demo de gestión documental segura.',
    category: 'Salud & seguridad',
    technologies: ['Angular', 'Tailwind', 'Python API', 'SQLite'],
    status: 'live',
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

  it('renders the active HealthCore demo and its technology tags', () => {
    const content = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(content).toContain('HealthCore Vault & Audit System');
    expect(content).toContain('Ingresar a la Demo Live');
    for (const technology of DEMOS[0].technologies) {
      expect(content).toContain(technology);
    }
  });

  it('opens and closes the selected demo details', () => {
    const element = fixture.nativeElement as HTMLElement;
    const enterButton = Array.from(element.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Ingresar a la Demo Live'),
    );

    enterButton?.click();
    fixture.detectChanges();
    expect(element.querySelector('[role="dialog"]')?.textContent).toContain(
      'Demo de gestión documental segura.',
    );

    element.querySelector<HTMLButtonElement>('[aria-label="Cerrar detalle"]')?.click();
    fixture.detectChanges();
    expect(element.querySelector('[role="dialog"]')).toBeNull();
  });
});
