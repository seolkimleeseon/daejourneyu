import type { NextFunction, Request, Response } from "express";
import { verifyAuthToken } from "../lib/auth";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

/** Authorization: Bearer <token> 헤더를 검증해 req.userId를 채운다. 없거나 유효하지 않으면 401. */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : null;
  if (!token) return res.status(401).json({ error: "로그인이 필요해요" });

  const userId = verifyAuthToken(token);
  if (!userId) return res.status(401).json({ error: "로그인이 만료됐어요. 다시 로그인해주세요" });

  req.userId = userId;
  next();
}
