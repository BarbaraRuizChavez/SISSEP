export type UserRole      = 'estudiante' | 'encargado';
export type DocStatus     = 'pendiente'  | 'aprobado' | 'rechazado';
export type ProgramType   = 'servicio_social' | 'residencias';
export type StudentStatus = 'activo' | 'bloqueado';

export const PERIODOS = ['ENE-JUN 2026', 'AGO-NOV 2026'] as const;
export type Periodo = typeof PERIODOS[number];

export interface User {
  id:      string;
  name:    string;
  role:    UserRole;
  carrera: string;
  periodo: string;
}

export interface DeliveryPeriod {
  id:           string;
  periodNumber: number;
  label:        string;
  startDate:    string;
  endDate:      string;
  programType:  string;
}

export interface DocumentRecord {
  id:           string;
  studentId:    string;
  programType:  ProgramType;
  category:     string;
  description:  string;
  periodNumber: number | null;
  status:       DocStatus;
  fileName?:    string | null;
  filePath?:    string | null;
  fileSize?:    number | null;
  externalUrl?: string | null;
  observations: string;
  createdAt:    string;
}

export interface StudentProgress {
  id:            string;
  controlNumber: string;
  name:          string;
  carrera:       string;
  periodo:       string;
  studentStatus: StudentStatus;
  total:         number;
  approved:      number;
  pending:       number;
  rejected:      number;
}
