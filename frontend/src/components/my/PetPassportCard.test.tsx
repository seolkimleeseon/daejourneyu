import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PetPassportCard } from "@/components/my/PetPassportCard";
import { makePet } from "@/test/fixtures";
import { icon3D } from "@/test/icon3d";

describe("PetPassportCard", () => {
  it("세션 복구 전에는 로그인 여부를 단정하지 않고 불러오는 중으로 보여준다", () => {
    render(<PetPassportCard pet={null} isLoggedIn={false} loading onClick={vi.fn()} />);

    expect(screen.getByText("불러오는 중…")).toBeTruthy();
    expect(screen.queryByText("로그인이 필요해요")).toBeNull();
  });

  it("비로그인이면 로그인 안내를 보여준다", () => {
    render(<PetPassportCard pet={null} isLoggedIn={false} onClick={vi.fn()} />);

    expect(screen.getByText("로그인이 필요해요")).toBeTruthy();
  });

  it("로그인했지만 반려동물이 없으면 등록 안내를 보여준다", () => {
    render(<PetPassportCard pet={null} isLoggedIn onClick={vi.fn()} />);

    expect(screen.getByText("반려동물 미등록")).toBeTruthy();
    expect(icon3D("paw_prints_3d.png")).toBeTruthy();
  });

  it("반려동물 정보를 여권 줄로 보여주고, MBTI가 없으면 미검사로 표시한다", () => {
    const pet = makePet({ name: "콩이", breed: "말티즈", weightKg: 3.2, ageYears: 4, emoji: "🐩" });
    const { rerender } = render(<PetPassportCard pet={pet} isLoggedIn onClick={vi.fn()} />);

    expect(screen.getByText("콩이")).toBeTruthy();
    expect(screen.getByText("말티즈")).toBeTruthy();
    expect(screen.getByText("3.2kg · 4살")).toBeTruthy();
    expect(screen.getByText("미검사")).toBeTruthy();
    expect(icon3D("poodle_3d.png")).toBeTruthy();

    rerender(
      <PetPassportCard
        pet={{ ...pet, mbti: { code: "ENFP", name: "유형", theme: "산책", traits: [] } }}
        isLoggedIn
        onClick={vi.fn()}
      />
    );
    expect(screen.getByText("ENFP")).toBeTruthy();
  });

  it("카드 전체가 버튼이다", async () => {
    const onClick = vi.fn();
    render(<PetPassportCard pet={null} isLoggedIn={false} onClick={onClick} />);

    await userEvent.setup().click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
