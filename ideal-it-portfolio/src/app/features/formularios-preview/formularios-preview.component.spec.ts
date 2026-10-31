import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { FormulariosPreviewComponent } from './formularios-preview.component';

describe('FormulariosPreviewComponent', () => {
  let fixture: ComponentFixture<FormulariosPreviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormulariosPreviewComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(FormulariosPreviewComponent);
    fixture.detectChanges();
  });

  it('renders the citizen portal and clearly marks this as a temporary preview', () => {
    const content = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(content).toContain('Preview interactiva');
    expect(content).toContain('Encontrá tu próximo plan');
    expect(content).toContain('Noche de los Museos');
    expect(content).toContain('se reinicia al actualizar');
  });

  it('approves a pending request, emits a simulated QR, and prevents duplicate attendance', () => {
    const component = fixture.componentInstance;
    const event = component.events[0];
    const registration = event.registrations[0];

    component.decideRegistration(event, registration, 'APROBADO');
    expect(registration.status).toBe('APROBADO');
    expect(registration.qrCode).toMatch(/^TUR-QR-DEMO-/);
    expect(component.selectedQr).toBe(registration);

    component.scannerInput = registration.qrCode ?? '';
    component.validateAttendance();
    expect(registration.attendanceConfirmed).toBeTrue();
    expect(component.attendanceCount).toBe(1);

    component.scannerInput = registration.qrCode ?? '';
    component.validateAttendance();
    expect(component.feedbackIsError).toBeTrue();
    expect(component.feedback).toContain('ya estaba registrada');
  });

  it('registers without approval for direct events and enforces available seats', () => {
    const component = fixture.componentInstance;
    const event = component.events[1];
    component.registrationForm = { name: 'Taylor Demo', dni: '33333333' };
    component.register(event);

    expect(component.lastRegistration?.status).toBe('APROBADO');
    expect(component.lastRegistration?.qrCode).toMatch(/^TUR-QR-DEMO-/);

    event.capacity = component.activeRegistrations(event);
    component.registrationForm = { name: 'Jordan Demo', dni: '44444444' };
    component.register(event);
    expect(component.feedbackIsError).toBeTrue();
    expect(component.feedback).toContain('no tiene cupos');
  });
});
