import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Demo } from '../../core/models/demo.model';
import { DEMO_CATEGORIES } from '../../core/models/demo-category.model';
import { DemoDataService } from '../../core/services/demo-data.service';
import { routes } from '../../app.routes';
import { AdditionalServicesComponent } from '../additional-services/additional-services.component';
import { DemosHubComponent } from './demos-hub.component';

describe('DemosHubComponent', () => {
  let fixture: ComponentFixture<DemosHubComponent>;
  let publicDemos: Demo[] = [];
  let allDemos: Demo[] = [];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DemosHubComponent],
      providers: [provideRouter(routes)],
    }).compileComponents();

    const dataService = TestBed.inject(DemoDataService);
    dataService.getPublicExperiences().subscribe((demos) => (publicDemos = demos));
    dataService.getDemos().subscribe((demos) => (allDemos = demos));
    fixture = TestBed.createComponent(DemosHubComponent);
    fixture.detectChanges();
  });

  it('shows only the eight public and usable experiences on the home page', () => {
    const element = fixture.nativeElement as HTMLElement;
    const content = element.textContent ?? '';

    expect(publicDemos.map((demo) => demo.id)).toEqual([
      'personal-biometrico',
      'auditoria-healthcore',
      'formularios-turismo',
      'rincon-gourmet',
      'pluma-y-tinta',
      'manos-maestras',
      'ecohuerta-urbana',
      'fixit-express',
    ]);
    expect(element.querySelectorAll('app-demo-card').length).toBe(8);
    expect(content).toContain('Experiencias para explorar');
    expect(content).toContain('Gestión de Personal & Control Biométrico');
    expect(content).toContain('El Rincón Gourmet');
    expect(content).not.toContain('AgroTech & Telemetría');
    expect(content).not.toContain('Tienda Virtual');
    expect(content).not.toContain('Solicitar demo');
    expect(content).not.toContain('127.0.0.1');
    expect(content).toContain('Ver servicios adicionales');
  });

  it('links all public cards to valid interactive or static previews', () => {
    const element = fixture.nativeElement as HTMLElement;

    for (const demo of publicDemos) {
      fixture.componentInstance.selectDemo(demo);
      fixture.detectChanges();
      const dialog = element.querySelector<HTMLElement>('[role="dialog"]');

      expect(dialog).not.toBeNull();
      if (demo.previewPath) {
        expect(routes.some((route) => `/${route.path}` === demo.previewPath)).toBeTrue();
        const link = dialog?.querySelector<HTMLAnchorElement>(`a[href="${demo.previewPath}"]`);
        expect(link?.textContent).toContain('Abrir demo interactiva');
      } else if (demo.previewUrl) {
        const link = dialog?.querySelector<HTMLAnchorElement>(`a[href="${demo.previewUrl}"]`);
        expect(link).not.toBeNull();
        expect(link?.target).toBe('_blank');
        expect(link?.rel).toContain('noopener');
        expect(link?.rel).toContain('noreferrer');
      }

      fixture.componentInstance.closeDetails();
      fixture.detectChanges();
    }
  });

  it('keeps every catalog item assigned to exactly one category', () => {
    const categoryIds = DEMO_CATEGORIES.flatMap((category) => category.demoIds);
    const catalogIds = allDemos.map((demo) => demo.id);

    expect(catalogIds.length).toBe(18);
    expect(categoryIds.length).toBe(catalogIds.length);
    expect(new Set(categoryIds).size).toBe(categoryIds.length);
    expect([...categoryIds].sort()).toEqual([...catalogIds].sort());
  });

  it('routes visitors to the secondary catalog instead of offering a fake request flow', () => {
    const element = fixture.nativeElement as HTMLElement;
    const link = element.querySelector<HTMLAnchorElement>('a[href="/servicios-adicionales"]');

    expect(link?.textContent).toContain('Ver servicios adicionales');
    expect(routes.some((route) => route.path === 'servicios-adicionales')).toBeTrue();
  });
});

describe('AdditionalServicesComponent', () => {
  let fixture: ComponentFixture<AdditionalServicesComponent>;
  let additionalDemos: Demo[] = [];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdditionalServicesComponent],
      providers: [provideRouter(routes)],
    }).compileComponents();

    TestBed.inject(DemoDataService)
      .getAdditionalServices()
      .subscribe((demos) => (additionalDemos = demos));
    fixture = TestBed.createComponent(AdditionalServicesComponent);
    fixture.detectChanges();
  });

  it('shows all non-public entries as private or in preparation, without local links', () => {
    const element = fixture.nativeElement as HTMLElement;
    const content = element.textContent ?? '';

    expect(additionalDemos.length).toBe(10);
    expect(element.querySelectorAll('app-demo-card').length).toBe(10);
    expect(content).toContain('Servicios adicionales');
    expect(content).toContain('Demo privada en la VM');
    expect(content).toContain('En preparación');
    expect(content).not.toContain('Solicitar demo');
    expect(content).not.toContain('href="http://127.0.0.1');
    expect(content).not.toContain('href="http://localhost');
    expect(
      Array.from(element.querySelectorAll('app-demo-card article')).every((card) =>
        card.className.includes('opacity-75'),
      ),
    ).toBeTrue();
  });

  it('states that VM demos are private and does not render a public launch link', () => {
    const privateDemo = additionalDemos.find((demo) => demo.id === 'pos-comercio');
    expect(privateDemo).toBeDefined();
    fixture.componentInstance.selectDemo(privateDemo!);
    fixture.detectChanges();

    const dialog = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('[role="dialog"]');
    expect(dialog?.textContent).toContain('Demo privada en la VM');
    expect(dialog?.textContent).toContain('sin enlace público desde Vercel');
    expect(dialog?.textContent).not.toContain('Solicitar demo');
    expect(dialog?.querySelector('a')).toBeNull();
  });

  it('labels planned entries and does not imply they are deployed', () => {
    const plannedDemo = additionalDemos.find((demo) => demo.id === 'municipium-landing');
    expect(plannedDemo?.availability).toBe('planned');
    fixture.componentInstance.selectDemo(plannedDemo!);
    fixture.detectChanges();

    const dialog = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('[role="dialog"]');
    expect(dialog?.textContent).toContain('En preparación');
    expect(dialog?.textContent).toContain('preview pública');
    expect(dialog?.textContent).toContain('No se abre ninguna conexión a la VM');
    expect(dialog?.textContent).not.toContain('Solicitar demo');
  });
});
