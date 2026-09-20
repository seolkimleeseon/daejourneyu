import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Badge } from "@/lib/badges";
import { makeBadge } from "@/test/fixtures";
import { icon3D } from "@/test/icon3d";
import MyBadgesPage from "./page";

const nav = vi.hoisted(() => ({ push: vi.fn(), back: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => nav }));

const hooks = vi.hoisted(() => ({ useMyBadges: vi.fn() }));
vi.mock("@/hooks/useMyBadges", () => ({ useMyBadges: hooks.useMyBadges }));

const maxed = makeBadge({
  id: "dj-full-round",
  emoji: "🐾",
  name: "대전 한바퀴",
  category: "발도장",
  rarity: 3,
  description: "5개 구 완주",
  earned: "대전 5개 구를 모두 다녀왔어요",
  how: "대전 5개 구를 모두 다녀오면 도장판이 완성돼요",
  got: true,
  level: 1,
  maxLevel: 1,
  current: 5,
  target: 5,
  href: "/map",
});

const leveling = makeBadge({
  id: "review-king",
  emoji: "✍️",
  name: "후기왕 Lv.2",
  category: "단계형",
  description: "쓴 후기",
  earned: "다녀온 장소에 후기를 10개 남겼어요",
  how: "다녀온 장소에 후기를 남기면 쌓여요",
  got: true,
  level: 2,
  maxLevel: 3,
  current: 10,
  target: 30,
  href: "/my/reviews",
});

const notStarted = makeBadge({
  id: "traveler",
  emoji: "🧳",
  name: "여행러 Lv.1",
  category: "단계형",
  how: "코스에 날짜를 붙여 다녀오면 쌓여요",
  level: 0,
  maxLevel: 5,
  current: 0,
  target: 1,
  href: "/schedule",
});

const secret = makeBadge({
  id: "night-walker",
  emoji: "🌙",
  name: "야행성 산책러",
  category: "히든",
  rarity: 4,
  how: "조건은 비밀이에요",
  hidden: true,
});

function mockBadges(badges: Badge[]) {
  const got = badges.filter((badge) => badge.got);
  hooks.useMyBadges.mockReturnValue({
    badges,
    got,
    gotCount: got.length,
    total: badges.length,
    nearest: null,
    nearestMessage: "",
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockBadges([maxed, leveling, notStarted, secret]);
});

describe("여행 뱃지 전체 목록", () => {
  it("모은 수/전체 수와 진행 바를 보여준다", () => {
    const { container } = render(<MyBadgesPage />);

    expect(screen.getByText("모은 뱃지").parentElement?.textContent).toContain("2 / 4");
    const bar = container.querySelector(".transition-\\[width\\]") as HTMLElement;
    expect(bar.style.width).toBe("50%");
  });

  it("뱃지가 있는 계열만 카탈로그 순서대로 섹션을 나누고 계열별 획득 수를 단다", () => {
    const { container } = render(<MyBadgesPage />);

    const headers = Array.from(container.querySelectorAll("section")).map(
      (section) => section.firstElementChild?.textContent
    );
    expect(headers).toEqual(["발도장1/1", "단계형1/2", "히든0/1"]);
  });

  it("만렙 뱃지는 획득 표시만 두고 누를 수 없다", () => {
    render(<MyBadgesPage />);

    expect(screen.getByText("대전 한바퀴").closest("button")).toBeNull();
    expect(screen.getByText("대전 5개 구를 모두 다녀왔어요")).toBeTruthy();
    expect(screen.getByText("획득")).toBeTruthy();
  });

  it("단계형은 딴 뒤에도 다음 단계까지의 거리를 말하고 해당 화면으로 보낸다", async () => {
    render(<MyBadgesPage />);

    expect(screen.getByText("다녀온 장소에 후기를 10개 남겼어요")).toBeTruthy();
    expect(screen.getByText("Lv.3까지 20개 더")).toBeTruthy();
    expect(screen.getByText("10/30")).toBeTruthy();

    await userEvent.setup().click(screen.getByRole("button", { name: /후기왕 Lv\.2/ }));
    expect(nav.push).toHaveBeenCalledWith("/my/reviews");
  });

  it("아직 못 딴 뱃지는 획득 조건과 '보러 가기'를 보여준다", async () => {
    render(<MyBadgesPage />);
    const row = screen.getByRole("button", { name: /여행러 Lv\.1/ });

    expect(row.textContent).toContain("코스에 날짜를 붙여 다녀오면 쌓여요");
    expect(row.textContent).toContain("보러 가기 ›");

    await userEvent.setup().click(row);
    expect(nav.push).toHaveBeenCalledWith("/schedule");
  });

  it("못 딴 히든 뱃지는 이름·이모지를 가린다", () => {
    render(<MyBadgesPage />);

    expect(screen.queryByText("야행성 산책러")).toBeNull();
    expect(icon3D("crescent_moon_3d.png")).toBeNull();
    expect(screen.getByText("???")).toBeTruthy();
    expect(icon3D("white_question_mark_3d.png")).toBeTruthy();
  });

  it("딴 히든 뱃지는 이름을 드러낸다", () => {
    mockBadges([{ ...secret, got: true, level: 1, current: 1 }]);
    render(<MyBadgesPage />);

    expect(screen.getByText("야행성 산책러")).toBeTruthy();
    expect(screen.queryByText("???")).toBeNull();
  });
});
