import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  assertKakaoRestKey,
  fetchPlaceImage,
  geocodeAddress,
  reverseGeocode,
  searchKakaoPlaces,
  supplementImagesByName,
} from "./kakaoLocal";

const fetchMock = vi.fn();

/**
 * 캐시는 모듈 전역 Map이고 TTL이 길다(30일) — 테스트끼리 키가 겹치면 앞 테스트 결과가 그대로
 * 돌아온다. 캐시 자체를 확인하는 테스트를 빼면 매번 새 질의어를 쓴다.
 */
let seq = 0;
function uniq(prefix: string) {
  seq += 1;
  return `${prefix}-${seq}`;
}

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  process.env.KAKAO_REST_API_KEY = "kakao-key";
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

function imageDoc(overrides: Record<string, unknown> = {}) {
  return { image_url: "https://img/photo.jpg", width: 800, height: 600, ...overrides };
}

describe("assertKakaoRestKey", () => {
  it("키가 있으면 돌려준다", () => {
    expect(assertKakaoRestKey()).toBe("kakao-key");
  });

  it("없으면 어디에 넣어야 하는지까지 알려준다", () => {
    delete process.env.KAKAO_REST_API_KEY;

    expect(() => assertKakaoRestKey()).toThrow(/backend\/.env/);
  });
});

describe("geocodeAddress", () => {
  it("첫 결과의 x·y를 lng·lat으로 바꿔 준다 — 카카오는 축 이름이 반대다", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        meta: { total_count: 1 },
        documents: [{ address_name: "대전 서구 둔산동", x: "127.38", y: "36.36" }],
      })
    );

    expect(await geocodeAddress(uniq("대전 서구"))).toEqual({
      lat: 36.36,
      lng: 127.38,
      matchedAddress: "대전 서구 둔산동",
    });
  });

  it("빈 주소는 네트워크를 타지 않고 null", async () => {
    expect(await geocodeAddress("   ")).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("매칭되는 주소가 없으면 null", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ meta: { total_count: 0 }, documents: [] }));

    expect(await geocodeAddress(uniq("없는주소"))).toBeNull();
  });

  it("REST 키를 헤더에 싣는다", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ meta: { total_count: 0 }, documents: [] }));

    await geocodeAddress(uniq("주소"));

    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe("KakaoAK kakao-key");
  });

  it("요청이 실패하면 던진다 — 좌표 없는 장소를 조용히 만들지 않는다", async () => {
    fetchMock.mockResolvedValue(new Response("quota exceeded", { status: 429 }));

    await expect(geocodeAddress(uniq("주소"))).rejects.toThrow(/지오코딩 요청 실패/);
  });

  it("같은 주소는 한 번만 호출한다 — 주소는 거의 바뀌지 않는다", async () => {
    const address = uniq("캐시확인");
    fetchMock.mockResolvedValue(
      jsonResponse({
        meta: { total_count: 1 },
        documents: [{ address_name: "대전 서구", x: "127.3", y: "36.3" }],
      })
    );

    await geocodeAddress(address);
    await geocodeAddress(address);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe("reverseGeocode", () => {
  it("행정동(H)을 우선해서 시·구를 준다", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        documents: [
          { region_type: "B", region_1depth_name: "대전광역시", region_2depth_name: "법정동구" },
          { region_type: "H", region_1depth_name: "대전광역시", region_2depth_name: "유성구" },
        ],
      })
    );

    expect(await reverseGeocode(36.3611, 127.3561)).toEqual({
      city: "대전광역시",
      district: "유성구",
    });
  });

  it("행정동이 없으면 첫 결과를 쓴다", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        documents: [
          { region_type: "B", region_1depth_name: "대전광역시", region_2depth_name: "중구" },
        ],
      })
    );

    expect(await reverseGeocode(36.4711, 127.4561)).toMatchObject({ district: "중구" });
  });

  it("결과가 없으면 null", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ documents: [] }));

    expect(await reverseGeocode(35.1711, 129.0761)).toBeNull();
  });

  it("100m 남짓 차이는 같은 캐시로 본다 — 행정구역은 그 정도로 안 바뀐다", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        documents: [
          { region_type: "H", region_1depth_name: "대전광역시", region_2depth_name: "동구" },
        ],
      })
    );

    await reverseGeocode(36.98761, 127.98761);
    await reverseGeocode(36.98764, 127.98762);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe("fetchPlaceImage", () => {
  it("첫 번째 '진짜 사진'을 고른다", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ documents: [imageDoc()] }));

    expect(await fetchPlaceImage(uniq("한밭수목원"), "kakao-key")).toBe("https://img/photo.jpg");
  });

  it("이모티콘·깨진 도메인은 거른다", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        documents: [
          imageDoc({ image_url: "https://storep-phinf.pstatic.net/sticker.png" }),
          imageDoc({ image_url: "https://uf.daum.net/old.jpg" }),
          imageDoc({ image_url: "https://img/real.jpg" }),
        ],
      })
    );

    expect(await fetchPlaceImage(uniq("장소"), "kakao-key")).toBe("https://img/real.jpg");
  });

  it("너무 작은 이미지는 거른다", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ documents: [imageDoc({ width: 120, height: 120 })] })
    );

    expect(await fetchPlaceImage(uniq("장소"), "kakao-key")).toBeNull();
  });

  it("길쭉한 블로그 표지 배너는 거른다", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ documents: [imageDoc({ width: 773, height: 244 })] })
    );

    expect(await fetchPlaceImage(uniq("장소"), "kakao-key")).toBeNull();
  });

  it("세로로 길쭉한 것도 같은 기준으로 거른다", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ documents: [imageDoc({ width: 320, height: 900 })] })
    );

    expect(await fetchPlaceImage(uniq("장소"), "kakao-key")).toBeNull();
  });

  it("남는 후보가 없으면 억지로 붙이지 않고 null — 이모지 폴백이 낫다", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ documents: [] }));

    expect(await fetchPlaceImage(uniq("장소"), "kakao-key")).toBeNull();
  });

  it("검색 실패는 던지지 않고 null — 사진 하나 때문에 목록이 죽으면 안 된다", async () => {
    fetchMock.mockResolvedValue(new Response("rate limited", { status: 429 }));

    expect(await fetchPlaceImage(uniq("장소"), "kakao-key")).toBeNull();
  });
});

describe("supplementImagesByName", () => {
  it("카카오 키가 없으면 원본을 그대로 돌려준다", async () => {
    delete process.env.KAKAO_REST_API_KEY;
    const items = [{ name: "공원", imageUrl: null }];

    expect(await supplementImagesByName(items, (item) => item.name, 10)).toEqual(items);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("cap까지만 사진을 채운다 — 호출 수가 항목 수만큼 늘어나면 안 된다", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ documents: [imageDoc()] }));
    const items = [
      { name: uniq("공원"), imageUrl: null as string | null },
      { name: uniq("공원"), imageUrl: null as string | null },
      { name: uniq("공원"), imageUrl: null as string | null },
    ];

    const result = await supplementImagesByName(items, (item) => item.name, 2);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result[0].imageUrl).toBe("https://img/photo.jpg");
    expect(result[2].imageUrl).toBeNull();
  });

  it("기존 사진은 유지하고 사진이 없는 장소만 검색한다", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ documents: [imageDoc()] }));
    const items = [
      { name: uniq("사진있는공원"), imageUrl: "https://img/original.jpg" as string | null },
      { name: uniq("사진없는공원"), imageUrl: null as string | null },
    ];

    await supplementImagesByName(items, (item) => item.name, 1);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(items[0].imageUrl).toBe("https://img/original.jpg");
    expect(items[1].imageUrl).toBe("https://img/photo.jpg");
  });
});

describe("searchKakaoPlaces", () => {
  function keywordDoc(overrides: Record<string, unknown> = {}) {
    return {
      id: "123",
      place_name: "댕댕카페",
      category_name: "음식점 > 카페 > 커피전문점",
      road_address_name: "대전 서구 둔산대로 169",
      address_name: "대전 서구 둔산동 1234",
      phone: "042-000-0000",
      place_url: "http://place.map.kakao.com/123",
      x: "127.38",
      y: "36.36",
      ...overrides,
    };
  }

  it("빈 질의는 네트워크를 타지 않고 빈 배열", async () => {
    expect(await searchKakaoPlaces("   ")).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("응답을 앱에서 쓰는 모양으로 옮긴다", async () => {
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({ meta: { total_count: 1, is_end: true }, documents: [keywordDoc()] })
      )
      .mockResolvedValue(jsonResponse({ documents: [] }));

    const [place] = await searchKakaoPlaces(uniq("대전 카페"));

    expect(place).toMatchObject({
      id: "kakao-123",
      name: "댕댕카페",
      address: "대전 서구 둔산대로 169",
      lat: 36.36,
      lng: 127.38,
      phone: "042-000-0000",
    });
  });

  it("도로명 주소가 없으면 지번 주소를 쓴다", async () => {
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({
          meta: { total_count: 1, is_end: true },
          documents: [keywordDoc({ road_address_name: "" })],
        })
      )
      .mockResolvedValue(jsonResponse({ documents: [] }));

    expect((await searchKakaoPlaces(uniq("대전 카페")))[0].address).toBe("대전 서구 둔산동 1234");
  });

  it("전화번호가 비어 있으면 빈 문자열이 아니라 null로 둔다", async () => {
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({
          meta: { total_count: 1, is_end: true },
          documents: [keywordDoc({ phone: "" })],
        })
      )
      .mockResolvedValue(jsonResponse({ documents: [] }));

    expect((await searchKakaoPlaces(uniq("대전 카페")))[0].phone).toBeNull();
  });

  it("사진은 지역·업종을 붙여 따로 찾아 채운다 — 이름만으론 동명 업체가 걸린다", async () => {
    // 사진 검색어도 캐시 키라 장소명까지 새로 만들어야 실제 호출이 일어난다.
    const placeName = uniq("댕댕카페");
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({
          meta: { total_count: 1, is_end: true },
          documents: [keywordDoc({ place_name: placeName })],
        })
      )
      .mockResolvedValue(jsonResponse({ documents: [imageDoc()] }));

    const [place] = await searchKakaoPlaces(uniq("대전 카페"));

    const imageQuery = new URL(fetchMock.mock.calls[1][0]).searchParams.get("query");
    expect(imageQuery).toBe(`대전 서구 ${placeName} 커피전문점`);
    expect(place.imageUrl).toBe("https://img/photo.jpg");
  });

  it("키워드 검색 실패는 던진다", async () => {
    fetchMock.mockResolvedValue(new Response("server error", { status: 500 }));

    await expect(searchKakaoPlaces(uniq("대전 카페"))).rejects.toThrow(/키워드 검색 실패/);
  });
});
