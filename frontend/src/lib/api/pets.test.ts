import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createPetRequest,
  deletePetRequest,
  fetchPets,
  savePetMbtiApi,
  updatePetRequest,
  type PetInput,
} from "@/lib/api/pets";
import { makeMbtiResult, makePet } from "@/test/fixtures";

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

const input: PetInput = {
  name: "콩이",
  breed: "말티즈",
  weightKg: 3,
  ageYears: 4,
  size: "소형견",
  emoji: "🐶",
};

describe("fetchPets", () => {
  it("목록을 그대로 돌려준다", async () => {
    const pets = [makePet()];
    fetchMock.mockResolvedValue(jsonResponse({ pets }));

    expect(await fetchPets()).toEqual(pets);
    expect(fetchMock.mock.calls[0][0]).toBe("/api/pets");
  });

  it("비로그인(401)이면 빈 배열로 다룬다", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ error: "unauthorized" }, 401));

    expect(await fetchPets()).toEqual([]);
  });

  it("백엔드가 꺼져 있어도 빈 배열로 다룬다 — 화면은 미등록 상태로 그려진다", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

    expect(await fetchPets()).toEqual([]);
  });
});

describe("createPetRequest / updatePetRequest", () => {
  it("등록은 POST /api/pets", async () => {
    const pet = makePet();
    fetchMock.mockResolvedValue(jsonResponse({ pet }));

    expect(await createPetRequest(input)).toEqual({ ok: true, pet });
    expect(fetchMock).toHaveBeenCalledWith("/api/pets", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  });

  it("수정은 PATCH /api/pets/:petId", async () => {
    const pet = makePet({ name: "두부" });
    fetchMock.mockResolvedValue(jsonResponse({ pet }));

    expect(await updatePetRequest("pet-1", input)).toEqual({ ok: true, pet });
    expect(fetchMock.mock.calls[0][0]).toBe("/api/pets/pet-1");
    expect(fetchMock.mock.calls[0][1].method).toBe("PATCH");
  });

  it("필드 검증 실패는 errors를 그대로 전달한다", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ error: "입력을 확인해주세요", errors: { weightKg: "숫자만" } }, 400)
    );

    expect(await createPetRequest(input)).toEqual({
      ok: false,
      message: "입력을 확인해주세요",
      errors: { weightKg: "숫자만" },
    });
  });

  it("연결 실패는 서버 문제로 안내한다", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

    const result = await createPetRequest(input);
    expect(result.ok === false && result.message).toContain("서버에 연결할 수 없어요");
  });
});

describe("deletePetRequest", () => {
  it("본문 없는 204도 성공으로 본다", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

    expect(await deletePetRequest("pet-1")).toEqual({ ok: true });
    expect(fetchMock.mock.calls[0][1].method).toBe("DELETE");
  });

  it("실패 메시지가 없으면 기본 문구로 채운다", async () => {
    fetchMock.mockResolvedValue(new Response("nope", { status: 500 }));

    expect(await deletePetRequest("pet-1")).toEqual({ ok: false, message: "삭제에 실패했어요" });
  });
});

describe("savePetMbtiApi", () => {
  it("등록 폼과 섞이지 않도록 전용 PUT 엔드포인트를 쓴다", async () => {
    const pet = makePet();
    const mbti = makeMbtiResult();
    fetchMock.mockResolvedValue(jsonResponse({ pet }));

    expect(await savePetMbtiApi("pet-1", mbti)).toEqual({ ok: true, pet });
    expect(fetchMock).toHaveBeenCalledWith("/api/pets/pet-1/mbti", {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(mbti),
    });
  });

  it("연결 실패는 서버 문제로 안내한다", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

    const result = await savePetMbtiApi("pet-1", makeMbtiResult());
    expect(result.ok === false && result.message).toContain("서버에 연결할 수 없어요");
  });
});
