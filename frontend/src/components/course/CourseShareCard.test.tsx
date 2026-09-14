import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CourseShareCard } from "@/components/course/CourseShareCard";
import { makePlace } from "@/test/fixtures";

const 한밭수목원 = makePlace({ id: "a", name: "한밭수목원", district: "서구", category: "산책" });
const 장태산 = makePlace({ id: "b", name: "장태산자연휴양림", district: "서구", category: "산책" });
const 댕댕카페 = makePlace({ id: "c", name: "댕댕카페", district: "유성구", category: "맛집" });

function setup(props: Partial<React.ComponentProps<typeof CourseShareCard>> = {}) {
  return render(
    <CourseShareCard title="유성 산책 코스" tags={[]} days={[[한밭수목원]]} {...props} />
  );
}

describe("헤더", () => {
  it("코스 이름과 브랜드 워드마크를 얹는다", () => {
    setup();

    expect(screen.getByText("유성 산책 코스")).toBeTruthy();
    expect(screen.getByText(/DAEJOURNEYU/)).toBeTruthy();
  });

  it("하루짜리는 당일치기로 요약한다", () => {
    setup({ days: [[한밭수목원, 장태산]] });

    expect(screen.getByText("당일치기 · 2곳")).toBeTruthy();
  });

  it("이틀이면 1박 2일 — 일차 수에서 박 수를 끌어낸다", () => {
    setup({ days: [[한밭수목원], [장태산, 댕댕카페]] });

    expect(screen.getByText("1박 2일 · 3곳")).toBeTruthy();
  });

  it("일차가 비어 있어도 곳 수를 0으로 센다", () => {
    setup({ days: [[]] });

    expect(screen.getByText("당일치기 · 0곳")).toBeTruthy();
  });

  it("받은 뱃지를 그대로 단다", () => {
    setup({ tags: ["☀️ 당일치기", "🚗 자차"] });

    expect(screen.getByText("☀️ 당일치기")).toBeTruthy();
    expect(screen.getByText("🚗 자차")).toBeTruthy();
  });
});

describe("동선 표", () => {
  it("하루짜리면 일차 머리글을 붙이지 않는다 — 한 줄뿐인데 '1일차'는 군더더기다", () => {
    setup({ days: [[한밭수목원]] });

    expect(screen.queryByText("1일차")).toBeNull();
  });

  it("여러 날이면 일차마다 머리글을 붙인다", () => {
    setup({ days: [[한밭수목원], [장태산]] });

    expect(screen.getByText("1일차")).toBeTruthy();
    expect(screen.getByText("2일차")).toBeTruthy();
  });

  it("순번은 날마다 1부터 다시 센다 — 이어 세면 둘째 날이 3번부터 시작한다", () => {
    setup({ days: [[한밭수목원, 장태산], [댕댕카페]] });

    expect(screen.getAllByText("1")).toHaveLength(2);
    expect(screen.queryByText("3")).toBeNull();
  });

  it("장소마다 이름과 구·분류를 같이 적는다", () => {
    setup({ days: [[댕댕카페]] });

    expect(screen.getByText("댕댕카페")).toBeTruthy();
    expect(screen.getByText("유성구 · 맛집")).toBeTruthy();
  });

  it("만든 곳을 밝히는 꼬리말을 남긴다", () => {
    setup();

    expect(screen.getByText(/대저니유에서 만든/)).toBeTruthy();
  });
});
