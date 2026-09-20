import type { AnchorHTMLAttributes, ReactNode } from "react";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// globals를 켜지 않아 Testing Library의 자동 정리가 걸리지 않는다 — 테스트마다 직접 비운다.
afterEach(() => {
  cleanup();
});

interface LinkMockProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  href: string;
  children?: ReactNode;
  prefetch?: boolean;
  replace?: boolean;
  scroll?: boolean;
}

/**
 * next/link는 앱 라우터·프리페치에 기대고 있어 jsdom에서 그대로 쓰면 부수효과가 많다.
 * 테스트가 확인하는 건 "어디로 가는 링크인가"뿐이라 모든 테스트에서 평범한 <a>로 바꾼다.
 */
vi.mock("next/link", () => ({
  default: function LinkMock({
    href,
    children,
    prefetch: _prefetch,
    replace: _replace,
    scroll: _scroll,
    ...rest
  }: LinkMockProps) {
    return (
      <a href={href} {...rest}>
        {children}
      </a>
    );
  },
}));

/**
 * jsdom에는 canvas가 없어 getContext가 호출될 때마다 "Not implemented" 스택을 콘솔에 쏟는다
 * (DistrictMap이 지도 판정 마스크를 만들 때 부른다). 어차피 null을 돌려주므로 동작은 그대로고,
 * 스택만 테스트 출력에 섞여 진짜 실패를 가리므로 조용히 null로 대신한다.
 */
HTMLCanvasElement.prototype.getContext =
  (() => null) as typeof HTMLCanvasElement.prototype.getContext;
