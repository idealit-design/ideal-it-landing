import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgClass } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Demo } from '../../../core/models/demo.model';

@Component({
    selector: 'app-demo-details-modal',
    imports: [NgClass, RouterLink],
    templateUrl: './demo-details-modal.component.html'
})
export class DemoDetailsModalComponent {
  @Input({ required: true }) demo!: Demo;
  @Output() closed = new EventEmitter<void>();

  get hasPublicPreview(): boolean {
    return Boolean(this.demo.previewPath || this.demo.previewUrl);
  }

  get availabilityLabel(): string {
    return this.demo.availability === 'vm-private' ? 'Demo privada en la VM' : 'En preparación';
  }

  get accentClasses(): string {
    switch (this.demo.serviceType) {
      case 'development':
        return 'border-violet-300/20 bg-violet-300/[0.06] text-violet-200';
      case 'application':
        return 'border-sky-300/20 bg-sky-300/[0.06] text-sky-200';
      case 'commercial-page':
        return 'border-emerald-300/20 bg-emerald-300/[0.06] text-emerald-200';
      case 'utility':
        return 'border-amber-300/20 bg-amber-300/[0.06] text-amber-200';
    }
  }

  close(): void {
    this.closed.emit();
  }
}
