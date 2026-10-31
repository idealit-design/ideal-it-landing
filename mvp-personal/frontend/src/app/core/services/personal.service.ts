import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export interface Area {
  id: number;
  nombre_area: string;
  piso: string;
  departamento: string;
}

export interface Person {
  dni: string;
  nombre: string;
  apellido: string;
  legajo: string;
  area_id: number | null;
  activo: boolean;
  fecha_alta: string;
}

@Injectable({ providedIn: 'root' })
export class PersonalService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://127.0.0.1:8001/api/personal';

  list(dni = ''): Observable<Person[]> {
    let params = new HttpParams();
    if (dni.trim()) params = params.set('dni', dni.trim());
    return this.http.get<Person[]>(this.baseUrl, { params });
  }

  create(person: Omit<Person, 'activo'> & { activo?: boolean }): Observable<Person> {
    return this.http.post<Person>(this.baseUrl, person);
  }

  update(dni: string, changes: Partial<Omit<Person, 'dni' | 'fecha_alta'>>): Observable<Person> {
    return this.http.patch<Person>(`${this.baseUrl}/${encodeURIComponent(dni)}`, changes);
  }

  setActive(dni: string, activo: boolean): Observable<Person> {
    return this.http.patch<Person>(`${this.baseUrl}/${encodeURIComponent(dni)}`, { activo });
  }

  listAreas(): Observable<Area[]> {
    return this.http.get<Area[]>(`${this.baseUrl}/areas`);
  }

  createArea(area: Omit<Area, 'id'>): Observable<Area> {
    return this.http.post<Area>(`${this.baseUrl}/areas`, area);
  }

  updateArea(id: number, area: Omit<Area, 'id'>): Observable<Area> {
    return this.http.patch<Area>(`${this.baseUrl}/areas/${id}`, area);
  }
}
