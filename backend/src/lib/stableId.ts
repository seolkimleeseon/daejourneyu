import { createHash } from "node:crypto";

/**
 * 원본 공공데이터 API 응답의 배열 인덱스(`petfac-${index}` 등)로 id를 만들면, 캐시가 갱신되며
 * 원본 응답 순서가 바뀔 때 같은 id가 다른 장소를 가리키게 된다(Place.id가 Prisma에서 그대로
 * 기본키로 쓰이는 건 아니지만, 프론트가 코스·리뷰에서 placeId로 들고 다니므로 안정성이 중요하다).
 * 이름+주소처럼 소스 자체 순서에 기대지 않는 값으로 해시를 만들어 매 호출마다 같은 id가 나오게 한다.
 */
export function stableId(prefix: string, ...parts: string[]): string {
  const hash = createHash("sha1").update(parts.join("|")).digest("hex").slice(0, 12);
  return `${prefix}-${hash}`;
}
