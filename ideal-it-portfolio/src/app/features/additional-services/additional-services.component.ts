import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { Demo } from '../../core/models/demo.model';
import { DemoDataService } from '../../core/services/demo-data.service';
import { DemoCardComponent } from '../../shared/components/demo-card/demo-card.component';
import { DemoDetailsModalComponent } from '../../shared/components/demo-details-modal/demo-details-modal.component';

@Component({
    selector: 'app-additional-services',
    imports: [AsyncPipe, DemoCardComponent, DemoDetailsModalComponent, RouterLink],
    templateUrl: './additional-services.component.html'
})
export class AdditionalServicesComponent {
  private readonly demoDataService = inject(DemoDataService);

  readonly demos$: Observable<Demo[]> = this.demoDataService.getAdditionalServices();
  selectedDemo: Demo | null = null;

  selectDemo(demo: Demo): void {
    this.selectedDemo = demo;
  }

  closeDetails(): void {
    this.selectedDemo = null;
  }
}
