import { Response }    from 'express';
import { ApiResponse } from '../types';

export const ok = <T>(res: Response, data: T, status = 200): Response =>
  res.status(status).json({ ok: true, data } as ApiResponse<T>);

export const fail = (res: Response, message: string, status = 400): Response =>
  res.status(status).json({ ok: false, message } as ApiResponse);
