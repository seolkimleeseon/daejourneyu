/**
 * 카카오톡 공유 — https://developers.kakao.com/docs/ko/kakaotalk-share/js-link
 * SDK 스크립트는 app/layout.tsx에서 전역으로 한 번만 로드한다.
 */
interface KakaoLinkTarget {
  mobileWebUrl: string;
  webUrl: string;
}

interface KakaoTextTemplate {
  objectType: "text";
  text: string;
  link: KakaoLinkTarget;
}

interface KakaoSdk {
  init: (key: string) => void;
  isInitialized: () => boolean;
  Share: {
    sendDefault: (template: KakaoTextTemplate) => void;
  };
}

declare global {
  interface Window {
    Kakao?: KakaoSdk;
  }
}

const KAKAO_JS_KEY = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;

function ensureKakaoInit(): boolean {
  if (typeof window === "undefined" || !window.Kakao) return false;
  if (!KAKAO_JS_KEY) return false;
  if (!window.Kakao.isInitialized()) {
    window.Kakao.init(KAKAO_JS_KEY);
  }
  return window.Kakao.isInitialized();
}

interface ShareTextParams {
  title: string;
  description: string;
  /** 카카오톡 메시지에서 이동할 경로. 아직 코스를 서버에 저장하지 않아 앱 홈으로 고정한다. */
  path?: string;
}

interface ShareResult {
  ok: boolean;
  reason?: string;
}

/**
 * 텍스트 템플릿으로 카카오톡 공유하기를 연다.
 * TODO(api): 코스가 백엔드에 저장되고 이미지를 호스팅할 수 있게 되면 objectType 'feed' + imageUrl로 교체.
 */
export function shareTextToKakao({ title, description, path = "/" }: ShareTextParams): ShareResult {
  if (typeof window === "undefined") return { ok: false, reason: "브라우저에서만 사용할 수 있어요" };
  if (!window.Kakao) return { ok: false, reason: "카카오 SDK를 아직 불러오지 못했어요" };
  if (!ensureKakaoInit()) return { ok: false, reason: "카카오 앱 키가 설정되지 않았어요" };

  const url = `${window.location.origin}${path}`;
  window.Kakao.Share.sendDefault({
    objectType: "text",
    text: `${title}\n${description}`,
    link: { mobileWebUrl: url, webUrl: url },
  });
  return { ok: true };
}
