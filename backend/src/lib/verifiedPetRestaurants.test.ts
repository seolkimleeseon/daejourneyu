import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/*
 * 식약처 목록은 오픈API가 없어 코드에 시드로 박혀 있고(파일 주석 참고), 좌표만 카카오
 * 지오코딩으로 채운다. 여기서 보는 건 "시드가 성한가"와 "좌표를 어떻게 채우고 무엇을 버리는가"다.
 */
const kakao = vi.hoisted(() => ({ geocodeAddress: vi.fn(), supplementImagesByName: vi.fn() }));
vi.mock("./kakaoLocal", () => ({
  geocodeAddress: kakao.geocodeAddress,
  supplementImagesByName: kakao.supplementImagesByName,
}));

/** 캐시가 모듈 전역 Map(TTL 24시간)이라 케이스마다 모듈을 새로 불러 비운다. */
async function loadRestaurants() {
  vi.resetModules();
  return import("./verifiedPetRestaurants");
}

beforeEach(() => {
  kakao.geocodeAddress.mockReset();
  kakao.supplementImagesByName.mockReset();
  kakao.geocodeAddress.mockResolvedValue({ lat: 36.36, lng: 127.38 });
  kakao.supplementImagesByName.mockImplementation(async (list: unknown[]) => list);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("시드 데이터", () => {
  it("전부 대전 주소다 — 전국 목록에서 걸러 온 것이다", async () => {
    const { fetchVerifiedPetRestaurants } = await loadRestaurants();

    await fetchVerifiedPetRestaurants();

    const addresses = kakao.geocodeAddress.mock.calls.map(([address]) => String(address));
    expect(addresses.length).toBeGreaterThan(0);
    expect(addresses.filter((address) => !address.startsWith("대전광역시"))).toEqual([]);
  });

  it("주소에서 구를 읽어내 붙인다 — 원본엔 구 칸이 따로 없다", async () => {
    const { fetchVerifiedPetRestaurants } = await loadRestaurants();

    const restaurants = await fetchVerifiedPetRestaurants();

    for (const restaurant of restaurants) {
      expect(restaurant.address).toContain(restaurant.district);
    }
  });

  it("이름이 빈 곳이 없다", async () => {
    const { fetchVerifiedPetRestaurants } = await loadRestaurants();

    const restaurants = await fetchVerifiedPetRestaurants();

    expect(restaurants.filter((restaurant) => !restaurant.name.trim())).toEqual([]);
  });

  it("id가 서로 겹치지 않는다", async () => {
    const { fetchVerifiedPetRestaurants } = await loadRestaurants();

    const ids = (await fetchVerifiedPetRestaurants()).map((restaurant) => restaurant.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it("전화번호·대표메뉴는 채우지 않는다 — 맞출 데이터가 없어 걷어낸 자리다", async () => {
    const { fetchVerifiedPetRestaurants } = await loadRestaurants();

    const [first] = await fetchVerifiedPetRestaurants();

    expect(first).toMatchObject({ phone: null, representativeMenu: null, imageUrl: null });
  });
});

describe("좌표 채우기", () => {
  it("좌표를 못 찾은 곳은 뺀다 — 지도에 못 꽂는다", async () => {
    kakao.geocodeAddress.mockResolvedValue(null);
    const { fetchVerifiedPetRestaurants } = await loadRestaurants();

    await expect(fetchVerifiedPetRestaurants()).resolves.toEqual([]);
  });

  it("지오코딩이 터진 곳만 빠지고 나머지는 살린다", async () => {
    kakao.geocodeAddress.mockRejectedValueOnce(new Error("카카오 응답 없음"));
    const { fetchVerifiedPetRestaurants } = await loadRestaurants();

    const restaurants = await fetchVerifiedPetRestaurants();

    expect(restaurants.length).toBeGreaterThan(0);
    expect(kakao.geocodeAddress.mock.calls.length).toBe(restaurants.length + 1);
  });

  it("찾은 좌표를 그대로 싣는다", async () => {
    kakao.geocodeAddress.mockResolvedValue({ lat: 36.1234, lng: 127.5678 });
    const { fetchVerifiedPetRestaurants } = await loadRestaurants();

    const [first] = await fetchVerifiedPetRestaurants();

    expect(first).toMatchObject({ lat: 36.1234, lng: 127.5678 });
  });

  it("한 번만 지오코딩한다 — 두 번째 호출은 캐시가 받는다", async () => {
    const { fetchVerifiedPetRestaurants } = await loadRestaurants();

    await fetchVerifiedPetRestaurants();
    const callsAfterFirst = kakao.geocodeAddress.mock.calls.length;
    await fetchVerifiedPetRestaurants();

    expect(kakao.geocodeAddress.mock.calls.length).toBe(callsAfterFirst);
  });
});

describe("사진 보충", () => {
  it("이름에 구와 '맛집'을 붙여 검색한다 — 가게 이름만으론 엉뚱한 사진이 걸린다", async () => {
    const { fetchVerifiedPetRestaurants } = await loadRestaurants();

    await fetchVerifiedPetRestaurants();

    const [, buildQuery] = kakao.supplementImagesByName.mock.lastCall as [
      unknown[],
      (r: { district: string; name: string }) => string,
      number,
    ];
    expect(buildQuery({ district: "서구", name: "댕라운지" })).toBe("대전 서구 댕라운지 맛집");
  });

  it("목록이 짧아 전부 채운다 — 다른 소스처럼 상한을 따로 두지 않는다", async () => {
    const { fetchVerifiedPetRestaurants } = await loadRestaurants();

    const restaurants = await fetchVerifiedPetRestaurants();

    expect(kakao.supplementImagesByName.mock.lastCall?.[2]).toBe(restaurants.length);
  });
});
