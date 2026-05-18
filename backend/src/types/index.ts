export type UserRole      = 'estudiante' | 'encargado';
export type DocStatus     = 'pendiente'  | 'aprobado' | 'rechazado';
export type ProgramType   = 'servicio_social' | 'residencias';
export type StudentStatus = 'activo' | 'bloqueado';

export interface JwtPayload {
  userId:  string;
  role:    UserRole;
  carrera: string;
  name:    string;
}

export interface ApiResponse<T = unknown> {
  ok:       boolean;
  data?:    T;
  message?: string;
}

export interface DeliveryPeriod {
  id:           string;
  periodNumber: number;
  label:        string;
  startDate:    string;
  endDate:      string;
  programType:  string;
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId:  string;
        role:    UserRole;
        carrera: string;
        name:    string;
      };
    }
  }
}
