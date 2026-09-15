import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PetMbtiCard } from "@/components/onboarding/PetMbtiCard";
import { usePetStore } from "@/stores/usePetStore";
import { resolveMbtiType } from "@/lib/mbti";
import { makePet } from "@/test/fixtures";

const nav = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => nav }));

const QUIZ_HREF = "/schedule/course/new/mbti";
const enfp = resolveMbtiType("ENFP");

const kongi = makePet({
  id: "pet-1",
  name: "콩이",
  mbti: { code: "ENFP", name: enfp.name, theme: "산책", traits: enfp.traits },
});
const dubu = makePet({ id: "pet-2", name: "두부", mbti: undefined });

function modalOpen(text: string): boolean {
  return screen.getByText(text).closest(".fixed")?.className.includes("opacity-100") ?? false;
}

beforeEach(() => {
  vi.clearAllMocks();
  usePetStore.setState({ pets: [kongi, dubu], activePetIndex: 0, hydrated: true });
});

describe("PetMbtiCard", () => {
  it("검사한 적이 있으면 코드·유형명을 띄우고, 눌러야 설명·성향·테마를 보여준다", async () => {
    render(<PetMbtiCard pet={kongi} />);

    expect(screen.getByText("ENFP")).toBeTruthy();
    expect(modalOpen(enfp.desc)).toBe(false);

    await userEvent.setup().click(screen.getByRole("button", { name: /결과 보기/ }));

    expect(modalOpen(enfp.desc)).toBe(true);
    expect(screen.getByText(enfp.traits[0])).toBeTruthy();
    expect(screen.getByText("산책형")).toBeTruthy();
  });

  it("다시 검사하기는 MBTI 검사로 보낸다", async () => {
    const user = userEvent.setup();
    render(<PetMbtiCard pet={kongi} />);

    await user.click(screen.getByRole("button", { name: /결과 보기/ }));
    await user.click(screen.getByRole("button", { name: "🔄 다시 검사하기" }));

    expect(nav.push).toHaveBeenCalledWith(QUIZ_HREF);
  });

  it("아직 검사하지 않았으면 검사로 바로 보낸다", async () => {
    usePetStore.setState({ activePetIndex: 1 });
    render(<PetMbtiCard pet={dubu} />);

    await userEvent.setup().click(screen.getByRole("button", { name: /검사하기/ }));

    expect(nav.push).toHaveBeenCalledWith(QUIZ_HREF);
  });

  it("검사 결과는 대표 반려동물에 저장되므로, 다른 개체를 보고 있었다면 대표부터 바꾼다", async () => {
    // 대표는 콩이(0)인데 두부(1)를 수정하다 검사로 넘어가는 상황.
    render(<PetMbtiCard pet={dubu} />);

    await userEvent.setup().click(screen.getByRole("button", { name: /검사하기/ }));

    expect(usePetStore.getState().activePetIndex).toBe(1);
    expect(nav.push).toHaveBeenCalledWith(QUIZ_HREF);
  });
});
