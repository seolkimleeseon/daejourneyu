import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { QuestionCard } from "@/components/mbti/QuestionCard";
import { MBTI_QUESTIONS, type MbtiAnswer } from "@/lib/mbti";

const question = MBTI_QUESTIONS[0];

function setup(selected: MbtiAnswer = null) {
  const onSelect = vi.fn();
  render(<QuestionCard question={question} selected={selected} onSelect={onSelect} />);
  return { onSelect, user: userEvent.setup() };
}

function option(label: string): HTMLElement {
  return screen.getByText(label).closest("button")!;
}

describe("QuestionCard", () => {
  it("질문과 분류 태그를 보여준다", () => {
    setup();

    expect(screen.getByText(question.question)).toBeTruthy();
    expect(screen.getByText(question.tag)).toBeTruthy();
  });

  it("두 선택지를 설명과 함께 보여준다", () => {
    setup();

    expect(screen.getByText(question.optionA.label)).toBeTruthy();
    expect(screen.getByText(question.optionA.sub)).toBeTruthy();
    expect(screen.getByText(question.optionB.label)).toBeTruthy();
  });

  it("'반반이에요'를 항상 함께 둔다 — 억지로 한쪽을 고르게 하지 않는다", () => {
    setup();

    expect(screen.getByText("반반이에요")).toBeTruthy();
    expect(screen.getAllByRole("button")).toHaveLength(3);
  });

  it("고른 선택지의 글자를 올려보낸다", async () => {
    const { user, onSelect } = setup();

    await user.click(option(question.optionA.label));

    expect(onSelect).toHaveBeenCalledWith(question.optionA.letter);
  });

  it("반반이에요는 NEUTRAL로 보낸다 — 점수에 넣지 않는 답이다", async () => {
    const { user, onSelect } = setup();

    await user.click(option("반반이에요"));

    expect(onSelect).toHaveBeenCalledWith("NEUTRAL");
  });

  it("이미 고른 선택지를 강조한다", () => {
    setup(question.optionB.letter);

    expect(option(question.optionB.label).className).toContain("bg-brand-100");
    expect(option(question.optionA.label).className).not.toContain("bg-brand-100");
  });

  it("NEUTRAL을 고른 상태도 표시한다", () => {
    setup("NEUTRAL");

    expect(option("반반이에요").className).toContain("bg-brand-100");
  });

  it("아직 안 골랐으면 아무것도 강조하지 않는다 — 되돌아왔을 때 오해를 준다", () => {
    setup(null);

    screen.getAllByRole("button").forEach((button) => {
      expect(button.className).not.toContain("bg-brand-100");
    });
  });
});
