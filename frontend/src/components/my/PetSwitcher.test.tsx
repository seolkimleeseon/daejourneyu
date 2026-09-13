import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PetSwitcher } from "@/components/my/PetSwitcher";
import { makePet } from "@/test/fixtures";

describe("PetSwitcher", () => {
  it("반려동물이 없으면 아무것도 그리지 않는다", () => {
    const { container } = render(
      <PetSwitcher pets={[]} activeIndex={0} onSwitch={vi.fn()} onAddPet={vi.fn()} />
    );

    expect(container.innerHTML).toBe("");
  });

  it("반려동물마다 칩을 두고 활성 개체를 강조한다", () => {
    const pets = [makePet({ id: "a", name: "콩이" }), makePet({ id: "b", name: "두부" })];
    render(<PetSwitcher pets={pets} activeIndex={1} onSwitch={vi.fn()} onAddPet={vi.fn()} />);

    expect(screen.getByRole("button", { name: "두부" }).className).toContain("bg-brand");
    expect(screen.getByRole("button", { name: "콩이" }).className).not.toContain("bg-brand ");
  });

  it("칩을 누르면 그 순번으로 전환하고, 추가 칩은 등록으로 보낸다", async () => {
    const user = userEvent.setup();
    const onSwitch = vi.fn();
    const onAddPet = vi.fn();
    const pets = [makePet({ id: "a", name: "콩이" }), makePet({ id: "b", name: "두부" })];
    render(<PetSwitcher pets={pets} activeIndex={0} onSwitch={onSwitch} onAddPet={onAddPet} />);

    await user.click(screen.getByRole("button", { name: "두부" }));
    expect(onSwitch).toHaveBeenCalledWith(1);

    await user.click(screen.getByRole("button", { name: "+ 반려동물 추가" }));
    expect(onAddPet).toHaveBeenCalledTimes(1);
  });
});
