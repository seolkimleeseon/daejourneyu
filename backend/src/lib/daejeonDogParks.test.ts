import { describe, expect, it } from "vitest";
import { DAEJEON_DOG_PARKS } from "./daejeonDogParks";

/*
 * 공공데이터가 없어 시청 홈페이지·보도자료를 보고 손으로 옮긴 목록이다(파일 주석 참고).
 * 손으로 채운 만큼 오타가 나기 쉬워서, 동작이 아니라 데이터 자체의 약속을 지킨다.
 */
const DISTRICTS = ["유성구", "중구", "동구", "대덕구", "서구"];

/** 대전 행정구역을 넉넉히 감싸는 사각형 — 위경도가 뒤집히면 여기서 벗어난다. */
const DAEJEON_BOX = { minLat: 36.15, maxLat: 36.55, minLng: 127.2, maxLng: 127.55 };

describe("반려견 놀이터 시드", () => {
  it("비어 있지 않다", () => {
    expect(DAEJEON_DOG_PARKS.length).toBeGreaterThan(0);
  });

  it("대전 5개 구 안에 있다", () => {
    const outside = DAEJEON_DOG_PARKS.filter((park) => !DISTRICTS.includes(park.district));

    expect(outside.map((park) => `${park.name}(${park.district})`)).toEqual([]);
  });

  it("좌표가 대전 안에 있다 — 위경도를 뒤집어 적으면 여기서 걸린다", () => {
    const offMap = DAEJEON_DOG_PARKS.filter(
      (park) =>
        !(park.lat >= DAEJEON_BOX.minLat && park.lat <= DAEJEON_BOX.maxLat) ||
        !(park.lng >= DAEJEON_BOX.minLng && park.lng <= DAEJEON_BOX.maxLng)
    );

    expect(offMap.map((park) => `${park.name}(${park.lat},${park.lng})`)).toEqual([]);
  });

  it("이름과 메모가 비어 있지 않다 — 메모는 조건 문구를 만드는 재료다", () => {
    const blank = DAEJEON_DOG_PARKS.filter((park) => !park.name.trim() || !park.note.trim());

    expect(blank.map((park) => park.name)).toEqual([]);
  });

  it("한 구에 같은 이름이 두 번 들어 있지 않다", () => {
    const keys = DAEJEON_DOG_PARKS.map((park) => `${park.district}/${park.name}`);

    expect(new Set(keys).size).toBe(keys.length);
  });
});
