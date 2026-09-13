import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { InfiniteScrollSentinel } from "@/components/feed/InfiniteScrollSentinel";

/** jsdom에는 IntersectionObserver가 없어서, 화면 진입을 테스트가 직접 일으킬 수 있는 가짜를 넣는다. */
class FakeIntersectionObserver {
  static instances: FakeIntersectionObserver[] = [];
  readonly observe = vi.fn();
  readonly disconnect = vi.fn();
  private readonly callback: IntersectionObserverCallback;

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
    FakeIntersectionObserver.instances.push(this);
  }

  trigger(isIntersecting: boolean) {
    act(() => {
      this.callback(
        [{ isIntersecting } as IntersectionObserverEntry],
        this as unknown as IntersectionObserver
      );
    });
  }
}

beforeEach(() => {
  FakeIntersectionObserver.instances = [];
  vi.stubGlobal("IntersectionObserver", FakeIntersectionObserver);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("InfiniteScrollSentinel", () => {
  it("더 받을 게 없으면 끝났다는 문구를 남기고 감시하지 않는다", () => {
    render(<InfiniteScrollSentinel hasMore={false} loading={false} onLoadMore={vi.fn()} />);

    expect(screen.getByText("마지막 코스까지 다 봤어요")).toBeTruthy();
    expect(FakeIntersectionObserver.instances).toHaveLength(0);
  });

  it("화면에 들어올 때만 다음 페이지를 부른다", () => {
    const onLoadMore = vi.fn();
    render(<InfiniteScrollSentinel hasMore loading={false} onLoadMore={onLoadMore} />);

    const [observer] = FakeIntersectionObserver.instances;
    expect(observer.observe).toHaveBeenCalledTimes(1);

    observer.trigger(false);
    expect(onLoadMore).not.toHaveBeenCalled();

    observer.trigger(true);
    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });

  it("불러오는 중에는 문구만 보이고 감시를 걸지 않는다", () => {
    render(<InfiniteScrollSentinel hasMore loading onLoadMore={vi.fn()} />);

    expect(screen.getByText("더 불러오는 중…")).toBeTruthy();
    expect(FakeIntersectionObserver.instances).toHaveLength(0);
  });

  it("콜백이 바뀌어도 옵저버를 다시 붙이지 않고 최신 콜백을 부른다", () => {
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = render(<InfiniteScrollSentinel hasMore loading={false} onLoadMore={first} />);

    rerender(<InfiniteScrollSentinel hasMore loading={false} onLoadMore={second} />);
    FakeIntersectionObserver.instances[0].trigger(true);

    expect(FakeIntersectionObserver.instances).toHaveLength(1);
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it("사라지면 감시를 끊는다", () => {
    const { unmount } = render(<InfiniteScrollSentinel hasMore loading={false} onLoadMore={vi.fn()} />);

    unmount();

    expect(FakeIntersectionObserver.instances[0].disconnect).toHaveBeenCalled();
  });
});
