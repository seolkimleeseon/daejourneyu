/**
 * 한글 조사 자동 선택.
 *
 * 반려동물 이름처럼 사용자가 입력한 값이 문장 한가운데 들어가면 "밤톨로"/"콩이으로"처럼
 * 받침에 따라 어색해지는 자리가 생긴다. 안내 문구에서 실제로 쓰이는 조사만 여기서 고른다 —
 * 범용 조사 라이브러리를 만들 만큼 쓰이는 곳이 많지 않다.
 */

/**
 * 끝 글자의 종성 인덱스(0 = 받침 없음). 한글 음절이 아니면(영문·숫자·이모지) null —
 * 이 경우 받침 유무를 단정할 수 없으므로 호출부가 기본값을 고른다.
 */
function jongseongOf(word: string): number | null {
  const last = word.trim().slice(-1);
  if (!last) return null;
  const offset = last.charCodeAt(0) - 0xac00;
  if (offset < 0 || offset > 11171) return null;
  return offset % 28;
}

/** 종성 ㄹ. 받침이 있어도 '로'를 쓰는 유일한 예외라 따로 이름을 둔다. */
const JONGSEONG_RIEUL = 8;

/**
 * "콩이" → "로", "밤톨" → "로", "하늘" → "로", "방울" → "로", "댕댕" → "으로".
 * 한글이 아닌 이름(예: "Coco")은 모음으로 끝나는 표기가 흔해 '로'를 기본으로 둔다.
 */
export function ro(word: string): string {
  const jongseong = jongseongOf(word);
  if (null === jongseong) return "로";
  return 0 === jongseong || JONGSEONG_RIEUL === jongseong ? "로" : "으로";
}

/**
 * "콩이" → "를", "밤톨" → "을". 한글이 아닌 이름은 받침을 알 수 없어 '를'을 기본으로 둔다.
 */
export function eulReul(word: string): string {
  const jongseong = jongseongOf(word);
  if (null === jongseong) return "를";
  return 0 === jongseong ? "를" : "을";
}
