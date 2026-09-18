import { describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({ geocodeAddress: vi.fn(), fetchPublicDataJson: vi.fn() }));
vi.mock("./kakaoLocal", () => ({ geocodeAddress: api.geocodeAddress }));
vi.mock("./publicData", () => ({
  assertPublicDataApiKey: () => "test-key",
  fetchPublicDataJson: api.fetchPublicDataJson,
}));

import { bakeryBrandKey, bakeryNameKey, fetchBakeryCandidates, isPilgrimageBakery, pickBakerySample } from "./bakeries";

describe("빵지순례 업소 필터", () => {
  it.each(["파리바게뜨 대전점", "파리바게트(유성점)", "뚜레쥬르대전점", "던킨도너츠", "브레댄코 자운대점", "호밀호두 대전월평점2", "동네 만두집"])(
    "%s은 추천에서 제외한다", (name) => {
      expect(isPilgrimageBakery(name)).toBe(false);
    }
  );

  it.each(["성심당 본점", "하레하레", "동네빵집"])("%s은 추천 후보로 둔다", (name) => {
    expect(isPilgrimageBakery(name)).toBe(true);
  });

  it("숫자만 붙은 중복 상호를 같은 이름으로 본다", () => {
    expect(bakeryNameKey("정인구팥빵2")).toBe(bakeryNameKey("정인구팥빵"));
    expect(bakeryNameKey("호밀호두 대전월평점2")).toBe(bakeryNameKey("호밀호두 대전월평점"));
  });

  it("같은 브랜드의 다른 지점을 한 빵집으로 본다", () => {
    expect(bakeryBrandKey("성심당본점")).toBe(bakeryBrandKey("성심당 대전역점2"));
    expect(bakeryBrandKey("몽심")).toBe(bakeryBrandKey("주식회사몽심대흥"));
  });
});

it("시민 추천 빵집을 포함하면서 일반 빵집도 날짜별로 바꿔 보여준다", () => {
  const rows = ["동네빵집1", "동네빵집2", "동네빵집3", "성심당본점", "몽심대흥"].map((name) => ({ name }));
  const first = pickBakerySample(rows, (row) => row.name, 0, 3).map((row) => row.name);
  const next = pickBakerySample(rows, (row) => row.name, 1, 3).map((row) => row.name);
  expect(first).toContain("성심당본점");
  expect(first.some((name) => name.startsWith("동네빵집"))).toBe(true);
  expect(next.some((name) => name.startsWith("동네빵집"))).toBe(true);
  expect(first).not.toEqual(next);
});

it("서구 API 요청을 다른 구의 좌표 확인과 동시에 시작한다", async () => {
  let finishGeocoding!: (point: { lat: number; lng: number }) => void;
  api.geocodeAddress.mockReturnValue(new Promise((resolve) => { finishGeocoding = resolve; }));
  api.fetchPublicDataJson.mockResolvedValue({ response: { header: { resultCode: "C00" }, body: { items: [] } } });

  const result = fetchBakeryCandidates(undefined, 1);
  await Promise.resolve();
  await Promise.resolve();
  expect(api.geocodeAddress).toHaveBeenCalled();
  expect(api.fetchPublicDataJson).toHaveBeenCalledTimes(1);

  finishGeocoding({ lat: 36.35, lng: 127.38 });
  expect((await result).length).toBeGreaterThan(0);
});
