import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { IntroStep } from "./IntroStep";

describe("IntroStep", () => {
  it("무엇을 하는 테스트인지 제목으로 밝힌다", () => {
    render(<IntroStep onStart={vi.fn()} />);

    expect(screen.getByText(/여행 MBTI는\?/)).toBeTruthy();
    expect(screen.getByText(/대전 맞춤 코스 테마까지/)).toBeTruthy();
  });

  it("시작 전에 분량을 먼저 알려준다 — 몇 문항인지 모르면 들어오기 부담스럽다", () => {
    render(<IntroStep onStart={vi.fn()} />);

    expect(screen.getByText("질문 12개")).toBeTruthy();
    expect(screen.getByText("16가지 유형")).toBeTruthy();
    expect(screen.getByText("약 1분")).toBeTruthy();
  });

  it("시작 버튼이 다음 단계를 연다", async () => {
    const onStart = vi.fn();
    const user = userEvent.setup();
    render(<IntroStep onStart={onStart} />);

    await user.click(screen.getByRole("button", { name: "테스트 시작하기" }));

    expect(onStart).toHaveBeenCalledTimes(1);
  });
});
