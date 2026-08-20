/**
 * items를 최대 limit개씩 동시에 처리한다. 카카오 지오코딩·이미지검색을 소스마다 수십~백여 건씩
 * 무제한 Promise.all로 쏘면 레이트리밋(429)에 걸려 대부분 실패하는 문제가 있어서(실제로 발생),
 * 모든 카카오 호출 루프는 이 함수를 거치게 한다.
 */
export async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;

  async function worker() {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await fn(items[index], index);
    }
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, worker);
  await Promise.all(workers);
  return results;
}

/**
 * 여러 호출부(요청 여러 개, 소스 여러 개)가 동시에 나눠 써도 프로세스 전체에서 동시 실행 개수가
 * limit을 절대 넘지 않게 막는 전역 세마포어. mapWithConcurrency는 "이 호출 하나" 안에서만 동시성을
 * 제한하기 때문에, "전체" 카테고리로 5개 소스가 동시에 각자 병렬 요청을 쏘면 프로세스 전체 동시
 * 요청 수는 여전히 5배로 불어난다 — 카카오 API 호출은 전부 이 세마포어를 거치게 해서 실제로 막는다.
 */
export class Semaphore {
  private active = 0;
  private readonly queue: (() => void)[] = [];

  constructor(private readonly limit: number) {}

  async run<T>(fn: () => Promise<T>): Promise<T> {
    if (this.active >= this.limit) {
      await new Promise<void>((resolve) => this.queue.push(resolve));
    }
    this.active++;
    try {
      return await fn();
    } finally {
      this.active--;
      const next = this.queue.shift();
      if (next) next();
    }
  }
}
