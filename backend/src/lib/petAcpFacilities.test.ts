import { describe, expect, it } from "vitest";
import { PET_ACP_FACILITIES } from "./petAcpFacilities";

/*
 * 이 파일은 로직이 아니라 CSV에서 한 번 옮겨 박은 시드다 — 파일 주석대로 "갱신되면 이 배열만
 * 다시 교체"하게 되어 있다. 그래서 여기서 지키는 건 동작이 아니라 데이터 자체의 약속이다:
 * 갈아끼울 때 열이 밀리거나 다른 지역이 섞여 들어오면 이 테스트가 먼저 걸린다.
 */
const DISTRICTS = ["유성구", "중구", "동구", "대덕구", "서구"];
const CATEGORIES = ["산책", "놀이터", "맛집", "문화"];

/** 대전 행정구역을 넉넉히 감싸는 사각형 — 열이 밀리거나 위경도가 뒤집히면 여기서 벗어난다. */
const DAEJEON_BOX = { minLat: 36.15, maxLat: 36.55, minLng: 127.2, maxLng: 127.55 };

describe("시드 데이터", () => {
  it("비어 있지 않다", () => {
    expect(PET_ACP_FACILITIES.length).toBeGreaterThan(0);
  });

  it("이름이 빈 항목이 없다", () => {
    expect(PET_ACP_FACILITIES.filter((entry) => !entry.name.trim())).toEqual([]);
  });

  it("대전 5개 구 밖이 섞여 있지 않다 — 전국 데이터에서 걸러 온 목록이다", () => {
    const outside = PET_ACP_FACILITIES.filter((entry) => !DISTRICTS.includes(entry.district));

    expect(outside.map((entry) => `${entry.name}(${entry.district})`)).toEqual([]);
  });

  it("카테고리는 앱이 아는 네 가지뿐이다", () => {
    const unknown = PET_ACP_FACILITIES.filter((entry) => !CATEGORIES.includes(entry.category));

    expect(unknown.map((entry) => `${entry.name}(${entry.category})`)).toEqual([]);
  });

  it("좌표가 대전 안에 있다 — 위경도가 뒤집히면 여기서 걸린다", () => {
    const offMap = PET_ACP_FACILITIES.filter(
      (entry) =>
        !(entry.lat >= DAEJEON_BOX.minLat && entry.lat <= DAEJEON_BOX.maxLat) ||
        !(entry.lng >= DAEJEON_BOX.minLng && entry.lng <= DAEJEON_BOX.maxLng)
    );

    expect(offMap.map((entry) => `${entry.name}(${entry.lat},${entry.lng})`)).toEqual([]);
  });
});

describe("동반 여부와 조건", () => {
  it("동반 가능 여부는 Y/N 둘 중 하나다", () => {
    const odd = PET_ACP_FACILITIES.filter((entry) => entry.petPossible !== "Y" && entry.petPossible !== "N");

    expect(odd.map((entry) => entry.name)).toEqual([]);
  });

  it("동반 불가인 곳은 크기·제한 칸도 '해당없음'이다 — 조건만 남아 가능한 것처럼 읽히면 안 된다", () => {
    const contradictory = PET_ACP_FACILITIES.filter(
      (entry) => entry.petPossible === "N" && (entry.petSize !== "해당없음" || entry.petLimit !== "해당없음")
    );

    expect(contradictory.map((entry) => entry.name)).toEqual([]);
  });

  it("동반 가능한 곳은 크기·제한 칸이 비어 있지 않다 — 빈 칸은 조건을 못 만든다", () => {
    const blank = PET_ACP_FACILITIES.filter(
      (entry) => entry.petPossible === "Y" && (!entry.petSize.trim() || !entry.petLimit.trim())
    );

    expect(blank.map((entry) => entry.name)).toEqual([]);
  });

  it("동반 가능한 곳이 대부분이다 — 불가만 잔뜩 남았으면 잘못 걸러 온 것이다", () => {
    const possible = PET_ACP_FACILITIES.filter((entry) => entry.petPossible === "Y");

    expect(possible.length).toBeGreaterThan(PET_ACP_FACILITIES.length / 2);
  });
});

describe("중복", () => {
  it("같은 이름이 두 번 들어 있지 않다 — 여러 번 붙여 넣으면 여기서 걸린다", () => {
    const seen = new Set<string>();
    const duplicated = PET_ACP_FACILITIES.filter((entry) => {
      const key = `${entry.district}/${entry.name}`;
      if (seen.has(key)) return true;
      seen.add(key);
      return false;
    });

    expect(duplicated.map((entry) => entry.name)).toEqual([]);
  });
});
