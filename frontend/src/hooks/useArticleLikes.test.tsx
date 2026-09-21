import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useArticleLikes, useToggleArticleLike } from "@/hooks/useArticleLikes";
import { useAuthStore } from "@/stores/useAuthStore";

const api = vi.hoisted(() => ({ fetchArticleLikes: vi.fn(), setArticleLikeApi: vi.fn() }));
vi.mock("@/lib/api/articleLikes", () => api);

function wrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return {
    client,
    Wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    ),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  useAuthStore.setState({ isLoggedIn: true, hydrated: true, user: null });
});

describe("useArticleLikes", () => {
  it("세션을 확인한 뒤에 서버에서 받아 온다", async () => {
    api.fetchArticleLikes.mockResolvedValue({ counts: { a: 2 }, likedIds: ["a"] });
    const { Wrapper } = wrapper();

    const { result } = renderHook(() => useArticleLikes(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.data).toEqual({ counts: { a: 2 }, likedIds: ["a"] }));
  });

  it("세션 확인 전에는 부르지 않는다 — 로그인 사용자를 '누른 것 없음'으로 받지 않게", () => {
    useAuthStore.setState({ hydrated: false, isLoggedIn: false });
    const { Wrapper } = wrapper();

    renderHook(() => useArticleLikes(), { wrapper: Wrapper });

    expect(api.fetchArticleLikes).not.toHaveBeenCalled();
  });
});

describe("useToggleArticleLike", () => {
  it("누르면 서버 응답을 기다리지 않고 수와 누른 목록에 먼저 반영한다", async () => {
    api.fetchArticleLikes.mockResolvedValue({ counts: { a: 2 }, likedIds: [] });
    let resolveApi: (value: unknown) => void = () => {};
    api.setArticleLikeApi.mockReturnValue(new Promise((resolve) => (resolveApi = resolve)));
    const { Wrapper } = wrapper();
    const { result } = renderHook(() => ({ likes: useArticleLikes(), toggle: useToggleArticleLike() }), {
      wrapper: Wrapper,
    });
    await waitFor(() => expect(result.current.likes.data).toBeTruthy());

    act(() => result.current.toggle.mutate({ articleId: "a", next: true }));

    await waitFor(() =>
      expect(result.current.likes.data).toEqual({ counts: { a: 3 }, likedIds: ["a"] })
    );
    expect(api.setArticleLikeApi).toHaveBeenCalledWith("a", true);
    api.fetchArticleLikes.mockResolvedValue({ counts: { a: 3 }, likedIds: ["a"] });
    resolveApi({ articleId: "a", liked: true, count: 3 });
  });

  it("서버가 거절하면 누르기 전 상태로 되돌린다", async () => {
    api.fetchArticleLikes.mockResolvedValue({ counts: { a: 2 }, likedIds: [] });
    api.setArticleLikeApi.mockRejectedValue(new Error("저장 실패"));
    const { Wrapper } = wrapper();
    const { result } = renderHook(() => ({ likes: useArticleLikes(), toggle: useToggleArticleLike() }), {
      wrapper: Wrapper,
    });
    await waitFor(() => expect(result.current.likes.data).toBeTruthy());

    act(() => result.current.toggle.mutate({ articleId: "a", next: true }));

    await waitFor(() => expect(result.current.toggle.isError).toBe(true));
    await waitFor(() => expect(result.current.likes.data).toEqual({ counts: { a: 2 }, likedIds: [] }));
  });

  it("취소하면 수를 1 줄이고 누른 목록에서 뺀다", async () => {
    api.fetchArticleLikes.mockResolvedValue({ counts: { a: 3 }, likedIds: ["a"] });
    api.setArticleLikeApi.mockReturnValue(new Promise(() => {}));
    const { Wrapper } = wrapper();
    const { result } = renderHook(() => ({ likes: useArticleLikes(), toggle: useToggleArticleLike() }), {
      wrapper: Wrapper,
    });
    await waitFor(() => expect(result.current.likes.data).toBeTruthy());

    act(() => result.current.toggle.mutate({ articleId: "a", next: false }));

    await waitFor(() => expect(result.current.likes.data).toEqual({ counts: { a: 2 }, likedIds: [] }));
  });
});
