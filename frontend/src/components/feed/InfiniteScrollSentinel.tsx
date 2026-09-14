"use client";

import { useEffect, useRef } from "react";

interface InfiniteScrollSentinelProps {
  /** 다음 페이지가 남아 있는지. false면 감시를 걸지 않는다. */
  hasMore: boolean;
  /** 이미 불러오는 중인지. 스크롤이 빠를 때 같은 페이지를 두 번 요청하지 않게 막는다. */
  loading: boolean;
  onLoadMore: () => void;
}

/**
 * 목록 끝에 두는 감시용 빈 줄. 화면에 들어오면 다음 페이지를 부른다.
 *
 * "더 보기" 버튼 대신 IntersectionObserver를 쓴다 — 웹앱이라 스크롤로 이어 보는 게 자연스럽고,
 * 버튼은 한 페이지마다 손이 한 번씩 더 가기 때문이다. 다만 **끝까지 갔을 때는 문구를 남긴다**:
 * 무한 스크롤은 목록이 끝났는지 로딩이 멈춘 건지 구분이 안 되는 게 제일 흔한 불만이다.
 *
 * `rootMargin`으로 한 화면 미리 당겨 받아서, 바닥에 닿기 전에 다음 카드가 준비되게 한다.
 */
export function InfiniteScrollSentinel({
  hasMore,
  loading,
  onLoadMore,
}: InfiniteScrollSentinelProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  // 콜백이 매 렌더 새로 만들어져도 옵저버를 다시 붙이지 않도록 최신 값만 갈아끼운다.
  const handlerRef = useRef(onLoadMore);
  handlerRef.current = onLoadMore;

  useEffect(() => {
    const target = ref.current;
    if (!target || !hasMore || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) handlerRef.current();
      },
      { rootMargin: "400px 0px" }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [hasMore, loading]);

  if (!hasMore) {
    return (
      <p className="py-5 text-center text-[11px] text-ink-muted">
        마지막 코스까지 다 봤어요
      </p>
    );
  }

  return (
    <div ref={ref} className="py-5 text-center text-[11px] text-ink-muted">
      {loading ? "더 불러오는 중…" : ""}
    </div>
  );
}
