/** 장소 배열을 dayCount개 일차로 순서를 지키며 고르게 분배한다. */
export function chunkIntoDays<T>(items: T[], dayCount: number): T[][] {
  const groups: T[][] = Array.from({ length: Math.max(1, dayCount) }, () => []);
  const total = items.length || 1;
  items.forEach((item, index) => {
    let groupIndex = Math.floor((index * dayCount) / total);
    if (groupIndex > dayCount - 1) groupIndex = dayCount - 1;
    groups[groupIndex].push(item);
  });
  return groups;
}
