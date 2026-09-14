import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createCourseApi,
  deleteCourseApi,
  fetchCourses,
  updateCourseApi,
} from "@/lib/api/courses";
import { makeCourse } from "@/test/fixtures";

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const course = makeCourse({ id: "course-1" });

describe("fetchCourses", () => {
  it("인증 쿠키를 실어 목록을 가져온다", async () => {
    fetchMock.mockResolvedValue(jsonResponse([course]));

    expect(await fetchCourses()).toEqual([course]);
    expect(fetchMock).toHaveBeenCalledWith("/api/courses", { credentials: "include" });
  });

  it("실패하면 사람이 읽을 메시지로 던진다", async () => {
    fetchMock.mockResolvedValue(new Response("unauthorized", { status: 401 }));

    await expect(fetchCourses()).rejects.toThrow("코스 목록을 불러오지 못했어요");
  });
});

describe("createCourseApi", () => {
  it("id 없이 보낸 코스를 서버가 만든 코스로 돌려받는다", async () => {
    const { id: _id, ...input } = course;
    fetchMock.mockResolvedValue(jsonResponse(course));

    expect(await createCourseApi(input)).toEqual(course);
    expect(fetchMock).toHaveBeenCalledWith("/api/courses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
      credentials: "include",
    });
  });

  it("저장 실패를 알린다", async () => {
    const { id: _id, ...input } = course;
    fetchMock.mockResolvedValue(new Response("boom", { status: 500 }));

    await expect(createCourseApi(input)).rejects.toThrow("코스 저장에 실패했어요");
  });
});

describe("updateCourseApi", () => {
  it("바뀐 필드만 PATCH한다 — 전체를 덮어쓰지 않는다", async () => {
    fetchMock.mockResolvedValue(jsonResponse(course));

    await updateCourseApi("course-1", { label: "이름 바꿈" });

    expect(fetchMock).toHaveBeenCalledWith("/api/courses/course-1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: "이름 바꿈" }),
      credentials: "include",
    });
  });

  it("수정 실패를 알린다", async () => {
    fetchMock.mockResolvedValue(new Response("boom", { status: 404 }));

    await expect(updateCourseApi("course-1", { label: "x" })).rejects.toThrow(
      "코스 수정에 실패했어요"
    );
  });
});

describe("deleteCourseApi", () => {
  it("본문 없이 DELETE한다", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

    await expect(deleteCourseApi("course-1")).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledWith("/api/courses/course-1", {
      method: "DELETE",
      credentials: "include",
    });
  });

  it("삭제 실패를 알린다", async () => {
    fetchMock.mockResolvedValue(new Response("boom", { status: 500 }));

    await expect(deleteCourseApi("course-1")).rejects.toThrow("코스 삭제에 실패했어요");
  });
});
