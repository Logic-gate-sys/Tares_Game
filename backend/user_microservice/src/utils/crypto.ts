import bcrypt from 'bcrypt';
import jwt, { type JwtPayload, type SignOptions } from 'jsonwebtoken';
import { env } from '../env.ts';

const passwordRounds = 12;
export interface TokenClaims extends JwtPayload {
  id: number;
  email: string;
  username: string;
  pLevel?: string;
  purpose?: "authentication"|"password-reset";
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, passwordRounds);
}

export function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  return bcrypt.compare(password, storedHash);
}

export function createToken(payload: TokenClaims, expiresIn = 0): string {
  const tokenExpiresIn: NonNullable<SignOptions["expiresIn"]> =
    expiresIn >= 1
      ? expiresIn
      : env.JWT_EXPIRES_IN as NonNullable<SignOptions["expiresIn"]>;
  const options: SignOptions = {
    expiresIn: tokenExpiresIn,
    algorithm: "HS256",
  };
  return jwt.sign(
    {  ...payload,purpose:"authentication"},
    env.AUTH_SECRET,
    options
  );
}

export function verifyToken(token: string): TokenClaims {
  const payload = jwt.verify(token, env.AUTH_SECRET);
  if (typeof payload === 'string') {
    throw new Error('Invalid token claims');
  } 
  return payload as TokenClaims;
}
