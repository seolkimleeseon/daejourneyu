import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MBTI_QUESTIONS } from "@/lib/mbti";
import { QuestionStep } from "./QuestionStep";

const handlers = { onSelect: vi.fn(), onBack: vi.fn(), onSkip: vi.fn() };

function setup(props: Partial<React.ComponentProps<typeof QuestionStep>> = {}) {
  const view = render(
    <QuestionStep
      question={MBTI_QUESTIONS[0]}
      index={0}
      total={MBTI_QUESTIONS.length}
      selected={null}
      canGoBack={false}
      {...handlers}
      {...props}
    />
  );
  return { ...view, user: userEvent.setup() };
}

/** 지나온 질문만 진하게 칠한 발자국 — 몇 개가 진한지가 곧 진행도다. */
function filledPaws(container: HTMLElement): number {
  return container.querySelectorAll("img.opacity-100").length;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("진행 표시", () => {
  it("몇 번째 질문인지 1부터 세어 보여준다", () => {
    setup({ index: 2 });

    expect(screen.getByText("질문 3 / 12")).toBeTruthy();
  });

  it("질문 수만큼 발자국을 두고 지나온 만큼만 채운다", () => {
    const { container } = setup({ index: 3 });

    expect(container.querySelectorAll("img.opacity-100, img.opacity-20")).toHaveLength(12);
    expect(filledPaws(container)).toBe(3);
  });

  it("첫 질문에서는 하나도 채우지 않는다", () => {
    const { container } = setup({ index: 0 });

    expect(filledPaws(container)).toBe(0);
  });
});

describe("질문 카드", () => {
  it("받은 질문의 문구와 두 선택지를 그대로 넘긴다", () => {
    setup();

    expect(screen.getByText(MBTI_QUESTIONS[0].question)).toBeTruthy();
    expect(screen.getByText(MBTI_QUESTIONS[0].optionA.label)).toBeTruthy();
    expect(screen.getByText(MBTI_QUESTIONS[0].optionB.label)).toBeTruthy();
  });

  it("선택지를 고르면 그 축 글자로 알린다", async () => {
    const { user } = setup();

    await user.click(screen.getByText(MBTI_QUESTIONS[0].optionB.label));

    expect(handlers.onSelect).toHaveBeenCalledWith(MBTI_QUESTIONS[0].optionB.letter);
  });
});

describe("앞뒤 이동", () => {
  it("첫 질문이면 이전으로 가는 길을 두지 않는다", () => {
    setup({ canGoBack: false });

    expect(screen.queryByRole("button", { name: /이전 질문/ })).toBeNull();
  });

  it("돌아갈 수 있으면 이전 질문 버튼을 둔다", async () => {
    const { user } = setup({ canGoBack: true });

    await user.click(screen.getByRole("button", { name: /이전 질문/ }));

    expect(handlers.onBack).toHaveBeenCalledTimes(1);
  });

  it("답을 못 고르겠으면 이 질문만 건너뛸 수 있다", async () => {
    const { user } = setup();

    await user.click(screen.getByRole("button", { name: /건너뛰기/ }));

    expect(handlers.onSkip).toHaveBeenCalledTimes(1);
  });
});
