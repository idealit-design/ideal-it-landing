import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgClass } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Demo } from '../../../core/models/demo.model';

@Component({
  selector: 'app-demo-card',
  standalone: true,
  imports: [NgClass, RouterLink],
  templateUrl: './demo-card.component.html',
})
export class DemoCardComponent {
  @Input({ required: true }) demo!: Demo;
  @Input() categoryHref?: string;
  @Output() selected = new EventEmitter<Demo>();

  get hasPublicPreview(): boolean {
    return Boolean(this.demo.previewPath || this.demo.previewUrl);
  }

  get accentClasses(): string {
    switch (this.demo.serviceType) {
      case 'development':
        return 'border-l-violet-300/70 group-hover:border-violet-200';
      case 'application':
        return 'border-l-sky-300/70 group-hover:border-sky-200';
      case 'commercial-page':
        return 'border-l-emerald-300/70 group-hover:border-emerald-200';
      case 'utility':
        return 'border-l-amber-300/70 group-hover:border-amber-200';
    }
  }

  get actionLabel(): string {
    return this.hasPublicPreview ? 'Explorar demo' : 'Solicitar demo';
  }

  selectDemo(): void {
    this.selected.emit(this.demo);
  }
}
