import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import { fail }        from '../utils/response';
import { UserRole }    from '../types';

export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    fail(res, 'Token de autorizacion requerido', 401);
    return;
  }
  try {
    const payload = verifyToken(header.split(' ')[1]);
    req.user = {
      userId:  payload.userId,
      role:    payload.role,
      carrera: payload.carrera,
      name:    payload.name,
    };
    next();
  } catch {
    fail(res, 'Token invalido o expirado', 401);
  }
}

// Middleware de autorizacion basado en roles (RBAC)
export function authorize(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      fail(res, 'No tienes permiso para este recurso', 403);
      return;
    }
    next();
  };
}
