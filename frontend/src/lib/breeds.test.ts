import { describe, expect, it } from "vitest";
import { DOG_BREEDS, findBreed, searchBreeds } from "@/lib/breeds";

describe("사전 자체", () => {
  it("견종 이름이 중복되지 않는다", () => {
    const names = DOG_BREEDS.map((breed) => breed.name);

    expect(new Set(names).size).toBe(names.length);
  });

  it("믹스견은 크기를 단정하지 않는다 — 체형이 정해지지 않는다", () => {
    expect(DOG_BREEDS.find((breed) => breed.name === "믹스견")?.size).toBeUndefined();
  });
});

describe("findBreed", () => {
  it("이름이 정확히 맞으면 찾는다", () => {
    expect(findBreed("말티즈")?.size).toBe("소형견");
  });

  it("별칭·영문·공백·대소문자 차이를 흡수한다", () => {
    expect(findBreed("몰티즈")?.name).toBe("말티즈");
    expect(findBreed("Maltese")?.name).toBe("말티즈");
    expect(findBreed(" 말 티 즈 ")?.name).toBe("말티즈");
  });

  it("일부만 맞는 값은 찾지 않는다 — 크기 자동 채우기의 기준이라 엄격하게 본다", () => {
    expect(findBreed("말티")?.name).toBe("말티즈"); // 별칭에 등록된 줄임말은 통과
    expect(findBreed("말")).toBeNull();
  });

  it("빈 값이면 null", () => {
    expect(findBreed("")).toBeNull();
    expect(findBreed("   ")).toBeNull();
  });
});

describe("searchBreeds", () => {
  it("빈 질의에는 후보를 내지 않는다 — 입력 전부터 목록이 뜨면 안 된다", () => {
    expect(searchBreeds("")).toEqual([]);
    expect(searchBreeds("  ")).toEqual([]);
  });

  it("앞에서부터 맞는 견종을 중간에 포함된 것보다 앞에 둔다", () => {
    const names = searchBreeds("시").map((breed) => breed.name);

    // 시츄·시바견·시베리안허스키(앞에서 일치)가 웰시코기·달마시안(중간 포함)보다 먼저.
    expect(names.indexOf("시바견")).toBeLessThan(names.indexOf("웰시코기"));
    expect(names.indexOf("시베리안허스키")).toBeLessThan(names.indexOf("달마시안"));
  });

  it("이름으로 걸린 견종이 별칭으로만 걸린 견종보다 앞에 온다", () => {
    const names = searchBreeds("푸들").map((breed) => breed.name);

    // 말티푸는 이름이 아니라 별칭("말티푸들")으로 걸리므로 맨 뒤로 간다.
    expect(names[names.length - 1]).toBe("말티푸");
    expect(names.indexOf("토이푸들")).toBeLessThan(names.indexOf("말티푸"));
  });

  it("별칭으로도 찾을 수 있다", () => {
    expect(searchBreeds("maltese").map((breed) => breed.name)).toContain("말티즈");
  });

  it("후보 개수를 제한한다 — 입력칸 아래 목록이 화면을 덮지 않게", () => {
    expect(searchBreeds("리").length).toBeLessThanOrEqual(6);
    expect(searchBreeds("리", 2).length).toBeLessThanOrEqual(2);
  });

  it("목록에 없는 견종은 후보가 비어도 오류가 아니다 — 직접 입력을 막지 않는다", () => {
    expect(searchBreeds("존재하지않는견종")).toEqual([]);
  });
});
