// Tipos compartidos entre todas las capas del backend

export type UserRole    = 'estudiante' | 'encargado';
export type DocStatus   = 'pendiente'  | 'aprobado' | 'rechazado';
export type ProgramType = 'servicio_social' | 'residencias';

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

// Extiende el tipo Request de Express para incluir el usuario autenticado
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
