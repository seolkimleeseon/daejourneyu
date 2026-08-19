import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { NextFunction, Request, Response } from "express";

const SALT_ROUNDS = 10;
const TOKEN_TTL_DAYS = 7;
const TOKEN_TTL = `${TOKEN_TTL_DAYS}d`;

/** 토큰을 담는 쿠키 이름. 프론트에서는 읽지 못하고(httpOnly) 브라우저가 알아서 붙여 보낸다. */
export const ACCESS_TOKEN_COOKIE = "daejourneyu_token";

export interface TokenPayload {
  userId: string;
}

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  // 시크릿 없이 뜨면 토큰을 누구나 위조할 수 있으므로 기동 자체를 막는다.
  if (!secret) throw new Error("JWT_SECRET이 설정되지 않았습니다 (.env.example 참고)");
  return secret;
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}

export function signAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, getSecret(), { expiresIn: TOKEN_TTL });
}

export function verifyAccessToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, getSecret()) as TokenPayload;
  } catch {
    // 만료·위조 모두 "인증 실패" 하나로 다룬다 — 어느 쪽인지 알려주면 공격자에게 힌트가 된다.
    return null;
  }
}

/** 로그인 성공 시 토큰을 httpOnly 쿠키로 심는다 — JS가 읽을 수 없어 XSS로 탈취되지 않는다. */
export function setAuthCookie(res: Response, token: string) {
  res.cookie(ACCESS_TOKEN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    // 로컬 개발은 http라 secure를 켜면 쿠키가 아예 저장되지 않는다.
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
  });
}

export function clearAuthCookie(res: Response) {
  res.clearCookie(ACCESS_TOKEN_COOKIE, { path: "/" });
}

/** 쿠키의 토큰을 검사해 req.userId를 채운다. */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.[ACCESS_TOKEN_COOKIE];

  if (!token) {
    return res.status(401).json({ error: "인증이 필요합니다" });
  }

  const payload = verifyAccessToken(token);
  if (!payload) return res.status(401).json({ error: "세션이 만료됐습니다. 다시 로그인해주세요" });

  req.userId = payload.userId;
  next();
}
