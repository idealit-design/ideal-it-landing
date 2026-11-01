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

  get displayTechnologies(): string[] {
    const ranked = [...this.demo.technologies].sort(
      (first, second) => this.technologyPriority(second) - this.technologyPriority(first),
    );
    const selected = new Set<string>();

    for (const group of ['frontend', 'backend', 'data'] as const) {
      const representative = ranked.find((technology) => this.technologyGroup(technology) === group);
      if (representative) {
        selected.add(representative);
      }
    }

    for (const technology of ranked) {
      if (selected.size === 3) {
        break;
      }
      selected.add(technology);
    }

    return ranked.filter((technology) => selected.has(technology));
  }

  get hasPublicPreview(): boolean {
    return Boolean(this.demo.previewPath || this.demo.previewUrl);
  }

  get accentClasses(): string {
    switch (this.demo.serviceType) {
      case 'development':
        return 'border-violet-300/20 group-hover:border-violet-200/45';
      case 'application':
        return 'border-sky-300/20 group-hover:border-sky-200/45';
      case 'commercial-page':
        return 'border-emerald-300/20 group-hover:border-emerald-200/45';
      case 'utility':
        return 'border-amber-300/20 group-hover:border-amber-200/45';
    }
  }

  get actionLabel(): string {
    return this.hasPublicPreview ? 'Explorar demo' : 'Solicitar demo';
  }

  selectDemo(): void {
    this.selected.emit(this.demo);
  }

  private technologyPriority(technology: string): number {
    const normalized = technology.toLowerCase();

    if (/angular|react|vue|flutter|expo/.test(normalized)) {
      return 110;
    }
    if (/fastapi|express|gin|aws api gateway|api de inventario/.test(normalized)) {
      return 100;
    }
    if (/node\.js|typescript|python|^go$|php/.test(normalized)) {
      return 95;
    }
    if (/sqlite|postgresql/.test(normalized)) {
      return 90;
    }
    if (/prisma|sqlalchemy|sqlmodel|aws cognito/.test(normalized)) {
      return 65;
    }
    if (/tailwind|bootstrap/.test(normalized)) {
      return 60;
    }
    if (/pdo/.test(normalized)) {
      return 45;
    }
    if (/lucide/.test(normalized)) {
      return 50;
    }
    if (/html/.test(normalized)) {
      return 40;
    }
    if (/vite/.test(normalized)) {
      return 20;
    }

    return 10;
  }

  private technologyGroup(technology: string): 'frontend' | 'backend' | 'data' | 'other' {
    const normalized = technology.toLowerCase();

    if (/angular|react|vue|flutter|expo/.test(normalized)) {
      return 'frontend';
    }
    if (/sqlite|postgresql|sqlalchemy|sqlmodel|prisma|pdo|api de inventario/.test(normalized)) {
      return 'data';
    }
    if (/fastapi|express|gin|aws api gateway|node\.js|typescript|python|^go$|php|aws cognito/.test(normalized)) {
      return 'backend';
    }

    return 'other';
  }
}
