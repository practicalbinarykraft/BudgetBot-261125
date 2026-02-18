/**
 * CORS Middleware
 *
 * Allows cross-origin requests from the mobile web app (m.budgetbot.online).
 * In development, also allows local Expo dev server origins.
 */

import { type Request, type Response, type NextFunction } from 'express';

export const ALLOWED_ORIGINS: string[] = [
  'https://m.budgetbot.online',
  'https://budgetbot.online',
];

if (process.env.NODE_ENV === 'development') {
  ALLOWED_ORIGINS.push(
    'http://localhost:8081',
    'http://localhost:19006',
    'http://localhost:3000',
    'http://localhost:5000',
  );
}

export function corsMiddleware(req: Request, res: Response, next: NextFunction) {
  const origin = req.headers.origin;

  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Max-Age', '86400');
  }

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  next();
}
