import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { Breed } from "@/lib/breeds";
import { BreedField } from "@/components/onboarding/BreedField";

/**
 * 값을 제어하는 컴포넌트라 부모가 state를 들고 있어야 후보가 뜬다 —
 * onChange를 mock으로만 두면 value가 ""에 머물러 검색 결과가 늘 빈 배열이다.
 */
function Harness({
  onChange,
  onSelectBreed,
  error,
}: {
  onChange: (value: string) => void;
  onSelectBreed: (breed: Breed) => void;
  error?: string;
}) {
  const [value, setValue] = useState("");
  return (
    <BreedField
      value={value}
      onChange={(next) => {
        setValue(next);
        onChange(next);
      }}
      onSelectBreed={onSelectBreed}
      error={error}
    />
  );
}

function setup() {
  const onChange = vi.fn();
  const onSelectBreed = vi.fn();
  render(<Harness onChange={onChange} onSelectBreed={onSelectBreed} />);
  return { onChange, onSelectBreed, user: userEvent.setup() };
}

describe("BreedField", () => {
  it("입력 전에는 후보 목록이 없다", () => {
    setup();

    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("타이핑하면 후보를 띄운다", async () => {
    const { user, onChange } = setup();

    await user.type(screen.getByLabelText("견종"), "말티");

    expect(onChange).toHaveBeenCalled();
    expect(screen.getByRole("listbox")).toBeTruthy();
    expect(screen.getByRole("option", { name: /말티즈/ })).toBeTruthy();
  });

  it("후보에 크기를 함께 보여준다 — 선택 결과가 예측되게", async () => {
    const { user } = setup();

    await user.type(screen.getByLabelText("견종"), "말티즈");

    expect(screen.getByRole("option", { name: /소형견/ })).toBeTruthy();
  });

  it("후보를 고르면 이름을 채우고 크기까지 올려보낸 뒤 목록을 닫는다", async () => {
    const { user, onChange, onSelectBreed } = setup();

    await user.type(screen.getByLabelText("견종"), "말티");
    await user.click(screen.getByRole("option", { name: /말티즈/ }));

    expect(onChange).toHaveBeenLastCalledWith("말티즈");
    expect(onSelectBreed).toHaveBeenCalledWith(expect.objectContaining({ name: "말티즈" }));
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("방향키로 옮기고 Enter로 고른다", async () => {
    const { user, onSelectBreed } = setup();
    const input = screen.getByLabelText("견종");

    await user.type(input, "푸들");
    const before = screen.getAllByRole("option").map((option) => option.textContent);
    await user.keyboard("{ArrowDown}{Enter}");

    expect(onSelectBreed).toHaveBeenCalledTimes(1);
    expect(before[1]).toContain(onSelectBreed.mock.calls[0][0].name);
  });

  it("Enter는 폼 제출로 새지 않는다", async () => {
    const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault());
    const onSelectBreed = vi.fn();
    render(
      <form onSubmit={onSubmit}>
        <Harness onChange={vi.fn()} onSelectBreed={onSelectBreed} />
      </form>
    );
    const user = userEvent.setup();

    await user.type(screen.getByLabelText("견종"), "말티{Enter}");

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("Escape로 후보를 닫는다", async () => {
    const { user } = setup();

    await user.type(screen.getByLabelText("견종"), "말티");
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("목록에 없는 견종은 후보만 비고 입력은 막지 않는다", async () => {
    const { user, onChange } = setup();

    await user.type(screen.getByLabelText("견종"), "우리동네믹스");

    expect(screen.queryByRole("listbox")).toBeNull();
    expect(onChange).toHaveBeenCalled();
    expect(screen.getByText("목록에 없으면 직접 입력해도 괜찮아요.")).toBeTruthy();
  });

  it("오류 문구는 입력칸에 그대로 전달한다", () => {
    render(
      <BreedField
        value=""
        onChange={vi.fn()}
        onSelectBreed={vi.fn()}
        error="견종을 입력해주세요"
      />
    );

    expect(screen.getByText("견종을 입력해주세요")).toBeTruthy();
  });
});
