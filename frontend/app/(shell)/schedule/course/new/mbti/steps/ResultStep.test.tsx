import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MBTI_TYPES } from "@/lib/mbti";
import { ResultStep } from "./ResultStep";

/** 공유 액션은 자체 테스트가 있다 — 여기선 결과 화면이 무엇을 넘기는지만 들여다본다. */
const share = vi.hoisted(() => ({ render: vi.fn() }));
vi.mock("@/components/course/ResultShareActions", () => ({
  ResultShareActions: (props: Record<string, unknown>) => {
    share.render(props);
    return <div data-testid="share-actions" />;
  },
}));

const onContinue = vi.fn();
const onRetake = vi.fn();

function setup(code = "ENFP") {
  const view = render(<ResultStep code={code} onContinue={onContinue} onRetake={onRetake} />);
  return { ...view, user: userEvent.setup() };
}

/** 테마 막대를 위에서부터 "{테마}형 {매칭도}" 순서로 읽는다. */
function themeRows(container: HTMLElement): string[] {
  return Array.from(container.querySelectorAll(".rounded-lg.border.border-line .flex-1:not(.ml-auto)")).map(
    (row) => row.textContent ?? ""
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("유형 카드", () => {
  it("코드와 이름·설명을 함께 보여준다 — 코드만으론 무슨 성향인지 모른다", () => {
    setup("ENFP");
    const type = MBTI_TYPES.ENFP;

    expect(screen.getByText("ENFP")).toBeTruthy();
    expect(screen.getByText(type.name)).toBeTruthy();
    expect(screen.getByText(type.desc)).toBeTruthy();
  });

  it("성향 키워드를 칩으로 단다", () => {
    setup("ENFP");

    MBTI_TYPES.ENFP.traits.forEach((trait) => {
      expect(screen.getByText(trait)).toBeTruthy();
    });
  });

  it("모르는 코드가 와도 빈 화면으로 두지 않는다", () => {
    setup("XXXX");

    expect(screen.getByText(MBTI_TYPES.ISFJ.name)).toBeTruthy();
  });
});

describe("맞춤 코스 테마", () => {
  it("매칭도가 높은 테마부터 세운다", () => {
    const { container } = setup("ESFP");

    // ESFP는 맛집 50 · 산책 30 · 문화 20.
    expect(themeRows(container)).toEqual(["맛집형50% 매칭", "산책형30% 매칭", "문화형20% 매칭"]);
  });

  it("세 테마를 빠짐없이 보여준다 — 1등만 보여주면 왜 그 코스인지 가늠이 안 된다", () => {
    const { container } = setup("ISTJ");

    expect(themeRows(container)).toHaveLength(3);
  });
});

describe("다음 행동", () => {
  it("코스 만들기는 1등 테마를 들고 넘어간다", async () => {
    const { user } = setup("ESFP");

    await user.click(screen.getByRole("button", { name: "이 성향으로 코스 만들기" }));

    expect(onContinue).toHaveBeenCalledWith("맛집");
  });

  it("다시 검사하기로 처음으로 돌아간다", async () => {
    const { user } = setup();

    await user.click(screen.getByRole("button", { name: /다시 검사하기/ }));

    expect(onRetake).toHaveBeenCalledTimes(1);
  });

  it("공유 문구에 내 유형을 담는다 — 링크만 보면 누구 결과인지 모른다", () => {
    setup("ENFP");

    expect(share.render).toHaveBeenLastCalledWith(
      expect.objectContaining({
        fileName: "대저니유-MBTI결과",
        kakaoTitle: `나는 ENFP · ${MBTI_TYPES.ENFP.name}!`,
      })
    );
  });

  it("공유용으로 캡처할 곳은 결과 카드다 — 버튼까지 같이 찍히면 안 된다", () => {
    setup();
    const captureRef = share.render.mock.lastCall?.[0].captureRef as { current: HTMLElement };

    expect(captureRef.current.textContent).toContain("대저니유 · 반려동물 여행 MBTI");
    expect(captureRef.current.textContent).not.toContain("다시 검사하기");
  });
});
