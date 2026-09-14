import express from "express";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { asyncHandler } from "./asyncHandler";

/** 에러 미들웨어까지 갖춘 앱 — Express 4는 async 예외를 스스로 잡지 못한다. */
function appWith(handler: express.RequestHandler) {
  const app = express();
  const onError = vi.fn();
  app.get("/", handler);
  app.use((error: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    onError(error);
    res.status(500).json({ error: error.message });
  });
  return { app, onError };
}

describe("asyncHandler", () => {
  it("정상 응답은 그대로 통과시킨다", async () => {
    const { app } = appWith(
      asyncHandler(async (_req, res) => {
        res.json({ ok: true });
      })
    );

    const response = await request(app).get("/");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ok: true });
  });

  it("비동기 예외를 에러 미들웨어로 넘긴다 — 안 넘기면 프로세스가 죽는다", async () => {
    const { app, onError } = appWith(
      asyncHandler(async () => {
        throw new Error("DB 연결 실패");
      })
    );

    const response = await request(app).get("/");

    expect(response.status).toBe(500);
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: "DB 연결 실패" }));
  });

  it("거부된 Promise도 같은 길로 넘긴다", async () => {
    const { app, onError } = appWith(asyncHandler(() => Promise.reject(new Error("타임아웃"))));

    await request(app).get("/");

    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: "타임아웃" }));
  });

  it("응답을 이미 보낸 뒤 터져도 에러 미들웨어를 거친다", async () => {
    const { app, onError } = appWith(
      asyncHandler(async (_req, res) => {
        res.json({ ok: true });
        throw new Error("응답 후 오류");
      })
    );

    const response = await request(app).get("/");

    expect(response.status).toBe(200);
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: "응답 후 오류" }));
  });

  it("req·res·next를 그대로 넘긴다", async () => {
    // 성공 시 next를 부르는 건 핸들러 몫이다 — asyncHandler는 실패만 넘긴다.
    const handler = vi.fn(async (_req, _res, next: express.NextFunction) => next());
    const app = express();
    app.get("/", asyncHandler(handler), (_req, res) => res.json({ passed: true }));

    await request(app).get("/");

    const [req, res, next] = handler.mock.calls[0];
    expect(req.method).toBe("GET");
    expect(typeof res.json).toBe("function");
    expect(typeof next).toBe("function");
  });
});
