import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { BadgeNearline } from "@/components/my/BadgeNearline";
import { makeBadge } from "@/test/fixtures";

describe("BadgeNearline", () => {
  it("코앞인 뱃지가 없으면 줄 자체를 숨긴다", () => {
    const { container } = render(<BadgeNearline badge={null} message="" onGo={vi.fn()} />);

    expect(container.innerHTML).toBe("");
  });

  it("문장을 보여주고, 갈 곳이 있으면 그 화면으로 보낸다", async () => {
    const onGo = vi.fn();
    const badge = makeBadge({ id: "dj-full-round", emoji: "🐾", href: "/map" });
    render(<BadgeNearline badge={badge} message="중구만 가면 대전 한바퀴 완성" onGo={onGo} />);

    expect(screen.getByText("중구만 가면 대전 한바퀴 완성")).toBeTruthy();

    await userEvent.setup().click(screen.getByRole("button", { name: "보러 가기 ›" }));
    expect(onGo).toHaveBeenCalledWith("/map");
  });

  it("갈 곳이 없는 뱃지는 버튼 없이 문장만 둔다", () => {
    render(<BadgeNearline badge={makeBadge({ href: undefined })} message="하나 남았어요" onGo={vi.fn()} />);

    expect(screen.getByText("하나 남았어요")).toBeTruthy();
    expect(screen.queryByRole("button")).toBeNull();
  });
});
