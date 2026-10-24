import type { NextFunction, Request, Response } from 'express';
import { verifyToken } from '#utils/crypto';


// authorises user requests 
export function authorize(request: Request, response: Response, next: NextFunction){
  const header = request.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    response.status(400).json({ error: 'Bearer token is required' });
    return;
  };
  const token = header.split(" ")[1]?? " ";
  try {
    const payload = verifyToken(token);
    if (typeof payload === 'string') {
      const err = Error("Invalid token");
      next(err);
      return;
    }
    request.authUser = payload; 
    next();
  } catch(err) {
    response.status(500).json({ error: err.messsage});
  };
};


export function requireLevel(minimumLevel: number) {
  return (request: Request, response: Response, next: NextFunction): void => {
    const currentLevel = Number(request.authUser?.pLevel);
    if (!Number.isFinite(currentLevel) || currentLevel < minimumLevel) {
      response.status(403).json({ error: 'Insufficient permissions' });
      return;
    };
    // next 
    next();
  };
}
