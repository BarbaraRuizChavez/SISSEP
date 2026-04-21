import { Request, Response, NextFunction } from 'express';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  console.error('[ERROR]', err.stack || err.message);
  res.status(500).json({ ok: false, message: err.message || 'Error interno del servidor' });
}
