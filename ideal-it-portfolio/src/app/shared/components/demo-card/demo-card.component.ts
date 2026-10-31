import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgClass } from '@angular/common';
import { Demo } from '../../../core/models/demo.model';

@Component({
  selector: 'app-demo-card',
  standalone: true,
  imports: [NgClass],
  templateUrl: './demo-card.component.html',
})
export class DemoCardComponent {
  @Input({ required: true }) demo!: Demo;
  @Output() selected = new EventEmitter<Demo>();

  get isLive(): boolean {
    return this.demo.status === 'live';
  }

  get statusLabel(): string {
    switch (this.demo.status) {
      case 'live':
        return 'Demo activa';
      case 'mvp':
        return 'MVP Demo';
      case 'coming-soon':
        return 'Próximamente';
    }
  }
}
