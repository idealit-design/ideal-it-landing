import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { Demo } from '../../core/models/demo.model';
import { DEMO_CATEGORIES, getDemoCategoryPath } from '../../core/models/demo-category.model';
import { DemoDataService } from '../../core/services/demo-data.service';
import { DemoCardComponent } from '../../shared/components/demo-card/demo-card.component';
import { DemoDetailsModalComponent } from '../../shared/components/demo-details-modal/demo-details-modal.component';

@Component({
    selector: 'app-demos-hub',
    imports: [AsyncPipe, DemoCardComponent, DemoDetailsModalComponent, RouterLink],
    templateUrl: './demos-hub.component.html'
})
export class DemosHubComponent {
  private readonly demoDataService = inject(DemoDataService);

  readonly demos$: Observable<Demo[]> = this.demoDataService.getPublicExperiences();
  readonly categories = DEMO_CATEGORIES;
  selectedDemo: Demo | null = null;

  categoryPath(demoId: string): string | undefined {
    return getDemoCategoryPath(demoId);
  }

  selectDemo(demo: Demo): void {
    this.selectedDemo = demo;
  }

  closeDetails(): void {
    this.selectedDemo = null;
  }
}
