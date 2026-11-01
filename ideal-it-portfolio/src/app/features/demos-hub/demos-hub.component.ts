import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { Demo, DemoServiceType } from '../../core/models/demo.model';
import { DEMO_CATEGORIES, getDemoCategoryPath } from '../../core/models/demo-category.model';
import { DemoDataService } from '../../core/services/demo-data.service';
import { DemoCardComponent } from '../../shared/components/demo-card/demo-card.component';

@Component({
  selector: 'app-demos-hub',
  standalone: true,
  imports: [AsyncPipe, DemoCardComponent, FormsModule, RouterLink],
  templateUrl: './demos-hub.component.html',
})
export class DemosHubComponent {
  private readonly demoDataService = inject(DemoDataService);

  readonly demos$: Observable<Demo[]> = this.demoDataService.getDemos();
  readonly categories = DEMO_CATEGORIES;
  readonly serviceTypes: { value: DemoServiceType; label: string }[] = [
    { value: 'development', label: 'Desarrollos' },
    { value: 'application', label: 'Aplicaciones' },
    { value: 'commercial-page', label: 'Páginas Comerciales' },
    { value: 'utility', label: 'Utilitarios' },
  ];
  readonly states = [
    { value: 'all', label: 'Todos los estados' },
    { value: 'mvp', label: 'MVP Local' },
    { value: 'preview', label: 'Preview Interactiva' },
    { value: 'landing', label: 'Landing Estática' },
    { value: 'planned', label: 'Propuesta por validar' },
  ] as const;
  selectedServiceType: DemoServiceType | '' = '';
  selectedState: (typeof this.states)[number]['value'] = 'all';
  searchTerm = '';
  filters = { hasDemo: false, isPreview: false, hasBackend: false };
  selectedDemo: Demo | null = null;

  filterDemos(demos: Demo[]): Demo[] {
    const query = this.normalizeText(this.searchTerm.trim());

    return demos.filter((demo) => {
      const matchesService = !this.selectedServiceType || demo.serviceType === this.selectedServiceType;
      const matchesState =
        this.selectedState === 'all' ||
        (this.selectedState === 'mvp' && demo.status === 'mvp') ||
        (this.selectedState === 'preview' && demo.isPreview) ||
        (this.selectedState === 'landing' && demo.status === 'landing') ||
        (this.selectedState === 'planned' && demo.status === 'planned');
      const matchesFeatures =
        (!this.filters.hasDemo || demo.hasDemo) &&
        (!this.filters.isPreview || demo.isPreview) &&
        (!this.filters.hasBackend || demo.hasBackend);
      const searchableText = this.normalizeText(
        [demo.title, demo.summary, demo.category, ...demo.technologies].join(' '),
      );

      return matchesService && matchesState && matchesFeatures && (!query || searchableText.includes(query));
    });
  }

  clearFilters(): void {
    this.selectedServiceType = '';
    this.selectedState = 'all';
    this.searchTerm = '';
    this.filters = { hasDemo: false, isPreview: false, hasBackend: false };
  }

  categoryPath(demoId: string): string | undefined {
    return getDemoCategoryPath(demoId);
  }

  selectDemo(demo: Demo): void {
    this.selectedDemo = demo;
  }

  closeDetails(): void {
    this.selectedDemo = null;
  }

  private normalizeText(value: string): string {
    return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase();
  }
}
