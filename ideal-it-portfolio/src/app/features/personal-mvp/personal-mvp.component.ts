import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  AttendanceReport,
  BiometricStatus,
  LeaveRecord,
  PersonalArea,
  PersonalMvpService,
  StaffMember,
} from './personal-mvp.service';

@Component({
  selector: 'app-personal-mvp',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './personal-mvp.component.html',
})
export class PersonalMvpComponent implements OnInit {
  private readonly personalService = inject(PersonalMvpService);

  staff: StaffMember[] = [];
  areas: PersonalArea[] = [];
  leaves: LeaveRecord[] = [];
  report: AttendanceReport | null = null;
  connection: BiometricStatus | null = null;
  errorMessage = '';
  successMessage = '';
  deviceIp = '192.168.1.100';
  reportPeriod: 'day' | 'week' = 'day';
  reportDni = '';

  staffForm = { dni: '', full_name: '', area_id: null as number | null };
  areaForm = { name: '', floor: '', department: '' };
  leaveForm: {
    dni: string;
    leave_type: 'medical' | 'vacation';
    start_date: string;
    end_date: string;
    notes: string;
  } = {
    dni: '',
    leave_type: 'vacation',
    start_date: '',
    end_date: '',
    notes: '',
  };

  ngOnInit(): void {
    this.loadAll();
  }

  loadAll(): void {
    this.errorMessage = '';
    this.personalService.getStaff().subscribe({
      next: (staff) => (this.staff = staff),
      error: (error: unknown) => this.setError('No se pudo cargar el personal.', error),
    });
    this.personalService.getAreas().subscribe({
      next: (areas) => (this.areas = areas),
      error: (error: unknown) => this.setError('No se pudieron cargar las áreas.', error),
    });
    this.personalService.getLeaves().subscribe({
      next: (leaves) => (this.leaves = leaves),
      error: (error: unknown) => this.setError('No se pudieron cargar las licencias.', error),
    });
  }

  connectDevice(): void {
    this.clearMessages();
    this.personalService.connectBiometric(this.deviceIp).subscribe({
      next: (status) => {
        this.connection = status;
        this.successMessage = status.message;
      },
      error: (error: unknown) => this.setError('No se pudo simular la conexión biométrica.', error),
    });
  }

  generateReport(): void {
    this.clearMessages();
    this.personalService.getAttendanceReport(this.reportPeriod, this.reportDni).subscribe({
      next: (report) => (this.report = report),
      error: (error: unknown) => this.setError('No se pudo generar el reporte biométrico.', error),
    });
  }

  createStaff(): void {
    this.clearMessages();
    this.personalService.createStaff(this.staffForm).subscribe({
      next: () => {
        this.staffForm = { dni: '', full_name: '', area_id: null };
        this.successMessage = 'Persona agregada al MVP Personal.';
        this.loadAll();
      },
      error: (error: unknown) => this.setError('No se pudo registrar la persona.', error),
    });
  }

  createArea(): void {
    this.clearMessages();
    this.personalService.createArea(this.areaForm).subscribe({
      next: () => {
        this.areaForm = { name: '', floor: '', department: '' };
        this.successMessage = 'Área creada correctamente.';
        this.loadAll();
      },
      error: (error: unknown) => this.setError('No se pudo crear el área.', error),
    });
  }

  createLeave(): void {
    this.clearMessages();
    this.personalService.createLeave(this.leaveForm).subscribe({
      next: () => {
        this.leaveForm = {
          dni: '',
          leave_type: 'vacation',
          start_date: '',
          end_date: '',
          notes: '',
        };
        this.successMessage = 'Licencia registrada correctamente.';
        this.loadAll();
      },
      error: (error: unknown) => this.setError('No se pudo registrar la licencia.', error),
    });
  }

  private clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }

  private setError(message: string, error: unknown): void {
    console.error(message, error);
    this.errorMessage = message;
  }
}
