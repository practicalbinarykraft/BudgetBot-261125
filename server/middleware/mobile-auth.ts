import type { Request, Response, NextFunction, RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { userRepository } from "../repositories/user.repository";
import type { AppUser } from "../types/express";

if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET environment variable is required");
}
const JWT_SECRET = process.env.SESSION_SECRET;

export interface JwtPayload {
  userId: number;
  email: string;
}

export function signMobileToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "30d" });
}

export function verifyMobileToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}

type MobileAuthHandler<
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

export function withMobileAuth<P = any, ResBody = any, ReqBody = any, ReqQuery = any, Locals extends Record<string, any> = Record<string, any>>(
  handler: MobileAuthHandler<P, ResBody, ReqBody, ReqQuery, Locals>
): RequestHandler<P, ResBody, ReqBody, ReqQuery, Locals> {
  return async (req: Request<P, ResBody, ReqBody, ReqQuery, Locals>, res: Response<ResBody, Locals>, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "No token provided" } as any);
      }

      const token = authHeader.slice(7);
      const payload = verifyMobileToken(token);

      const user = await userRepository.getUserById(payload.userId);
      if (!user) {
        return res.status(401).json({ error: "User not found" } as any);
      }

      if (user.isBlocked) {
        return res.status(401).json({ error: "Account is blocked" } as any);
      }

      (req as any).user = user;

      const result = handler(req as any, res, next);
      if (result && typeof result === "object" && "catch" in result) {
        (result as Promise<unknown>).catch(next);
      }
      return result;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return res.status(401).json({ error: "Token expired" } as any);
      }
      if (error instanceof jwt.NotBeforeError) {
        return res.status(401).json({ error: "Token not yet valid" } as any);
      }
      if (error instanceof jwt.JsonWebTokenError) {
        return res.status(401).json({ error: "Invalid token" } as any);
      }
      next(error);
    }
  };
}
