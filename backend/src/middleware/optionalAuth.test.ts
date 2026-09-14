import express from "express";
import cookieParser from "cookie-parser";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";

vi.mock("../lib/auth", async () => {
  const { fakeAuthModule } = await import("../test/testApp");
  return fakeAuthModule();
});

import { optionalAuth } from "./optionalAuth";
import { asUser, authCookie, createTestApp } from "../test/testApp";

function app() {
  const router = express.Router();
  router.get("/", optionalAuth, (req, res) => res.json({ userId: req.userId ?? null }));
  return createTestApp("/feed", router);
}

describe("optionalAuth", () => {
  it("쿠키가 없어도 통과시킨다 — 비로그인도 목록은 볼 수 있어야 한다", async () => {
    const response = await request(app()).get("/feed");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ userId: null });
  });

  it("토큰이 유효하면 userId를 채운다", async () => {
    const response = await request(app()).get("/feed").set("Cookie", asUser("user-1"));

    expect(response.body).toEqual({ userId: "user-1" });
  });

  it("토큰이 망가져 있어도 막지 않고 비로그인으로 본다", async () => {
    const response = await request(app()).get("/feed").set("Cookie", authCookie("broken-token"));

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ userId: null });
  });
});
