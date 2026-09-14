import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PetSwitcher } from "@/components/my/PetSwitcher";
import { makePet } from "@/test/fixtures";

const twoPets = [makePet({ id: "a", name: "콩이" }), makePet({ id: "b", name: "두부" })];

describe("PetSwitcher", () => {
  it("반려동물이 없으면 아무것도 그리지 않는다", () => {
    const { container } = render(
      <PetSwitcher pets={[]} activeIndex={0} onSwitch={vi.fn()} onAddPet={vi.fn()} />
    );

    expect(container.innerHTML).toBe("");
  });

  it("한 마리면 고를 게 없으니 추가 버튼만 둔다", () => {
    render(
      <PetSwitcher pets={[twoPets[0]]} activeIndex={0} onSwitch={vi.fn()} onAddPet={vi.fn()} />
    );

    expect(screen.queryByRole("button", { name: /콩이/ })).toBeNull();
    expect(screen.getByRole("button", { name: "반려동물 추가" })).toBeTruthy();
  });

  it("두 마리 이상이면 활성 개체를 드롭다운으로 접어 둔다", async () => {
    const user = userEvent.setup();
    render(<PetSwitcher pets={twoPets} activeIndex={1} onSwitch={vi.fn()} onAddPet={vi.fn()} />);

    const trigger = screen.getByRole("button", { name: /두부/ });
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByRole("listbox")).toBeNull();

    await user.click(trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByRole("option", { name: /두부/ }).getAttribute("aria-selected")).toBe("true");
    expect(screen.getByRole("option", { name: /콩이/ }).getAttribute("aria-selected")).toBe("false");
  });

  it("목록에서 고르면 그 순번으로 전환하고 목록을 닫는다", async () => {
    const user = userEvent.setup();
    const onSwitch = vi.fn();
    render(<PetSwitcher pets={twoPets} activeIndex={0} onSwitch={onSwitch} onAddPet={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /콩이/ }));
    await user.click(screen.getByRole("option", { name: /두부/ }));

    expect(onSwitch).toHaveBeenCalledWith(1);
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("바깥을 누르면 목록이 닫힌다", async () => {
    const user = userEvent.setup();
    render(<PetSwitcher pets={twoPets} activeIndex={0} onSwitch={vi.fn()} onAddPet={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /콩이/ }));
    expect(screen.getByRole("listbox")).toBeTruthy();

    await user.click(document.body);
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("추가 버튼은 등록으로 보낸다", async () => {
    const user = userEvent.setup();
    const onAddPet = vi.fn();
    render(<PetSwitcher pets={twoPets} activeIndex={0} onSwitch={vi.fn()} onAddPet={onAddPet} />);

    await user.click(screen.getByRole("button", { name: "반려동물 추가" }));
    expect(onAddPet).toHaveBeenCalledTimes(1);
  });
});
