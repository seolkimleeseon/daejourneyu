export type CrowdLevel = "여유" | "보통" | "혼잡";

const LEVELS: CrowdLevel[] = ["여유", "보통", "혼잡"];

/** 실시간 혼잡도 API가 없는 동안 장소명 기반으로 안정적인 혼잡도를 만들어낸다. */
export function computeCrowdLevel(placeName: string): CrowdLevel {
  let hash = 0;
  for (let i = 0; i < placeName.length; i++) {
    hash = (hash * 31 + placeName.charCodeAt(i)) % 9973;
  }
  return LEVELS[hash % LEVELS.length];
}
