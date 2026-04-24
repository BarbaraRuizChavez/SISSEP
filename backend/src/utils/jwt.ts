import jwt            from 'jsonwebtoken';
import { ENV }        from '../config/env';
import { JwtPayload } from '../types';

export const signToken = (payload: JwtPayload): string =>
  jwt.sign(payload, ENV.JWT_SECRET, { expiresIn: ENV.JWT_EXPIRES });

export const verifyToken = (token: string): JwtPayload =>
  jwt.verify(token, ENV.JWT_SECRET) as JwtPayload;
