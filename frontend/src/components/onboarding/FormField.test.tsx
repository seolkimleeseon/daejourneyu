import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { FormField } from "@/components/onboarding/FormField";

describe("FormField", () => {
  it("라벨을 인풋에 묶어 라벨 텍스트로 찾을 수 있게 한다", async () => {
    const user = userEvent.setup();
    render(<FormField label="닉네임" />);

    const input = screen.getByLabelText("닉네임");
    await user.type(input, "콩이맘");

    expect((input as HTMLInputElement).value).toBe("콩이맘");
  });

  it("나머지 속성은 인풋에 그대로 넘긴다", () => {
    render(<FormField label="비밀번호" type="password" maxLength={20} placeholder="8자 이상" />);

    const input = screen.getByLabelText("비밀번호");
    expect(input.getAttribute("type")).toBe("password");
    expect(input.getAttribute("maxlength")).toBe("20");
    expect(input.getAttribute("placeholder")).toBe("8자 이상");
  });

  it("오류가 없으면 오류 문구도 없고 테두리도 평소 색이다", () => {
    const { container } = render(<FormField label="이메일" />);

    expect(screen.queryByText(/확인해주세요/)).toBeNull();
    expect(container.innerHTML).not.toContain("border-accent-coral");
  });

  it("오류가 있으면 문구를 띄우고 테두리를 강조한다", () => {
    const { container } = render(<FormField label="이메일" error="이메일 형식을 확인해주세요" />);

    expect(screen.getByText("이메일 형식을 확인해주세요")).toBeTruthy();
    expect(container.innerHTML).toContain("border-accent-coral");
  });

  it("단위 표기(suffix)를 입력 오른쪽에 붙인다", () => {
    render(<FormField label="몸무게" suffix="kg" />);

    expect(screen.getByText("kg")).toBeTruthy();
  });

  it("입력할 때마다 onChange로 값을 올려보낸다", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<FormField label="이름" onChange={onChange} value="" />);

    await user.type(screen.getByLabelText("이름"), "콩");

    expect(onChange).toHaveBeenCalled();
  });
});
