import "express";
import "express-session";
import type { User as SchemaUser } from "@shared/schema";

export interface AppUser {
  id: number;
  email: string | null;
  password: string | null;
  name: string;
  telegramId: string | null;
  telegramUsername: string | null;
  telegramFirstName: string | null;
  telegramPhotoUrl: string | null;
  twoFactorEnabled: boolean;
  twoFactorSecret: string | null;
  isBlocked: boolean;
  createdAt: Date;
}

declare global {
  namespace Express {
    interface User extends AppUser {}
    interface Request {
      user?: AppUser;
    }
  }
}

// Расширяем типы сессии для поддержки adminId
declare module "express-session" {
  interface SessionData {
    adminId?: number; // ID админа в сессии (отдельно от обычных пользователей)
  }
}

export {};
