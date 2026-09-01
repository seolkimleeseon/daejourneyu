/** 화면 요소를 PNG로 캡처해 다운로드한다. html2canvas는 쓸 때만 동적으로 불러온다. */
export async function saveElementAsImage(element: HTMLElement | null, fileName: string): Promise<boolean> {
  if (!element) return false;
  try {
    const { default: html2canvas } = await import("html2canvas");
    // useCORS 없이는 외부 도메인 장소 사진(카카오 이미지 검색으로 붙인 것들)이 화면엔 정상 표시되면서도
    // 캡처 결과에서만 깨지거나 빈 칸으로 나온다 — CORS 응답 헤더가 없는 이미지는 이 옵션을 켜도 여전히
    // 스킵되지만(카카오 검색 결과라 대부분 우리가 통제 못 하는 서버), 최소한 캔버스 자체가 오염돼
    // 저장이 통째로 실패하는 건 막아준다.
    const canvas = await html2canvas(element, { backgroundColor: "#F8F9FA", scale: 2, useCORS: true });
    const link = document.createElement("a");
    link.download = `${fileName}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    return true;
  } catch {
    return false;
  }
}
