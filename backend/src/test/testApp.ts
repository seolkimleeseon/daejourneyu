import type { Server } from "node:http";
import express, { type Router } from "express";
import cookieParser from "cookie-parser";
import { afterAll } from "vitest";

/**
 * 라우트 테스트용 최소 Express 앱.
 *
 * `src/index.ts`를 통째로 띄우면 DB 연결·외부 API 키·포트 바인딩까지 딸려 온다. 라우터 하나만
 * 태우면 그 라우터가 실제로 의존하는 것(json 파서·쿠키 파서)만 갖춘 채로 요청을 흘려볼 수 있다.
 *
 * ⚠ Express 앱이 아니라 **이미 듣고 있는 서버**를 돌려준다. supertest에 앱을 그대로 넘기면
 * 요청 하나마다 `http.Server`를 새로 만들어 `listen(0)` → 요청 → `close()`를 반복하는데
 * (supertest/lib/test.js의 serverAddress), 이 열고 닫기가 간헐적으로 어긋나 요청이 영영
 * 안 끝나거나 ECONNRESET으로 끊긴다. 1,500회를 돌려 보면 앱을 넘길 땐 멈춤·오류가 섞여 나오고
 * 서버를 넘기면 12,000회까지 한 건도 안 났다(속도도 2~15배 빠르다). 서버에 주소가 이미 있으면
 * supertest가 새로 띄우지 않으므로, 파일당 하나만 띄워 두고 끝날 때 닫는다.
 */
export function createTestApp(mountPath: string, router: Router): Server {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use(mountPath, router);

  const server = app.listen(0);
  // 테스트가 다 끝났는데 이 서버 때문에 프로세스가 안 죽는 일이 없게 한다.
  server.unref();
  afterAll(() => new Promise<void>((resolve) => server.close(() => resolve())));
  return server;
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
