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

  get isLive(): boolean {
    return this.demo.status === 'live';
  }

  get isComingSoon(): boolean {
    return this.demo.status === 'coming-soon';
  }

  get isPlanned(): boolean {
    return this.demo.status === 'planned';
  }

  get isLanding(): boolean {
    return this.demo.status === 'landing';
  }

  get statusLabel(): string {
    switch (this.demo.status) {
      case 'live':
        return 'Demo activa';
      case 'mvp':
        return 'MVP local';
      case 'planned':
        return 'Arquitectura propuesta';
      case 'coming-soon':
        return 'Próximamente';
      case 'landing':
        return 'Landing autónoma';
    }
  }

  get actionLabel(): string {
    if (this.isComingSoon) {
      return 'Próximamente';
    }
    if (this.isLive) {
      return 'Ingresar a la Demo Live';
    }
    if (this.isLanding) {
      return this.demo.previewUrl ? 'Ver landing comercial' : 'Ver detalles de la landing';
    }
    if (this.isPlanned) {
      return 'Ver propuesta';
    }
    return 'Ver detalles del MVP';
  }

  selectDemo(): void {
    if (!this.isComingSoon) {
      this.selected.emit(this.demo);
    }
  }
}
