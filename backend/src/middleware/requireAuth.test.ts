import express from "express";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";

vi.mock("../lib/auth", async () => {
  const { fakeAuthModule } = await import("../test/testApp");
  return fakeAuthModule();
});

import { requireAuth } from "./requireAuth";
import { asUser, authCookie, createTestApp } from "../test/testApp";

function app() {
  const router = express.Router();
  router.get("/", requireAuth, (req, res) => res.json({ userId: req.userId }));
  return createTestApp("/mine", router);
}

describe("requireAuth", () => {
  it("쿠키가 없으면 401로 막는다", async () => {
    const response = await request(app()).get("/mine");

    expect(response.status).toBe(401);
    expect(response.body.error).toContain("로그인");
  });

  it("토큰이 유효하지 않으면 다시 로그인하라고 안내한다", async () => {
    const response = await request(app()).get("/mine").set("Cookie", authCookie("broken-token"));

    expect(response.status).toBe(401);
    expect(response.body.error).toContain("다시 로그인");
  });

  it("유효하면 userId를 채워 통과시킨다", async () => {
    const response = await request(app()).get("/mine").set("Cookie", asUser("user-1"));

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ userId: "user-1" });
  });
});
