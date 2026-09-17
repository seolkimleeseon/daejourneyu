/**
 * 3D 렌더 아이콘(Emoji3D)이 그려졌는지 확인하는 테스트 헬퍼.
 *
 * Emoji3D는 장식용 아이콘이라 `alt=""`인 `<img>`로 나가므로 `getByText("🧭")`처럼
 * 이모지 글자로는 잡히지 않는다. 대신 어떤 3D 에셋이 걸렸는지를 직접 확인한다 —
 * "아이콘이 있다"보다 "평면 이모지가 아니라 이 3D 렌더가 걸렸다"를 검증하게 된다.
 */
export function icon3D(fileName: string, root: ParentNode = document): HTMLImageElement | null {
  return root.querySelector<HTMLImageElement>(`img[src="/icons/3d/${fileName}"]`);
}
