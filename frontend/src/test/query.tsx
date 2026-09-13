import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

/** 테스트용 QueryClient. 실패를 재시도하지 않아야 에러 케이스가 기다림 없이 바로 끝난다. */
export function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}

/** renderHook·render의 wrapper로 넘기는 Provider. 테스트가 캐시를 직접 들여다볼 수 있게 client를 받는다. */
export function createQueryWrapper(client: QueryClient) {
  return function QueryWrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}
