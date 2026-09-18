interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const store = new Map<string, CacheEntry<unknown>>();
const inFlight = new Map<string, Promise<unknown>>();

/** 아주 단순한 인메모리 TTL 캐시 — 공공데이터포털 일일 트래픽 한도를 아끼기 위한 용도. */
export async function cached<T>(key: string, ttlMs: number, load: () => Promise<T>): Promise<T> {
  const hit = store.get(key);
  if (hit && hit.expiresAt > Date.now()) return hit.value as T;
  const pending = inFlight.get(key);
  if (pending) return pending as Promise<T>;
  const request = Promise.resolve().then(load).then((value) => {
    store.set(key, { value, expiresAt: Date.now() + ttlMs });
    return value;
  }).finally(() => {
    inFlight.delete(key);
  });
  inFlight.set(key, request);
  return request;
}
