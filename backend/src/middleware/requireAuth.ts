import type { NextFunction, Request, Response } from "express";
import { ACCESS_TOKEN_COOKIE, verifyAccessToken } from "../lib/auth";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

/** httpOnly 쿠키를 검증해 req.userId를 채운다. */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.[ACCESS_TOKEN_COOKIE] as string | undefined;
  if (!token) return res.status(401).json({ error: "로그인이 필요해요" });

  const payload = verifyAccessToken(token);
  if (!payload) return res.status(401).json({ error: "로그인이 만료됐어요. 다시 로그인해주세요" });

  req.userId = payload.userId;
  next();
}
