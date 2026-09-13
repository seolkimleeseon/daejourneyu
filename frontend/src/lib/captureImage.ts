/**
 * 화면 요소를 PNG로 캡처해 다운로드한다. html-to-image는 쓸 때만 동적으로 불러온다.
 *
 * 원래는 html2canvas를 썼는데, 자체 텍스트 렌더링 엔진이 한글(특히 여러 글자가 섞인 장소명)을
 * 엉뚱한 글자로 바꿔 그리는 버그가 있었다 — 표를 grid로, flex를 없애고, 폰트를 고정폭으로
 * 바꿔봐도 전혀 안 고쳐질 만큼 라이브러리 자체의 한계였다. html-to-image는 브라우저 네이티브
 * SVG foreignObject로 렌더링해서(직접 글자를 다시 그리지 않음) 이 문제가 없다.
 */
export async function saveElementAsImage(element: HTMLElement | null, fileName: string): Promise<boolean> {
  if (!element) return false;
  try {
    const { toPng } = await import("html-to-image");
    const dataUrl = await toPng(element, {
      backgroundColor: "#F8F9FA",
      pixelRatio: 2,
      cacheBust: true,
    });
    const link = document.createElement("a");
    link.download = `${fileName}.png`;
    link.href = dataUrl;
    link.click();
    return true;
  } catch {
    return false;
  }
}
