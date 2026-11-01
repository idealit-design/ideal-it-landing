import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { Demo } from '../../core/models/demo.model';
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

    expect(content).toContain('Soluciones de software');
    expect(content).toContain('Nuestros trabajos');
    expect(content).toContain('MVP Personal & Control Biométrico');
    expect(content).toContain('MVP Auditoría & Bóveda Documental (HealthCore)');
    expect(content).toContain('MVP Formularios & Turismo Municipal');
    expect(content).toContain('MVP Inspecciones de Campo');
    expect(content).toContain('MVP Automatización de Señales');
    expect(content).toContain('MVP Logística & Smart Fleet');
    expect(content).toContain('MVP AgroTech & Telemetría');
    expect(content).toContain('MVP Control de Visitantes');
    expect(content).toContain('App educativa infantil');
    expect(content).toContain('Trazabilidad frigorífica');
    expect(content).toContain('POS & cierre de caja');
    expect(content).toContain('Portal municipal de demostración');
    expect(content).toContain('Sitio de servicios digitales');
    expect(content).toContain('Bootstrap');
    expect(content).toContain('PostgreSQL');
    expect(content).toContain('El Rincón Gourmet');
    expect(content).toContain('Pluma y Tinta');
    expect(content).toContain('Manos Maestras');
    expect(content).toContain('EcoHuerta Urbana');
    expect(content).toContain('FixIt Express');
    expect((fixture.nativeElement as HTMLElement).querySelectorAll('app-demo-card').length).toBe(18);
  });

  it('distinguishes eight local MVPs, four proposals and standalone landings', () => {
    const buttons = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('button'),
    );
    const mvpButtons = buttons.filter((button) => button.textContent?.includes('Ver detalles del MVP'));
    const proposalButtons = buttons.filter((button) => button.textContent?.includes('Ver propuesta'));

    expect(mvpButtons.length).toBe(8);
    expect(proposalButtons.length).toBe(4);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('MVP local');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Arquitectura propuesta');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Landing autónoma');
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
    expect(card?.textContent).toContain('Ver detalles de la landing');
  });

  it('shows the corresponding relative subsystem reference in each card detail', () => {
    const element = fixture.nativeElement as HTMLElement;
    const cards = Array.from(element.querySelectorAll('app-demo-card'));

    expect(cards.length).toBe(demos.length);
    cards.forEach((card, index) => {
      card.querySelector<HTMLButtonElement>('button')?.click();
      fixture.detectChanges();

      const dialogContent = element.querySelector('[role="dialog"]')?.textContent ?? '';
      for (const sourcePath of demos[index].sourcePaths) {
        expect(dialogContent).toContain(sourcePath);
      }
      expect(dialogContent).not.toContain('portfolio/');
      expect(dialogContent).not.toContain('DOSEP');

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
      'datos temporales del navegador',
    );

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

    expect(link?.textContent).toContain('Abrir preview interactiva');
    expect(element.textContent).toContain('datos temporales del navegador');
    expect(element.textContent).toContain('aisladas de esta landing');
  });

  it('opens a proposal and labels its implementation status honestly', () => {
    const proposal = demos.find((demo) => demo.id === 'frigorifico-trazabilidad');
    expect(proposal).toBeDefined();
    fixture.componentInstance.selectDemo(proposal!);
    fixture.detectChanges();

    const dialog = (fixture.nativeElement as HTMLElement).querySelector('[role="dialog"]');
    expect(dialog?.textContent).toContain('arquitectura propuesta');
    expect(dialog?.textContent).toContain('deben validarse');
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
    expect(element.textContent).toContain('interacciones demostrativas en memoria');
  });
});
