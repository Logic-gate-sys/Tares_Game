export interface AuthUser {
  id: number;
  email: string;
  username: string;
  pLevel: string;
}

declare global{
  namespace Express {
    interface Request {
      authUser?: AuthUser;
    }
  }
}