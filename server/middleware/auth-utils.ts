import type { Request, Response, NextFunction, RequestHandler } from "express";
import type { AppUser } from "../types/express";

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
  return (req: Request<P, ResBody, ReqBody, ReqQuery, Locals>, res: Response<ResBody, Locals>, next: NextFunction) => {
    if (typeof req.isAuthenticated !== 'function' || !req.isAuthenticated() || !req.user) {
      return res.status(401).json({ error: "Not authenticated" } as any);
    }
    
    try {
      const result = handler(req as Request<P, ResBody, ReqBody, ReqQuery, Locals> & { user: AppUser }, res, next);
      if (result && typeof result === 'object' && 'catch' in result) {
        (result as Promise<unknown>).catch(next);
      }
      return result;
    } catch (error) {
      next(error);
    }
  };
}
