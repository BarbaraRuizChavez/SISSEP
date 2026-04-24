import { Request, Response } from 'express';
import * as AuthService      from '../services/auth.service';
import { ok, fail }          from '../utils/response';

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const result = await AuthService.registerUser(req.body);
    ok(res, result, 201);
  } catch (e: any) {
    fail(res, e.message);
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { controlNumber, password } = req.body;
    if (!controlNumber || !password) {
      fail(res, 'controlNumber y password son requeridos');
      return;
    }
    ok(res, await AuthService.loginUser(controlNumber, password));
  } catch (e: any) {
    fail(res, e.message, 401);
  }
}

export async function me(req: Request, res: Response): Promise<void> {
  ok(res, req.user);
}

export async function listStudents(_req: Request, res: Response): Promise<void> {
  try {
    ok(res, await AuthService.getAllStudents());
  } catch (e: any) {
    fail(res, e.message);
  }
}
