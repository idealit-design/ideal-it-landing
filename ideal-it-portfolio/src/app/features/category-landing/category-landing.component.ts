import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { Demo } from '../../core/models/demo.model';
import {
  DEMO_CATEGORIES,
  DemoCategory,
} from '../../core/models/demo-category.model';
import { DemoDataService } from '../../core/services/demo-data.service';
import { DemoCardComponent } from '../../shared/components/demo-card/demo-card.component';

@Component({
  selector: 'app-category-landing',
  standalone: true,
  imports: [AsyncPipe, DemoCardComponent, RouterLink],
  templateUrl: './category-landing.component.html',
})
export class CategoryLandingComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly demoDataService = inject(DemoDataService);

  readonly category: DemoCategory;
  readonly demos$: Observable<Demo[]>;
  readonly relatedCategories = DEMO_CATEGORIES;
  selectedDemo: Demo | null = null;

  constructor() {
    const categoryId = this.route.snapshot.data['categoryId'];
    const category = DEMO_CATEGORIES.find((item) => item.id === categoryId);

    if (!category) {
      throw new Error(`No se encontró la configuración para la categoría "${categoryId}".`);
    }

    this.category = category;
    this.title.setTitle(category.seoTitle);
    this.meta.updateTag({ name: 'description', content: category.seoDescription });
    this.meta.updateTag({ property: 'og:title', content: category.seoTitle });
    this.meta.updateTag({ property: 'og:description', content: category.seoDescription });
    this.demos$ = this.demoDataService.getDemosForCategory(category);
  }

  selectDemo(demo: Demo): void {
    this.selectedDemo = demo;
  }

  closeDetails(): void {
    this.selectedDemo = null;
  }
}
