import "express";

export interface AppUser {
  id: number;
  email: string;
  name: string;
}

declare global {
  namespace Express {
    interface User extends AppUser {}
    interface Request {
      user?: AppUser;
    }
  }
}

export {};
