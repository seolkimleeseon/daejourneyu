import express, { type Express, type Router } from "express";
import cookieParser from "cookie-parser";

/**
 * 라우트 테스트용 최소 Express 앱.
 *
 * `src/index.ts`를 통째로 띄우면 DB 연결·외부 API 키·포트 바인딩까지 딸려 온다. 라우터 하나만
 * 태우면 그 라우터가 실제로 의존하는 것(json 파서·쿠키 파서)만 갖춘 채로 요청을 흘려볼 수 있다.
 */
export function createTestApp(mountPath: string, router: Router): Express {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use(mountPath, router);
  return app;
}

/** 인증 쿠키 이름. lib/auth의 ACCESS_TOKEN_COOKIE와 같은 값을 유지한다. */
export const AUTH_COOKIE = "daejourneyu_token";

/** supertest의 `.set("Cookie", ...)`에 넘길 인증 쿠키 문자열. */
export function authCookie(token: string): string {
  return `${AUTH_COOKIE}=${token}`;
}

/**
 * `lib/auth`를 통째로 mock할 때 쓰는 가짜 모듈.
 * 실제 JWT 대신 `valid:<userId>` 토큰만 통과시켜 JWT_SECRET 없이 로그인 상태를 흉내 낸다.
 * 토큰 발급·검증 자체를 확인하는 테스트(lib/auth.test.ts)는 이걸 쓰지 않고 실물을 쓴다.
 */
export function fakeAuthModule() {
  const verifyAccessToken = (token: string) =>
    token.startsWith("valid:") ? { userId: token.slice("valid:".length) } : null;

  return {
    ACCESS_TOKEN_COOKIE: AUTH_COOKIE,
    verifyAccessToken,
    requireAuth: (
      req: { cookies?: Record<string, string>; userId?: string },
      res: { status: (code: number) => { json: (body: unknown) => unknown } },
      next: () => void
    ) => {
      const token = req.cookies?.[AUTH_COOKIE];
      if (!token) return res.status(401).json({ error: "인증이 필요합니다" });

      const payload = verifyAccessToken(token);
      if (!payload) return res.status(401).json({ error: "세션이 만료됐습니다" });

      req.userId = payload.userId;
      next();
    },
  };
}

/** 가짜 인증에서 통과하는 토큰 쿠키. */
export function asUser(userId: string): string {
  return authCookie(`valid:${userId}`);
}
