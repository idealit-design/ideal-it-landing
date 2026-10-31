export type OrganizerCategory =
  | 'MUSEO'
  | 'BOLICHE'
  | 'RESTAURANTE'
  | 'SECRETARIA_MUNICIPAL';
export type RegistrationStatus = 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';

export interface Organizer {
  id: number;
  nombre: string;
  categoria: OrganizerCategory;
  contacto: string;
}

export interface TourismEvent {
  id: number;
  organizador_id: number;
  organizador_nombre: string;
  categoria_organizador: OrganizerCategory;
  titulo: string;
  descripcion: string;
  fecha_evento: string;
  cupo_maximo: number;
  requiere_aprobacion: boolean;
  inscriptos: number;
  cupos_disponibles: number;
}

export interface CitizenRegistration {
  id: number;
  evento_id: number;
  evento_titulo: string;
  dni_ciudadano: string;
  nombre_apellido: string;
  email: string;
  estado: RegistrationStatus;
  codigo_qr: string | null;
  qr_data_url: string | null;
  asistencia_confirmada: boolean;
}

export interface AttendanceResult {
  asistencia_confirmada: boolean;
  inscripcion_id: number;
  nombre_apellido: string;
  evento: string;
  fecha_hora: string;
}
