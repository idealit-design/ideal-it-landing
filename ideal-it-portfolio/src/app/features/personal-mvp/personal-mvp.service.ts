import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';

export interface PersonalArea {
  id: number;
  name: string;
  floor: string;
  department: string;
}

export interface StaffMember {
  dni: string;
  full_name: string;
  area_id: number | null;
}

export interface LeaveRecord {
  id: number;
  dni: string;
  leave_type: 'medical' | 'vacation';
  start_date: string;
  end_date: string;
  notes: string;
}

export interface AttendanceRecord {
  dni: string;
  date: string;
  check_in: string;
  check_out: string;
  status: 'present' | 'simulated';
}

export interface AttendanceReport {
  period: 'day' | 'week';
  generated_at: string;
  dni_filter: string | null;
  simulated: true;
  records: AttendanceRecord[];
}

export interface BiometricStatus {
  connected: boolean;
  device_ip: string;
  mode: 'simulated';
  message: string;
}

const DEMO_AREAS: PersonalArea[] = [
  { id: 1, name: 'Operaciones (demo)', floor: '1', department: 'Administración' },
  { id: 2, name: 'Atención (demo)', floor: '2', department: 'Servicios' },
];

@Injectable({ providedIn: 'root' })
export class PersonalMvpService {
  private staff: StaffMember[] = [
    { dni: '99999998', full_name: 'Persona Demo Uno', area_id: 1 },
    { dni: '99999997', full_name: 'Persona Demo Dos', area_id: 2 },
  ];
  private areas: PersonalArea[] = [...DEMO_AREAS];
  private leaves: LeaveRecord[] = [
    {
      id: 1,
      dni: '99999998',
      leave_type: 'vacation',
      start_date: '2026-11-02',
      end_date: '2026-11-06',
      notes: 'Registro ficticio de demostración',
    },
  ];
  private nextAreaId = 3;
  private nextLeaveId = 2;

  getStaff(): Observable<StaffMember[]> {
    return of(this.staff.map((person) => ({ ...person })));
  }

  createStaff(staff: Omit<StaffMember, 'area_id'> & { area_id: number | null }): Observable<StaffMember> {
    if (this.staff.some((person) => person.dni === staff.dni)) {
      return throwError(() => new Error('El DNI ya existe en esta demo.'));
    }
    const created = { ...staff };
    this.staff = [created, ...this.staff];
    return of({ ...created });
  }

  getAreas(): Observable<PersonalArea[]> {
    return of(this.areas.map((area) => ({ ...area })));
  }

  createArea(area: Omit<PersonalArea, 'id'>): Observable<PersonalArea> {
    const created = { ...area, id: this.nextAreaId++ };
    this.areas = [...this.areas, created];
    return of({ ...created });
  }

  getLeaves(): Observable<LeaveRecord[]> {
    return of(this.leaves.map((leave) => ({ ...leave })));
  }

  createLeave(leave: Omit<LeaveRecord, 'id'>): Observable<LeaveRecord> {
    const created = { ...leave, id: this.nextLeaveId++ };
    this.leaves = [created, ...this.leaves];
    return of({ ...created });
  }

  connectBiometric(deviceIp: string): Observable<BiometricStatus> {
    return of({
      connected: true,
      device_ip: deviceIp,
      mode: 'simulated',
      message: 'Conexión de demostración simulada; no se contactó ningún dispositivo.',
    });
  }

  getAttendanceReport(period: 'day' | 'week', dni: string): Observable<AttendanceReport> {
    const records: AttendanceRecord[] = [
      {
        dni: '99999998',
        date: new Date().toISOString().slice(0, 10),
        check_in: '08:02',
        check_out: '—',
        status: 'simulated',
      },
      {
        dni: '99999997',
        date: new Date().toISOString().slice(0, 10),
        check_in: '—',
        check_out: '—',
        status: 'simulated',
      },
    ];
    const filteredRecords = dni.trim()
      ? records.filter((record) => record.dni === dni.trim())
      : records;
    return of({
      period,
      generated_at: new Date().toISOString(),
      dni_filter: dni.trim() || null,
      simulated: true,
      records: filteredRecords,
    });
  }
}
