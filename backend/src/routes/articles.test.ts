import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { prisma } = vi.hoisted(() => ({
  prisma: {
    articleLike: {
      groupBy: vi.fn(),
      findMany: vi.fn(),
      upsert: vi.fn(),
      deleteMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));
vi.mock("../lib/prisma", () => ({ prisma }));
vi.mock("../lib/auth", async () => {
  const { fakeAuthModule } = await import("../test/testApp");
  return fakeAuthModule();
});

import articlesRouter from "./articles";
import { asUser, createTestApp } from "../test/testApp";

const app = createTestApp("/api/articles", articlesRouter);
const AS_USER_1 = asUser("user-1");

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/articles/likes", () => {
  it("아티클별 도움돼요 수와 내가 누른 아티클을 돌려준다", async () => {
    prisma.articleLike.groupBy.mockResolvedValue([
      { articleId: "article-1", _count: { articleId: 3 } },
      { articleId: "article-2", _count: { articleId: 1 } },
    ]);
    prisma.articleLike.findMany.mockResolvedValue([{ articleId: "article-2" }]);

    const response = await request(app).get("/api/articles/likes").set("Cookie", AS_USER_1);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ counts: { "article-1": 3, "article-2": 1 }, likedIds: ["article-2"] });
    expect(prisma.articleLike.findMany).toHaveBeenCalledWith({
      where: { userId: "user-1" },
      select: { articleId: true },
    });
  });

  it("로그인하지 않아도 수는 볼 수 있고, 누른 목록은 비어 있다", async () => {
    prisma.articleLike.groupBy.mockResolvedValue([{ articleId: "article-1", _count: { articleId: 3 } }]);

    const response = await request(app).get("/api/articles/likes");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ counts: { "article-1": 3 }, likedIds: [] });
    expect(prisma.articleLike.findMany).not.toHaveBeenCalled();
  });
});

describe("PUT /api/articles/:id/like", () => {
  it("로그인해야 누를 수 있다", async () => {
    const response = await request(app).put("/api/articles/article-1/like");

    expect(response.status).toBe(401);
    expect(prisma.articleLike.upsert).not.toHaveBeenCalled();
  });

  it("누르고 바뀐 수를 돌려준다", async () => {
    prisma.articleLike.upsert.mockResolvedValue({});
    prisma.articleLike.count.mockResolvedValue(4);

    const response = await request(app).put("/api/articles/article-1/like").set("Cookie", AS_USER_1);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ articleId: "article-1", liked: true, count: 4 });
    expect(prisma.articleLike.upsert).toHaveBeenCalledWith({
      where: { userId_articleId: { userId: "user-1", articleId: "article-1" } },
      update: {},
      create: { userId: "user-1", articleId: "article-1" },
    });
  });

  it("같은 걸 다시 눌러도 성공이다 — 연타와 재시도에 안전하다", async () => {
    prisma.articleLike.upsert.mockResolvedValue({});
    prisma.articleLike.count.mockResolvedValue(1);

    const first = await request(app).put("/api/articles/article-1/like").set("Cookie", AS_USER_1);
    const second = await request(app).put("/api/articles/article-1/like").set("Cookie", AS_USER_1);

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
  });

  it("이상한 아티클 id는 400으로 막는다", async () => {
    const response = await request(app).put("/api/articles/bad%20id!/like").set("Cookie", AS_USER_1);

    expect(response.status).toBe(400);
    expect(prisma.articleLike.upsert).not.toHaveBeenCalled();
  });
});

describe("DELETE /api/articles/:id/like", () => {
  it("취소하고 바뀐 수를 돌려준다", async () => {
    prisma.articleLike.deleteMany.mockResolvedValue({ count: 1 });
    prisma.articleLike.count.mockResolvedValue(2);

    const response = await request(app).delete("/api/articles/article-1/like").set("Cookie", AS_USER_1);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ articleId: "article-1", liked: false, count: 2 });
    expect(prisma.articleLike.deleteMany).toHaveBeenCalledWith({
      where: { userId: "user-1", articleId: "article-1" },
    });
  });

  it("누른 적 없어도 성공이다", async () => {
    prisma.articleLike.deleteMany.mockResolvedValue({ count: 0 });
    prisma.articleLike.count.mockResolvedValue(0);

    const response = await request(app).delete("/api/articles/article-9/like").set("Cookie", AS_USER_1);

    expect(response.status).toBe(200);
  });

  it("로그인해야 취소할 수 있다", async () => {
    const response = await request(app).delete("/api/articles/article-1/like");

    expect(response.status).toBe(401);
  });
});
