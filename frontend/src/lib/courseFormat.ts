/** 0 = 당일치기, n = n박 (n+1)일 */
export function nightsLabel(nights: number): string {
  return nights === 0 ? "당일치기" : `${nights}박 ${nights + 1}일`;
}
