import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PostSaveBar } from "@/components/feed/PostSaveBar";
import { useAuthStore } from "@/stores/useAuthStore";
import { useToastStore } from "@/stores/useToastStore";

const hooks = vi.hoisted(() => ({ useToggleSave: vi.fn(), mutate: vi.fn() }));
vi.mock("@/hooks/usePosts", () => ({ useToggleSave: hooks.useToggleSave }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/feed",
}));

interface MutateCallbacks {
  onSuccess: (result: { saved: boolean; saves: number }) => void;
  onError: (error: Error) => void;
}

/** 마지막 mutate 호출에 넘어간 콜백. 성공·실패를 테스트가 직접 일으킨다. */
function lastCallbacks(): MutateCallbacks {
  const calls = hooks.mutate.mock.calls;
  return calls[calls.length - 1][1] as MutateCallbacks;
}

beforeEach(() => {
  vi.clearAllMocks();
  hooks.useToggleSave.mockReturnValue({ mutate: hooks.mutate, isPending: false });
  useAuthStore.setState({ isLoggedIn: true, hydrated: true });
  useToastStore.setState({ message: null, key: 0 });
});

describe("PostSaveBar", () => {
  it("담긴 수를 보여준다", () => {
    render(<PostSaveBar postId="p1" isMine={false} saves={7} saved={false} />);

    expect(screen.getByText("📥 7명이 담아감")).toBeTruthy();
  });

  it("내 코스에는 담기 버튼 대신 '내 코스' 표시만 둔다", () => {
    render(<PostSaveBar postId="p1" isMine saves={7} saved={false} />);

    expect(screen.getByText("🐾 내 코스")).toBeTruthy();
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("비로그인이면 담지 않고 로그인 모달을 띄운다", async () => {
    useAuthStore.setState({ isLoggedIn: false });
    render(<PostSaveBar postId="p1" isMine={false} saves={7} saved={false} />);
    expect(screen.queryByText("로그인이 필요해요")).toBeNull();

    await userEvent.setup().click(screen.getByRole("button", { name: "＋ 담기" }));

    expect(hooks.mutate).not.toHaveBeenCalled();
    expect(screen.getByText("로그인이 필요해요")).toBeTruthy();
  });

  it("담으면 반대 상태로 요청하고, 결과를 토스트로 알린다", async () => {
    render(<PostSaveBar postId="p1" isMine={false} saves={7} saved={false} />);
    const button = screen.getByRole("button", { name: "＋ 담기" });
    expect(button.getAttribute("aria-pressed")).toBe("false");

    await userEvent.setup().click(button);

    expect(hooks.mutate).toHaveBeenCalledWith({ postId: "p1", next: true }, expect.any(Object));
    lastCallbacks().onSuccess({ saved: true, saves: 8 });
    expect(useToastStore.getState().message).toBe("내 여정 보관함에 담았어요");
  });

  it("이미 담긴 글은 누르면 취소를 요청한다", async () => {
    render(<PostSaveBar postId="p1" isMine={false} saves={7} saved />);
    const button = screen.getByRole("button", { name: "담김" });
    expect(button.getAttribute("aria-pressed")).toBe("true");

    await userEvent.setup().click(button);

    expect(hooks.mutate).toHaveBeenCalledWith({ postId: "p1", next: false }, expect.any(Object));
    lastCallbacks().onSuccess({ saved: false, saves: 6 });
    expect(useToastStore.getState().message).toBe("담기를 취소했어요");
  });

  it("실패하면 에러 문구를 토스트로 띄운다", async () => {
    render(<PostSaveBar postId="p1" isMine={false} saves={7} saved={false} />);

    await userEvent.setup().click(screen.getByRole("button", { name: "＋ 담기" }));
    lastCallbacks().onError(new Error("코스를 담지 못했어요"));

    expect(useToastStore.getState().message).toBe("코스를 담지 못했어요");
  });

  it("요청 중에는 버튼을 막아 두 번 요청하지 않는다", async () => {
    hooks.useToggleSave.mockReturnValue({ mutate: hooks.mutate, isPending: true });
    render(<PostSaveBar postId="p1" isMine={false} saves={7} saved={false} />);
    const button = screen.getByRole("button", { name: "＋ 담기" }) as HTMLButtonElement;

    expect(button.disabled).toBe(true);
    await userEvent.setup().click(button);
    expect(hooks.mutate).not.toHaveBeenCalled();
  });
});
