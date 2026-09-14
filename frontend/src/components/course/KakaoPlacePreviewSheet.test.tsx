import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { KakaoPlacePreviewSheet } from "@/components/course/KakaoPlacePreviewSheet";
import type { CourseStop } from "@/types";
import { makeStop } from "@/test/fixtures";

/**
 * 지도는 카카오 SDK가 있어야 그려진다 — 이 시트가 확인할 건 "그 장소 하나만 지도에 넘기는가"라서
 * 받은 stops만 드러내는 자리표시자로 바꿔 둔다.
 */
const map = vi.hoisted(() => ({ render: vi.fn() }));
vi.mock("@/components/course/CourseRouteMap", () => ({
  CourseRouteMap: (props: { stops: CourseStop[] }) => {
    map.render(props.stops);
    return <div data-testid="route-map" />;
  },
}));

const onClose = vi.fn();

const stop = makeStop({
  placeId: "kakao-1",
  name: "댕댕카페",
  category: "맛집",
  district: "유성구",
  condition: "카카오맵 검색 결과 · 반려동물 동반 가능 여부는 방문 전 확인해주세요",
  placeUrl: "https://place.map.kakao.com/1",
});

function setup(target: CourseStop | null = stop) {
  const view = render(<KakaoPlacePreviewSheet stop={target} onClose={onClose} />);
  return { ...view, user: userEvent.setup() };
}

/** BottomSheet는 닫혀 있어도 DOM에 남는다 — 열림 여부는 오버레이 불투명도로 본다. */
function isOpen(container: HTMLElement): boolean {
  return container.querySelector(".fixed.inset-0")!.className.includes("opacity-100");
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("열림 여부", () => {
  it("장소가 없으면 닫아 둔다", () => {
    const { container } = setup(null);

    expect(isOpen(container)).toBe(false);
    expect(screen.queryByTestId("route-map")).toBeNull();
  });

  it("장소를 받으면 그 이름을 제목으로 연다", () => {
    const { container } = setup();

    expect(isOpen(container)).toBe(true);
    expect(screen.getByText("댕댕카페")).toBeTruthy();
  });

  it("바깥을 누르면 닫아 달라고 알린다", async () => {
    const { container, user } = setup();

    await user.click(container.querySelector(".fixed.inset-0") as HTMLElement);

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe("장소 정보", () => {
  it("분류와 구를 태그로 보여준다", () => {
    setup();

    expect(screen.getByText("맛집")).toBeTruthy();
    expect(screen.getByText("유성구")).toBeTruthy();
  });

  it("조건 문구에서 출처만 뽑고, 확인이 필요하다는 건 따로 적는다", () => {
    setup();

    expect(screen.getByText("🌐 카카오맵 검색 결과")).toBeTruthy();
    expect(screen.getByText("🔍 동반 가능 여부 확인 필요")).toBeTruthy();
    // 원문의 뒷부분(안내문)을 그대로 늘어놓지 않는다.
    expect(screen.queryByText(/방문 전 확인해주세요$/)).toBeNull();
  });

  it("후기를 못 보여주는 이유를 밝힌다 — 빈 자리로 두지 않는다", () => {
    setup();

    expect(screen.getByText(/후기·평점은 이 화면에서 못 보여드려요/)).toBeTruthy();
  });

  it("지도에는 이 장소 하나만 넘긴다", () => {
    setup();

    expect(map.render).toHaveBeenLastCalledWith([stop]);
  });
});

describe("카카오맵 원본", () => {
  it("원본 링크가 있으면 새 탭으로 연다", async () => {
    const open = vi.fn();
    vi.stubGlobal("open", open);
    const { user } = setup();

    await user.click(screen.getByRole("button", { name: /카카오맵에서 자세히 보기/ }));

    expect(open).toHaveBeenCalledWith("https://place.map.kakao.com/1", "_blank", "noopener,noreferrer");
    vi.unstubAllGlobals();
  });

  it("원본 링크가 없으면 버튼을 아예 두지 않는다 — 눌러도 갈 곳이 없다", () => {
    setup(makeStop({ placeUrl: null }));

    expect(screen.queryByRole("button", { name: /카카오맵에서 자세히 보기/ })).toBeNull();
  });
});
