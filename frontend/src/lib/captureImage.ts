/** 화면 요소를 PNG로 캡처해 다운로드한다. html2canvas는 쓸 때만 동적으로 불러온다. */
export async function saveElementAsImage(element: HTMLElement | null, fileName: string): Promise<boolean> {
  if (!element) return false;
  try {
    const { default: html2canvas } = await import("html2canvas");
    const canvas = await html2canvas(element, { backgroundColor: "#F8F9FA", scale: 2 });
    const link = document.createElement("a");
    link.download = `${fileName}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    return true;
  } catch {
    return false;
  }
}
