import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

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

@Injectable({ providedIn: 'root' })
export class PersonalMvpService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://127.0.0.1:8001/api/personal';

  getStaff(): Observable<StaffMember[]> {
    return this.http.get<StaffMember[]>(`${this.apiUrl}/staff`);
  }

  createStaff(staff: Omit<StaffMember, 'area_id'> & { area_id: number | null }): Observable<StaffMember> {
    return this.http.post<StaffMember>(`${this.apiUrl}/staff`, staff);
  }

  getAreas(): Observable<PersonalArea[]> {
    return this.http.get<PersonalArea[]>(`${this.apiUrl}/areas`);
  }

  createArea(area: Omit<PersonalArea, 'id'>): Observable<PersonalArea> {
    return this.http.post<PersonalArea>(`${this.apiUrl}/areas`, area);
  }

  getLeaves(): Observable<LeaveRecord[]> {
    return this.http.get<LeaveRecord[]>(`${this.apiUrl}/leaves`);
  }

  createLeave(leave: Omit<LeaveRecord, 'id'>): Observable<LeaveRecord> {
    return this.http.post<LeaveRecord>(`${this.apiUrl}/leaves`, leave);
  }

  connectBiometric(deviceIp: string): Observable<BiometricStatus> {
    return this.http.post<BiometricStatus>(`${this.apiUrl}/biometrics/connect`, {
      device_ip: deviceIp,
    });
  }

  getAttendanceReport(period: 'day' | 'week', dni: string): Observable<AttendanceReport> {
    let params = new HttpParams().set('period', period);
    if (dni.trim()) {
      params = params.set('dni', dni.trim());
    }
    return this.http.get<AttendanceReport>(`${this.apiUrl}/biometrics/reports`, { params });
  }
}
