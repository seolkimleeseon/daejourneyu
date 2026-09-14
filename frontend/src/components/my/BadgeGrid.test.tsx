import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { BadgeGrid } from "@/components/my/BadgeGrid";
import type { BadgeId } from "@/lib/badges";
import { makeBadge } from "@/test/fixtures";

const IDS: BadgeId[] = [
  "dj-full-round",
  "landmark-gapcheon",
  "landmark-gyejoksan",
  "landmark-ppurigongwon",
  "landmark-jangtaesan",
  "landmark-sikjangsan",
  "one-day-expedition",
  "even-traveler",
  "traveler",
  "course-maker",
  "collector",
  "popular-course",
  "night-walker",
];

function gotBadge(index: number) {
  return makeBadge({
    id: IDS[index],
    name: `획득${index + 1}`,
    got: true,
    level: 1,
    maxLevel: 1,
    current: 1,
    target: 1,
    tileLabel: "완료",
  });
}

function tileNames(): string[] {
  return Array.from(document.querySelectorAll(".grid > div")).map(
    (tile) => tile.children[1]?.textContent ?? ""
  );
}

describe("BadgeGrid", () => {
  it("반려동물 이름을 주어로, 모은 수/전체 수를 헤더에 보여준다", () => {
    render(
      <BadgeGrid badges={[gotBadge(0), makeBadge({ id: IDS[8] })]} petName="콩이" onOpenAll={vi.fn()} />
    );

    expect(screen.getByText("콩이의 여행 뱃지")).toBeTruthy();
    expect(screen.getByText("1/2")).toBeTruthy();
  });

  it("반려동물 이름이 없으면 '내 여행 뱃지'", () => {
    render(<BadgeGrid badges={[makeBadge()]} onOpenAll={vi.fn()} />);

    expect(screen.getByText("내 여행 뱃지")).toBeTruthy();
  });

  it("8칸 중 획득분은 최대 6칸, 나머지는 목표에 가까운 미획득분으로 채우고 히든은 내세우지 않는다", () => {
    const got = Array.from({ length: 8 }, (_, index) => gotBadge(index));
    const pending = [
      makeBadge({ id: IDS[8], name: "먼 뱃지", current: 1, target: 10, tileLabel: "1/10" }),
      makeBadge({ id: IDS[9], name: "가까운 뱃지", current: 4, target: 5, tileLabel: "4/5" }),
      makeBadge({ id: IDS[10], name: "중간 뱃지", current: 3, target: 5, tileLabel: "3/5" }),
      makeBadge({ id: IDS[11], name: "시작 전 뱃지", current: 0, target: 3, tileLabel: "0/3" }),
      makeBadge({ id: IDS[12], name: "비밀 뱃지", hidden: true, current: 0, target: 1 }),
    ];

    render(<BadgeGrid badges={[...got, ...pending]} onOpenAll={vi.fn()} />);

    expect(tileNames()).toEqual([
      "획득1",
      "획득2",
      "획득3",
      "획득4",
      "획득5",
      "획득6",
      "가까운 뱃지",
      "중간 뱃지",
    ]);
    expect(screen.queryByText("비밀 뱃지")).toBeNull();
    expect(screen.getByText("4/5")).toBeTruthy();
  });

  it("미획득분이 모자라면 남는 칸을 획득분으로 채운다", () => {
    const got = Array.from({ length: 8 }, (_, index) => gotBadge(index));

    render(<BadgeGrid badges={got} onOpenAll={vi.fn()} />);

    expect(tileNames()).toHaveLength(8);
  });

  it("딴 히든 뱃지는 이름을 드러내고, 모두 모으면 축하 문구를 띄운다", () => {
    const hiddenGot = makeBadge({
      id: "night-walker",
      name: "야행성 산책러",
      hidden: true,
      got: true,
      level: 1,
      current: 1,
      tileLabel: "조건 비공개",
    });

    render(<BadgeGrid badges={[hiddenGot]} onOpenAll={vi.fn()} />);

    expect(screen.getByText("야행성 산책러")).toBeTruthy();
    expect(screen.getByText("🎉 뱃지를 모두 모았어요!")).toBeTruthy();
  });

  it("헤더와 타일 사이에 남은 거리 줄을 끼우고, 전체 보기를 누르면 알린다", async () => {
    const onOpenAll = vi.fn();
    render(
      <BadgeGrid badges={[makeBadge()]} nearline={<p>하나만 더</p>} onOpenAll={onOpenAll} />
    );

    expect(screen.getByText("하나만 더")).toBeTruthy();
    await userEvent.setup().click(screen.getByRole("button", { name: "전체 보기 ›" }));
    expect(onOpenAll).toHaveBeenCalledTimes(1);
  });
});
