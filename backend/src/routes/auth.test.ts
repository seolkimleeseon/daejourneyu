import request from "supertest";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

// 실제 토큰을 발급·검증해 쿠키까지 함께 확인한다 — 가짜 auth 모듈로는 그 경로가 안 돈다.
process.env.JWT_SECRET = "test-secret";

const { prisma } = vi.hoisted(() => ({
  prisma: { user: { findUnique: vi.fn(), create: vi.fn() } },
}));
vi.mock("../lib/prisma", () => ({ prisma }));

import authRouter from "./auth";
import { ACCESS_TOKEN_COOKIE, hashPassword, signAccessToken } from "../lib/auth";
import { createTestApp } from "../test/testApp";

const app = createTestApp("/api/auth", authRouter);

const SIGNUP = { email: "Kong@Example.com ", nickname: " 콩이네 ", password: "pw12345678" };

function userRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "user-1",
    email: "kong@example.com",
    nickname: "콩이네",
    provider: "local",
    providerId: null,
    passwordHash: "hash",
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/auth/signup", () => {
  it("이메일은 소문자·공백 제거 후 저장하고 인증 쿠키를 심는다", async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue(userRow());

    const response = await request(app).post("/api/auth/signup").send(SIGNUP);

    expect(response.status).toBe(201);
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ email: "kong@example.com", nickname: "콩이네" }),
    });
    expect(response.headers["set-cookie"][0]).toContain(ACCESS_TOKEN_COOKIE);
    expect(response.headers["set-cookie"][0]).toContain("HttpOnly");
  });

  it("비밀번호는 해시로 저장한다 — 원문이 DB로 가면 안 된다", async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue(userRow());

    await request(app).post("/api/auth/signup").send(SIGNUP);

    const { passwordHash } = prisma.user.create.mock.calls[0][0].data;
    expect(passwordHash).not.toBe(SIGNUP.password);
    expect(passwordHash).toMatch(/^\$2[aby]\$/);
  });

  it("응답에 passwordHash를 절대 담지 않는다", async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue(userRow());

    const response = await request(app).post("/api/auth/signup").send(SIGNUP);

    expect(response.body.user).toEqual({
      id: "user-1",
      email: "kong@example.com",
      nickname: "콩이네",
      provider: "local",
    });
    expect(JSON.stringify(response.body)).not.toContain("passwordHash");
  });

  it("형식이 틀리면 필드별 메시지로 400 — DB까지 가지 않는다", async () => {
    const response = await request(app)
      .post("/api/auth/signup")
      .send({ email: "not-an-email", nickname: "ㄱ", password: "short" });

    expect(response.status).toBe(400);
    expect(Object.keys(response.body.errors).sort()).toEqual(["email", "nickname", "password"]);
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it("이미 가입된 이메일이면 409", async () => {
    prisma.user.findUnique.mockResolvedValue(userRow());

    const response = await request(app).post("/api/auth/signup").send(SIGNUP);

    expect(response.status).toBe(409);
    expect(response.body.errors.email).toContain("이미 가입된");
    expect(prisma.user.create).not.toHaveBeenCalled();
  });
});

describe("POST /api/auth/login", () => {
  let passwordHash: string;

  beforeAll(async () => {
    passwordHash = await hashPassword("pw12345678");
  });

  it("비밀번호가 맞으면 쿠키를 심고 사용자를 돌려준다", async () => {
    prisma.user.findUnique.mockResolvedValue(userRow({ passwordHash }));

    const response = await request(app)
      .post("/api/auth/login")
      .send({ email: "kong@example.com", password: "pw12345678" });

    expect(response.status).toBe(200);
    expect(response.body.user.id).toBe("user-1");
    expect(response.headers["set-cookie"][0]).toContain(ACCESS_TOKEN_COOKIE);
  });

  it("비밀번호가 틀리면 401", async () => {
    prisma.user.findUnique.mockResolvedValue(userRow({ passwordHash }));

    const response = await request(app)
      .post("/api/auth/login")
      .send({ email: "kong@example.com", password: "wrongpassword" });

    expect(response.status).toBe(401);
    expect(response.headers["set-cookie"]).toBeUndefined();
  });

  it("없는 계정과 틀린 비밀번호의 응답이 같다 — 가입 여부를 알려주지 않는다", async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    const missing = await request(app)
      .post("/api/auth/login")
      .send({ email: "nobody@example.com", password: "pw12345678" });

    prisma.user.findUnique.mockResolvedValue(userRow({ passwordHash }));
    const wrong = await request(app)
      .post("/api/auth/login")
      .send({ email: "kong@example.com", password: "wrongpassword" });

    expect(missing.status).toBe(wrong.status);
    expect(missing.body).toEqual(wrong.body);
  });

  it("카카오로 가입한 계정은 비밀번호 로그인이 막힌다", async () => {
    prisma.user.findUnique.mockResolvedValue(
      userRow({ provider: "kakao", providerId: "9876", passwordHash: null })
    );

    const response = await request(app)
      .post("/api/auth/login")
      .send({ email: "kong@example.com", password: "pw12345678" });

    expect(response.status).toBe(401);
  });
});

describe("GET /api/auth/me", () => {
  it("쿠키가 없으면 401", async () => {
    const response = await request(app).get("/api/auth/me");

    expect(response.status).toBe(401);
  });

  it("유효한 토큰이면 사용자를 돌려준다", async () => {
    prisma.user.findUnique.mockResolvedValue(userRow());
    const token = signAccessToken({ userId: "user-1" });

    const response = await request(app)
      .get("/api/auth/me")
      .set("Cookie", `${ACCESS_TOKEN_COOKIE}=${token}`);

    expect(response.status).toBe(200);
    expect(response.body.user.id).toBe("user-1");
    expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: "user-1" } });
  });

  it("토큰은 멀쩡한데 계정이 지워졌으면 401", async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    const token = signAccessToken({ userId: "user-1" });

    const response = await request(app)
      .get("/api/auth/me")
      .set("Cookie", `${ACCESS_TOKEN_COOKIE}=${token}`);

    expect(response.status).toBe(401);
  });
});

describe("POST /api/auth/logout", () => {
  it("쿠키를 비우고 204", async () => {
    const response = await request(app).post("/api/auth/logout");

    expect(response.status).toBe(204);
    expect(response.headers["set-cookie"][0]).toContain(`${ACCESS_TOKEN_COOKIE}=;`);
  });
});
