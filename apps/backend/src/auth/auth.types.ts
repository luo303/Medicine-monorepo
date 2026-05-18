import type { Request } from 'express';

export interface AuthUser {
  sub: number;
  username: string;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}
