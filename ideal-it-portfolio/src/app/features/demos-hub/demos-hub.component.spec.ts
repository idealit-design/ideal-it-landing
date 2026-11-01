import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { Demo } from '../../core/models/demo.model';
import { routes } from '../../app.routes';
import { DemosHubComponent } from './demos-hub.component';

describe('DemosHubComponent', () => {
  let fixture: ComponentFixture<DemosHubComponent>;
  let demos: Demo[] = [];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DemosHubComponent],
      providers: [provideRouter([]), provideHttpClient()],
    }).compileComponents();

    fixture = TestBed.createComponent(DemosHubComponent);
    fixture.componentInstance.demos$.subscribe((items) => (demos = items));
    fixture.detectChanges();
  });

  it('renders all MVP and historical portfolio cards with technology tags', () => {
    const content = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(content).toContain('Diseñamos tecnología.');
    expect(content).toContain('Nuestros trabajos');
    expect(content).toContain('Gestión de Personal & Control Biométrico');
    expect(content).toContain('Auditoría & Bóveda Documental (HealthCore)');
    expect(content).toContain('Formularios & Turismo Municipal');
    expect(content).toContain('Inspecciones de Campo');
    expect(content).toContain('Automatización de Señales');
    expect(content).toContain('Logística & Smart Fleet');
    expect(content).toContain('AgroTech & Telemetría');
    expect(content).toContain('Control de Visitantes');
    expect(content).toContain('App educativa infantil');
    expect(content).toContain('Trazabilidad frigorífica');
    expect(content).toContain('POS & cierre de caja');
    expect(content).toContain('Portal municipal de demostración');
    expect(content).toContain('Sitio de servicios digitales');
    expect(content).toContain('FastAPI');
    expect(content).toContain('Angular');
    expect(content).toContain('El Rincón Gourmet');
    expect(content).toContain('Pluma y Tinta');
    expect(content).toContain('Manos Maestras');
    expect(content).toContain('EcoHuerta Urbana');
    expect(content).toContain('FixIt Express');
    expect((fixture.nativeElement as HTMLElement).querySelectorAll('app-demo-card').length).toBe(18);
  });

  it('filters projects by service type, availability, features, and normalized title or technology search', () => {
    const component = fixture.componentInstance;

    component.selectedServiceType = 'utility';
    expect(component.filterDemos(demos).map((demo) => demo.id)).toEqual(['pos-comercio']);

    component.selectedServiceType = '';
    component.selectedState = 'interactive';
    expect(component.filterDemos(demos).map((demo) => demo.id)).toEqual([
      'personal-biometrico',
      'auditoria-healthcore',
      'formularios-turismo',
    ]);

    component.selectedState = 'all';
    component.filters.hasDemo = true;
    component.filters.hasBackend = true;
    expect(component.filterDemos(demos).map((demo) => demo.id)).toEqual([
      'personal-biometrico',
      'auditoria-healthcore',
      'formularios-turismo',
    ]);

    component.filters = { hasDemo: false, hasBackend: false };
    component.searchTerm = 'postgreSQL';
    expect(component.filterDemos(demos).map((demo) => demo.id)).toContain('agrotech-iot');
  });

  it('filters cards through the visible search and selects, then clears all filters', () => {
    const element = fixture.nativeElement as HTMLElement;
    const search = element.querySelector<HTMLInputElement>('input[name="demo-search"]')!;
    search.value = 'React Native';
    search.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(element.querySelectorAll('app-demo-card').length).toBe(1);
    expect(element.textContent).toContain('App educativa infantil');

    const serviceType = element.querySelector<HTMLSelectElement>('select[name="service-type"]')!;
    serviceType.value = 'utility';
    serviceType.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(element.querySelectorAll('app-demo-card').length).toBe(0);
    expect(element.textContent).toContain('No encontramos proyectos');

    element.querySelector<HTMLButtonElement>('button')?.click();
    fixture.detectChanges();
    expect(element.querySelectorAll('app-demo-card').length).toBe(18);
  });

  it('uses client-facing actions without exposing internal implementation metadata', () => {
    const element = fixture.nativeElement as HTMLElement;
    const buttons = Array.from(
      element.querySelectorAll<HTMLButtonElement>('app-demo-card button'),
    );
    const requestButtons = buttons.filter((button) => button.textContent?.includes('Solicitar demo'));
    const previewButtons = buttons.filter((button) => button.textContent?.includes('Explorar demo'));

    expect(requestButtons.length).toBe(10);
    expect(previewButtons.length).toBe(8);
    expect(element.textContent).not.toContain('Landing online');
    expect(element.textContent).not.toContain('Demo interactiva');
    expect(element.textContent).not.toContain('MVP local');
    expect(element.textContent).not.toContain('Arquitectura propuesta');
    expect(element.textContent).not.toContain('Landing autónoma');

    const cards = Array.from(element.querySelectorAll<HTMLElement>('app-demo-card'));
    cards.forEach((card) => {
      expect(card.querySelector('.grid.h-12.w-12')).toBeNull();
      expect(card.querySelectorAll('[aria-label="Tecnologías"] > span').length).toBeLessThanOrEqual(3);
      const actionButton = card.querySelector('button');
      expect(actionButton?.parentElement?.querySelector('a')).not.toBeNull();
    });

    const visitorCard = cards.find((card) => card.textContent?.includes('Control de Visitantes'));
    const visitorTechnologies = Array.from(
      visitorCard?.querySelectorAll('[aria-label="Tecnologías"] > span') ?? [],
    ).map((technology) => technology.textContent?.trim());
    expect(visitorTechnologies).toEqual(['PHP 8', 'SQLite', 'Tailwind CSS']);

    const personalCard = cards.find((card) =>
      card.textContent?.includes('Gestión de Personal & Control Biométrico'),
    );
    const personalTechnologies = Array.from(
      personalCard?.querySelectorAll('[aria-label="Tecnologías"] > span') ?? [],
    ).map((technology) => technology.textContent?.trim());
    expect(personalTechnologies).toEqual(['Angular', 'FastAPI', 'SQLite']);

    const agroCard = cards.find((card) => card.textContent?.includes('AgroTech & Telemetría'));
    const agroTechnologies = Array.from(
      agroCard?.querySelectorAll('[aria-label="Tecnologías"] > span') ?? [],
    ).map((technology) => technology.textContent?.trim());
    expect(agroTechnologies).toEqual(['Vue 3', 'Gin', 'PostgreSQL']);
  });

  it('links all eighteen home cards to their corresponding category landing', () => {
    const links = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLAnchorElement>(
        'app-demo-card a[href^="/desarrollos"], app-demo-card a[href^="/aplicaciones"], app-demo-card a[href^="/paginas-comerciales"]',
      ),
    );

    expect(links.length).toBe(18);
    expect(links.filter((link) => link.href.endsWith('/desarrollos')).length).toBe(5);
    expect(links.filter((link) => link.href.endsWith('/aplicaciones')).length).toBe(7);
    expect(links.filter((link) => link.href.endsWith('/paginas-comerciales')).length).toBe(6);
  });

  it('identifies the municipal landing as local without linking it as a deployed preview', () => {
    const municipal = demos.find((demo) => demo.id === 'municipium-landing');
    expect(municipal?.status).toBe('landing');
    expect(municipal?.sourcePaths).toContain('web-landing-municipal/');
    expect(municipal?.previewUrl).toBeUndefined();

    const element = fixture.nativeElement as HTMLElement;
    const card = Array.from(element.querySelectorAll('app-demo-card')).find((candidate) =>
      candidate.textContent?.includes('Portal municipal de demostración'),
    );
    expect(card?.textContent).toContain('Solicitar demo');
  });

  it('shows three clean conceptual mockups for each project without a public preview', () => {
    const element = fixture.nativeElement as HTMLElement;
    const demosWithoutPreview = demos.filter((demo) => !demo.previewPath && !demo.previewUrl);

    expect(demosWithoutPreview.length).toBe(10);
    demosWithoutPreview.forEach((demo) => {
      fixture.componentInstance.selectDemo(demo);
      fixture.detectChanges();

      const dialog = element.querySelector('[role="dialog"]');
      expect(dialog?.querySelectorAll('[aria-label^="Vista conceptual:"]').length).toBe(3);
      expect(dialog?.textContent).toContain('Solicitar demo');
      expect(dialog?.textContent).not.toContain('mvp-personal/');

      element.querySelector<HTMLButtonElement>('[aria-label="Cerrar detalle"]')?.click();
      fixture.detectChanges();
    });
  });

  it('gives every card a valid route, safe landing link, or controlled detail action', () => {
    const element = fixture.nativeElement as HTMLElement;

    for (const demo of demos) {
      if (demo.previewPath) {
        expect(routes.some((route) => `/${route.path}` === demo.previewPath)).toBeTrue();
      }

      fixture.componentInstance.selectDemo(demo);
      fixture.detectChanges();
      const dialog = element.querySelector<HTMLElement>('[role="dialog"]');

      expect(dialog).not.toBeNull();
      if (demo.previewUrl) {
        const link = dialog?.querySelector<HTMLAnchorElement>(`a[href="${demo.previewUrl}"]`);
        expect(link).not.toBeNull();
        expect(link?.target).toBe('_blank');
        expect(link?.rel).toContain('noopener');
        expect(link?.rel).toContain('noreferrer');
      } else if (!demo.previewPath) {
        expect(dialog?.textContent).toContain('Solicitar demo');
      }
    }
  });

  it('opens and closes the selected demo details', () => {
    const element = fixture.nativeElement as HTMLElement;
    const enterButton = Array.from(element.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Explorar demo'),
    );

    enterButton?.click();
    fixture.detectChanges();
    expect(element.querySelector('[role="dialog"]')?.textContent).toContain('Gestión de Personal & Control Biométrico');

    element.querySelector<HTMLButtonElement>('[aria-label="Cerrar detalle"]')?.click();
    fixture.detectChanges();
    expect(element.querySelector('[role="dialog"]')).toBeNull();
  });

  it('links the Formularios detail to its isolated interactive preview', () => {
    const formularios = demos.find((demo) => demo.id === 'formularios-turismo');
    expect(formularios).toBeDefined();
    fixture.componentInstance.selectDemo(formularios!);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const link = element.querySelector<HTMLAnchorElement>('a[href="/mvp/formularios"]');

    expect(link?.textContent).toContain('Abrir demo interactiva');
    expect(element.textContent).not.toContain('mvp-formularios/');
  });

  it('opens a proposal and labels its implementation status honestly', () => {
    const proposal = demos.find((demo) => demo.id === 'frigorifico-trazabilidad');
    expect(proposal).toBeDefined();
    fixture.componentInstance.selectDemo(proposal!);
    fixture.detectChanges();

    const dialog = (fixture.nativeElement as HTMLElement).querySelector('[role="dialog"]');
    expect(dialog?.textContent).toContain('validar código');
  });

  it('links commercial landing cards to their independent static previews', () => {
    const landing = demos.find((demo) => demo.id === 'rincon-gourmet');
    expect(landing?.status).toBe('landing');
    expect(landing?.sourcePaths).toContain('landings/el-rincon-gourmet/');
    fixture.componentInstance.selectDemo(landing!);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const link = element.querySelector<HTMLAnchorElement>('a[href="/landings/el-rincon-gourmet/"]');

    expect(link?.textContent).toContain('Abrir landing comercial');
    expect(link?.target).toBe('_blank');
    expect(link?.rel).toContain('noopener');
    expect(link?.rel).toContain('noreferrer');
    expect(element.textContent).not.toContain('Landing online');
  });
});
