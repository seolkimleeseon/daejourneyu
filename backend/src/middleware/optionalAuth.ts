import type { NextFunction, Request, Response } from "express";
import { ACCESS_TOKEN_COOKIE, verifyAccessToken } from "../lib/auth";

/**
 * 로그인했으면 req.userId를 채우고, 아니면 그냥 통과시킨다.
 * 둘러보기 목록처럼 비로그인도 볼 수 있지만 "내 글" 표시는 로그인 여부에 따라 달라지는 화면에 쓴다.
 */
export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const token = req.cookies?.[ACCESS_TOKEN_COOKIE] as string | undefined;
  if (token) {
    const payload = verifyAccessToken(token);
    if (payload) req.userId = payload.userId;
  }
  next();
}
