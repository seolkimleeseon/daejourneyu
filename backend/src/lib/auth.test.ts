import express from "express";
import cookieParser from "cookie-parser";
import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";

// 토큰 서명에 쓰는 시크릿. lib/auth는 모듈 로드가 아니라 호출 시점에 읽으므로 import 뒤에 넣어도 된다.
process.env.JWT_SECRET = "test-secret";

import {
  ACCESS_TOKEN_COOKIE,
  clearAuthCookie,
  hashPassword,
  requireAuth,
  setAuthCookie,
  signAccessToken,
  verifyAccessToken,
  verifyPassword,
} from "./auth";

describe("비밀번호 해시", () => {
  let hash: string;

  beforeAll(async () => {
    hash = await hashPassword("pw12345678");
  });

  it("원문을 그대로 저장하지 않는다", () => {
    expect(hash).not.toContain("pw12345678");
  });

  it("맞는 비밀번호만 통과시킨다", async () => {
    expect(await verifyPassword("pw12345678", hash)).toBe(true);
    expect(await verifyPassword("pw12345679", hash)).toBe(false);
  });
});

describe("액세스 토큰", () => {
  it("서명한 페이로드를 그대로 되찾는다", () => {
    const token = signAccessToken({ userId: "user-1" });

    expect(verifyAccessToken(token)).toMatchObject({ userId: "user-1" });
  });

  it("위조·손상된 토큰은 null — 만료와 구분해 알려주지 않는다", () => {
    const token = signAccessToken({ userId: "user-1" });

    expect(verifyAccessToken(`${token}x`)).toBeNull();
    expect(verifyAccessToken("아무거나")).toBeNull();
  });

  it("다른 시크릿으로 서명된 토큰은 받지 않는다", () => {
    const token = signAccessToken({ userId: "user-1" });
    process.env.JWT_SECRET = "another-secret";
    const result = verifyAccessToken(token);
    process.env.JWT_SECRET = "test-secret";

    expect(result).toBeNull();
  });
});

describe("인증 쿠키", () => {
  function cookieApp() {
    const app = express();
    app.get("/set", (_req, res) => {
      setAuthCookie(res, "token-value");
      res.status(204).end();
    });
    app.get("/clear", (_req, res) => {
      clearAuthCookie(res);
      res.status(204).end();
    });
    return app;
  }

  it("JS가 읽지 못하도록 httpOnly로 심는다", async () => {
    const response = await request(cookieApp()).get("/set");
    const [cookie] = response.headers["set-cookie"];

    expect(cookie).toContain(`${ACCESS_TOKEN_COOKIE}=token-value`);
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("Path=/");
  });

  it("로그아웃은 같은 경로의 쿠키를 비운다", async () => {
    const response = await request(cookieApp()).get("/clear");
    const [cookie] = response.headers["set-cookie"];

    expect(cookie).toContain(`${ACCESS_TOKEN_COOKIE}=;`);
  });
});

describe("requireAuth", () => {
  function guardedApp() {
    const app = express();
    app.use(cookieParser());
    app.get("/protected", requireAuth, (req, res) => res.json({ userId: req.userId }));
    return app;
  }

  it("쿠키가 없으면 401", async () => {
    const response = await request(guardedApp()).get("/protected");

    expect(response.status).toBe(401);
    expect(response.body.error).toBe("인증이 필요합니다");
  });

  it("토큰이 유효하지 않으면 다시 로그인하라고 안내한다", async () => {
    const response = await request(guardedApp())
      .get("/protected")
      .set("Cookie", `${ACCESS_TOKEN_COOKIE}=tampered.token.value`);

    expect(response.status).toBe(401);
    expect(response.body.error).toContain("다시 로그인");
  });

  it("유효한 토큰이면 req.userId를 채워 통과시킨다", async () => {
    const token = signAccessToken({ userId: "user-1" });
    const response = await request(guardedApp())
      .get("/protected")
      .set("Cookie", `${ACCESS_TOKEN_COOKIE}=${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ userId: "user-1" });
  });
});
