import type { NextFunction, Request, Response } from 'express';
import { verifyToken } from '#utils/crypto';


// Authorise user requests
export function authorize(request: Request, response: Response, next: NextFunction) {
  const header = request.headers.authorization;
  const error: { status: number, message: string } = { status: 400, message: '' };
  if (!header?.startsWith('Bearer ')) {
    error.message = "Invalid token";
    next(error);
    return;
  };
  const token = header?.slice("Bearer ".length).trim();
  const payload = verifyToken(token ?? "");
  if (typeof payload === 'string') {
    error.message = "Invalid payload generated"
    next(error)
    return;
  }

  request.authUser = payload;
  next();
};
