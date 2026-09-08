import { useEffect, useState } from "react";

/**
 * 값이 잠잠해질 때까지 기다렸다가 넘겨준다.
 * 검색어가 서버 요청의 쿼리키가 되면서, 한 글자마다 요청이 나가지 않게 막는 용도다.
 */
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
