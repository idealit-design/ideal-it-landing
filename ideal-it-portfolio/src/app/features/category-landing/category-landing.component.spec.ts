import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
import { firstValueFrom } from 'rxjs';
import { DEMO_CATEGORIES } from '../../core/models/demo-category.model';
import { DemoDataService } from '../../core/services/demo-data.service';
import { CategoryLandingComponent } from './category-landing.component';

describe('CategoryLandingComponent', () => {
  let fixture: ComponentFixture<CategoryLandingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CategoryLandingComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { data: { categoryId: 'desarrollos' } } },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CategoryLandingComponent);
    fixture.detectChanges();
  });

  it('renders only the selected category and updates its SEO metadata', () => {
    const element = fixture.nativeElement as HTMLElement;
    const cards = element.querySelectorAll('app-demo-card');

    expect(element.querySelector('h1')?.textContent).toContain('Desarrollos y MVPs Core');
    expect(cards.length).toBe(5);
    expect(element.textContent).toContain('MVP Auditoría & Bóveda Documental (HealthCore)');
    expect(element.textContent).not.toContain('El Rincón Gourmet');
    expect(TestBed.inject(Title).getTitle()).toBe('Desarrollos y MVPs Core | Ideal-IT');
    expect(TestBed.inject(Meta).getTag('name="description"')?.content).toContain(
      'desarrollos de software core',
    );
  });

  it('assigns every catalog item to exactly one category', async () => {
    const demoDataService = TestBed.inject(DemoDataService);
    const demos = await firstValueFrom(demoDataService.getDemos());
    const categoryIds = DEMO_CATEGORIES.flatMap((category) => category.demoIds);

    expect(new Set(categoryIds).size).toBe(18);
    expect([...categoryIds].sort()).toEqual(demos.map((demo) => demo.id).sort());
    expect(DEMO_CATEGORIES.map((category) => category.demoIds.length)).toEqual([5, 7, 6]);

    for (const category of DEMO_CATEGORIES) {
      const filtered = await firstValueFrom(demoDataService.getDemosForCategory(category));
      expect(filtered.map((demo) => demo.id)).toEqual(category.demoIds);
    }
  });

  it('provides clear navigation back to the full portfolio and other categories', () => {
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('nav[aria-label="Breadcrumb"]')).not.toBeNull();
    expect(element.querySelector('a[href="/"]')?.textContent).toContain('IDEAL');
    expect(element.textContent).toContain('Volver al catálogo completo');
    expect(element.textContent).toContain('Aplicaciones y Portales');
    expect(element.textContent).toContain('Páginas Comerciales');
  });

  it('keeps the interactive preview link available from a category card detail', async () => {
    const demos = await firstValueFrom(TestBed.inject(DemoDataService).getDemos());
    const personalDemo = demos.find((demo) => demo.id === 'personal-biometrico');

    expect(personalDemo).toBeDefined();
    fixture.componentInstance.selectDemo(personalDemo!);
    fixture.detectChanges();

    const preview = (fixture.nativeElement as HTMLElement).querySelector<HTMLAnchorElement>(
      'a[href="/mvp/personal"]',
    );
    expect(preview?.textContent).toContain('Abrir preview interactiva');
  });
});
