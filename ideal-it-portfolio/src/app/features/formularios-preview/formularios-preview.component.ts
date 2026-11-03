import { Component } from '@angular/core';
import { DatePipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

type OrganizerCategory = 'MUSEO' | 'BOLICHE' | 'RESTAURANTE' | 'SECRETARIA_MUNICIPAL';
type RegistrationStatus = 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';
type PreviewSection = 'portal' | 'gestion' | 'asistencia';

interface PreviewRegistration {
  id: number;
  dni: string;
  name: string;
  status: RegistrationStatus;
  qrCode: string | null;
  attendanceConfirmed: boolean;
}

interface PreviewEvent {
  id: number;
  title: string;
  description: string;
  organizer: string;
  category: OrganizerCategory;
  date: string;
  capacity: number;
  requiresApproval: boolean;
  registrations: PreviewRegistration[];
}

@Component({
    selector: 'app-formularios-preview',
    imports: [DatePipe, FormsModule, NgClass, RouterLink],
    templateUrl: './formularios-preview.component.html'
})
export class FormulariosPreviewComponent {
  readonly categories: OrganizerCategory[] = [
    'MUSEO',
    'BOLICHE',
    'RESTAURANTE',
    'SECRETARIA_MUNICIPAL',
  ];

  section: PreviewSection = 'portal';
  events: PreviewEvent[] = [
    {
      id: 1,
      title: 'Noche de los Museos',
      description: 'Recorrido guiado y actividades abiertas para toda la familia.',
      organizer: 'Museo Municipal',
      category: 'MUSEO',
      date: '2026-11-14T18:00',
      capacity: 12,
      requiresApproval: true,
      registrations: [
        {
          id: 1,
          dni: '11111111',
          name: 'Alex Demo',
          status: 'PENDIENTE',
          qrCode: null,
          attendanceConfirmed: false,
        },
      ],
    },
    {
      id: 2,
      title: 'Sabores de la Ciudad',
      description: 'Degustación de productos regionales en el mercado municipal.',
      organizer: 'Mercado Municipal',
      category: 'RESTAURANTE',
      date: '2026-11-21T12:00',
      capacity: 20,
      requiresApproval: false,
      registrations: [
        {
          id: 2,
          dni: '22222222',
          name: 'Sam Demo',
          status: 'APROBADO',
          qrCode: 'TUR-QR-DEMO-0002',
          attendanceConfirmed: false,
        },
      ],
    },
  ];

  eventForm = {
    title: '',
    description: '',
    organizer: '',
    category: 'MUSEO' as OrganizerCategory,
    date: '2026-12-01T18:00',
    capacity: 25,
    requiresApproval: true,
  };
  registrationForm = { name: '', dni: '' };
  selectedEventId = 0;
  lastRegistration: PreviewRegistration | null = null;
  selectedQr: PreviewRegistration | null = this.events[1].registrations[0];
  qrMatrix: boolean[][] = [];
  scannerInput = '';
  feedback = '';
  feedbackIsError = false;
  scanResult = '';
  private nextEventId = 3;
  private nextRegistrationId = 3;
  private nextQrId = 3;

  constructor() {
    this.selectQr(this.events[1].registrations[0]);
  }

  get pendingRegistrations(): Array<{ event: PreviewEvent; registration: PreviewRegistration }> {
    return this.events.flatMap((event) =>
      event.registrations
        .filter((registration) => registration.status === 'PENDIENTE')
        .map((registration) => ({ event, registration })),
    );
  }

  get attendanceCount(): number {
    return this.events.reduce(
      (total, event) =>
        total + event.registrations.filter((registration) => registration.attendanceConfirmed).length,
      0,
    );
  }

  get registrationCount(): number {
    return this.events.reduce((total, event) => total + event.registrations.length, 0);
  }

  categoryLabel(category: OrganizerCategory): string {
    const labels: Record<OrganizerCategory, string> = {
      MUSEO: 'Museo',
      BOLICHE: 'Boliche',
      RESTAURANTE: 'Restaurante',
      SECRETARIA_MUNICIPAL: 'Secretaría municipal',
    };
    return labels[category];
  }

  activeRegistrations(event: PreviewEvent): number {
    return event.registrations.filter((registration) => registration.status !== 'RECHAZADO').length;
  }

  availableSeats(event: PreviewEvent): number {
    return Math.max(0, event.capacity - this.activeRegistrations(event));
  }

  createEvent(): void {
    if (!this.eventForm.title.trim() || !this.eventForm.organizer.trim()) {
      this.showFeedback('Completá el nombre del organizador y el título.', true);
      return;
    }

    this.events = [
      {
        ...this.eventForm,
        id: this.nextEventId++,
        title: this.eventForm.title.trim(),
        description: this.eventForm.description.trim(),
        organizer: this.eventForm.organizer.trim(),
        registrations: [],
      },
      ...this.events,
    ];
    this.eventForm = {
      title: '',
      description: '',
      organizer: '',
      category: 'MUSEO',
      date: '2026-12-01T18:00',
      capacity: 25,
      requiresApproval: true,
    };
    this.showFeedback('Evento publicado en el portal ciudadano.');
    this.section = 'gestion';
  }

  removeEvent(event: PreviewEvent): void {
    if (event.registrations.length > 0) {
      this.showFeedback('No se puede quitar un evento con inscripciones; el historial queda protegido.', true);
      return;
    }
    this.events = this.events.filter((candidate) => candidate.id !== event.id);
    this.showFeedback('Evento eliminado de la preview.');
  }

  register(event: PreviewEvent): void {
    const name = this.registrationForm.name.trim();
    const dni = this.registrationForm.dni.trim();
    if (name.length < 3 || !/^\d{6,12}$/.test(dni)) {
      this.showFeedback('Ingresá un nombre y un DNI de entre 6 y 12 dígitos.', true);
      return;
    }
    if (event.registrations.some((registration) => registration.dni === dni)) {
      this.showFeedback('Ese DNI ya tiene una solicitud para este evento.', true);
      return;
    }
    if (this.availableSeats(event) === 0) {
      this.showFeedback('El evento ya no tiene cupos disponibles.', true);
      return;
    }

    const approved = !event.requiresApproval;
    const registration: PreviewRegistration = {
      id: this.nextRegistrationId++,
      dni,
      name,
      status: approved ? 'APROBADO' : 'PENDIENTE',
      qrCode: approved ? this.generateQrCode() : null,
      attendanceConfirmed: false,
    };
    event.registrations.push(registration);
    this.lastRegistration = registration;
    if (registration.qrCode) this.selectQr(registration);
    this.registrationForm = { name: '', dni: '' };
    this.selectedEventId = 0;
    this.showFeedback(
      approved
        ? 'Inscripción confirmada: se emitió un código QR de muestra.'
        : 'Solicitud registrada. El organizador debe aprobarla para emitir el QR.',
    );
  }

  decideRegistration(
    event: PreviewEvent,
    registration: PreviewRegistration,
    decision: 'APROBADO' | 'RECHAZADO',
  ): void {
    if (registration.status !== 'PENDIENTE') return;
    if (decision === 'APROBADO' && this.availableSeats(event) === 0) {
      this.showFeedback('No quedan cupos: no se puede aprobar esta solicitud.', true);
      return;
    }
    registration.status = decision;
    if (decision === 'APROBADO') {
      registration.qrCode = this.generateQrCode();
      this.lastRegistration = registration;
      this.selectQr(registration);
      this.showFeedback(`Solicitud aprobada. Se emitió el QR ${registration.qrCode}.`);
    } else {
      this.showFeedback('Solicitud rechazada; el cupo quedó disponible nuevamente.');
    }
  }

  selectQr(registration: PreviewRegistration): void {
    if (!registration.qrCode || registration.status !== 'APROBADO') return;
    this.selectedQr = registration;
    this.qrMatrix = this.createQrIllustration(registration.qrCode);
  }

  validateAttendance(): void {
    const code = this.scannerInput.trim();
    const match = this.events
      .flatMap((event) => event.registrations)
      .find((registration) => registration.qrCode === code);
    if (!match || match.status !== 'APROBADO') {
      this.scanResult = '';
      this.showFeedback('QR inválido o inscripción todavía no aprobada.', true);
      return;
    }
    if (match.attendanceConfirmed) {
      this.scanResult = '';
      this.showFeedback('La asistencia de este QR ya estaba registrada.', true);
      return;
    }

    match.attendanceConfirmed = true;
    const event = this.events.find((candidate) =>
      candidate.registrations.some((registration) => registration.id === match.id),
    );
    this.scanResult = `${match.name} · ${event?.title ?? 'Evento'} · acceso confirmado`;
    this.scannerInput = '';
    this.showFeedback('Presencia validada correctamente.');
  }

  useSelectedQr(): void {
    if (this.selectedQr?.qrCode) this.scannerInput = this.selectedQr.qrCode;
  }

  private generateQrCode(): string {
    return `TUR-QR-DEMO-${String(this.nextQrId++).padStart(4, '0')}`;
  }

  private showFeedback(message: string, isError = false): void {
    this.feedback = message;
    this.feedbackIsError = isError;
  }

  private createQrIllustration(value: string): boolean[][] {
    let seed = 2166136261;
    for (const character of value) {
      seed = Math.imul(seed ^ character.charCodeAt(0), 16777619);
    }
    const matrix = Array.from({ length: 21 }, () =>
      Array.from({ length: 21 }, () => {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        return (seed & 1) === 1;
      }),
    );

    const drawFinder = (startX: number, startY: number): void => {
      for (let y = 0; y < 7; y++) {
        for (let x = 0; x < 7; x++) {
          matrix[startY + y][startX + x] =
            x === 0 || y === 0 || x === 6 || y === 6 || (x >= 2 && x <= 4 && y >= 2 && y <= 4);
        }
      }
    };
    drawFinder(0, 0);
    drawFinder(14, 0);
    drawFinder(0, 14);
    return matrix;
  }
}
