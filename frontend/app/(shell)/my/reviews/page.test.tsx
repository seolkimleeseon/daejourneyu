import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeReview } from "@/test/fixtures";
import { useToastStore } from "@/stores/useToastStore";
import MyReviewsPage from "./page";

const nav = vi.hoisted(() => ({ push: vi.fn(), back: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => nav }));

const hooks = vi.hoisted(() => ({ useReviews: vi.fn(), mutateAsync: vi.fn() }));
vi.mock("@/hooks/useReviews", () => ({
  useReviews: hooks.useReviews,
  useDeleteReview: () => ({ mutateAsync: hooks.mutateAsync, isPending: false }),
}));

/** 한 페이지 4개를 넘겨 페이저가 나오도록 5개를 만든다. */
const myReviews = Array.from({ length: 5 }, (_, index) =>
  makeReview({ id: `mine-${index}`, placeName: `내 장소 ${index}`, text: `후기 ${index}` })
);

beforeEach(() => {
  vi.clearAllMocks();
  hooks.useReviews.mockReturnValue({ data: myReviews, isLoading: false });
  useToastStore.setState({ message: null });
});

describe("내가 쓴 후기", () => {
  it("불러오는 중에는 안내 문구만 둔다", () => {
    hooks.useReviews.mockReturnValue({ data: undefined, isLoading: true });
    render(<MyReviewsPage />);

    expect(screen.getByText("불러오는 중…")).toBeTruthy();
  });

  it("내가 쓴 후기가 없으면 빈 상태를 안내한다", () => {
    hooks.useReviews.mockReturnValue({
      data: [makeReview({ id: "other", isMine: false })],
      isLoading: false,
    });
    render(<MyReviewsPage />);

    expect(screen.getByText(/아직 작성한 후기가 없어요/)).toBeTruthy();
    expect(screen.queryByRole("navigation", { name: "페이지" })).toBeNull();
  });

  it("한 페이지에 4개까지만 두고 나머지는 다음 페이지로 넘긴다", async () => {
    const user = userEvent.setup();
    render(<MyReviewsPage />);

    expect(screen.getAllByRole("button", { name: "이 후기 삭제" })).toHaveLength(4);
    expect(screen.queryByText("내 장소 4")).toBeNull();

    await user.click(screen.getByRole("button", { name: "2페이지" }));
    expect(screen.getByText("내 장소 4")).toBeTruthy();
    expect(screen.queryByText("내 장소 0")).toBeNull();
  });

  it("삭제는 확인 모달을 거친 뒤 실행하고 토스트로 알린다", async () => {
    const user = userEvent.setup();
    hooks.mutateAsync.mockResolvedValue(undefined);
    render(<MyReviewsPage />);

    await user.click(screen.getAllByRole("button", { name: "이 후기 삭제" })[0]);
    await user.click(screen.getByRole("button", { name: "삭제하기" }));

    expect(hooks.mutateAsync).toHaveBeenCalledWith("mine-0");
    expect(useToastStore.getState().message).toBe("후기를 삭제했어요");
  });

  it("삭제에 실패하면 실패 토스트를 띄운다", async () => {
    const user = userEvent.setup();
    hooks.mutateAsync.mockRejectedValue(new Error("network"));
    render(<MyReviewsPage />);

    await user.click(screen.getAllByRole("button", { name: "이 후기 삭제" })[0]);
    await user.click(screen.getByRole("button", { name: "삭제하기" }));

    expect(useToastStore.getState().message).toContain("삭제하지 못했어요");
  });

  it("취소하면 삭제를 부르지 않는다", async () => {
    const user = userEvent.setup();
    render(<MyReviewsPage />);

    await user.click(screen.getAllByRole("button", { name: "이 후기 삭제" })[0]);
    await user.click(screen.getByRole("button", { name: "취소" }));

    expect(hooks.mutateAsync).not.toHaveBeenCalled();
  });

  it("마지막 페이지의 마지막 후기를 지워도 빈 화면이 되지 않는다", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<MyReviewsPage />);

    await user.click(screen.getByRole("button", { name: "2페이지" }));
    // 삭제가 반영되면 4개만 남아 2페이지가 사라진다 — 페이지 state는 아직 1이다.
    hooks.useReviews.mockReturnValue({ data: myReviews.slice(0, 4), isLoading: false });
    rerender(<MyReviewsPage />);

    expect(screen.getByText("내 장소 0")).toBeTruthy();
    expect(screen.queryByRole("navigation", { name: "페이지" })).toBeNull();
  });
});
