import type { Request, Response, NextFunction, RequestHandler } from "express";
import type { AppUser } from "../types/express";
import { verifyMobileToken } from "./mobile-auth";
import { userRepository } from "../repositories/user.repository";

type AuthenticatedHandler<
  P = any,
  ResBody = any,
  ReqBody = any,
  ReqQuery = any,
  Locals extends Record<string, any> = Record<string, any>
> = (
  req: Request<P, ResBody, ReqBody, ReqQuery, Locals> & { user: AppUser },
  res: Response<ResBody, Locals>,
  next: NextFunction
) => unknown;

export function withAuth<P = any, ResBody = any, ReqBody = any, ReqQuery = any, Locals extends Record<string, any> = Record<string, any>>(
  handler: AuthenticatedHandler<P, ResBody, ReqBody, ReqQuery, Locals>
): RequestHandler<P, ResBody, ReqBody, ReqQuery, Locals> {
  return async (req: Request<P, ResBody, ReqBody, ReqQuery, Locals>, res: Response<ResBody, Locals>, next: NextFunction) => {
    // 1) Passport session auth (web)
    if (typeof req.isAuthenticated === 'function' && req.isAuthenticated() && req.user) {
      try {
        const result = handler(req as Request<P, ResBody, ReqBody, ReqQuery, Locals> & { user: AppUser }, res, next);
        if (result && typeof result === 'object' && 'catch' in result) {
          (result as Promise<unknown>).catch(next);
        }
        return result;
      } catch (error) {
        return next(error);
      }
    }

    // 2) Bearer JWT auth (mobile)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      try {
        const token = authHeader.slice(7);
        const payload = verifyMobileToken(token);
        const user = await userRepository.getUserById(payload.userId);
        if (user && !user.isBlocked) {
          (req as any).user = user;
          const result = handler(req as Request<P, ResBody, ReqBody, ReqQuery, Locals> & { user: AppUser }, res, next);
          if (result && typeof result === 'object' && 'catch' in result) {
            (result as Promise<unknown>).catch(next);
          }
          return result;
        }
      } catch {
        // Invalid/expired token — fall through to 401
      }
    }

    return res.status(401).json({ error: "Not authenticated" } as any);
  };
}
