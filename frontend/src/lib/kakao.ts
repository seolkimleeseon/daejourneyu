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

interface KakaoFeedTemplate {
  objectType: "feed";
  content: {
    title: string;
    description: string;
    imageUrl: string;
    imageWidth?: number;
    imageHeight?: number;
    link: KakaoLinkTarget;
  };
}

type KakaoTemplate = KakaoTextTemplate | KakaoFeedTemplate;

interface KakaoUploadResponse {
  infos: { original: { url: string; width?: number; height?: number } };
}

interface KakaoSdk {
  init: (key: string) => void;
  isInitialized: () => boolean;
  Share: {
    sendDefault: (template: KakaoTemplate) => void;
    /** 이미지를 카카오 서버에 올리고 공유 템플릿에 쓸 URL을 돌려준다(보관 100일, 5MB 이하). */
    uploadImage?: (params: { file: FileList | File[] }) => Promise<KakaoUploadResponse>;
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

interface ShareResult {
  ok: boolean;
  reason?: string;
}

/** 공유를 열 수 있는 상태인지 확인하고, 안 되면 사람이 읽을 사유를 돌려준다. */
function readyToShare(): { sdk: KakaoSdk; origin: string } | ShareResult {
  if (typeof window === "undefined") return { ok: false, reason: "브라우저에서만 사용할 수 있어요" };
  if (!window.Kakao) return { ok: false, reason: "카카오 SDK를 아직 불러오지 못했어요" };
  if (!KAKAO_JS_KEY) return { ok: false, reason: "카카오 앱 키가 설정되지 않았어요" };
  if (!ensureKakaoInit()) return { ok: false, reason: "카카오 공유를 준비하지 못했어요" };
  return { sdk: window.Kakao, origin: window.location.origin };
}

function isReady(value: ReturnType<typeof readyToShare>): value is { sdk: KakaoSdk; origin: string } {
  return "sdk" in value;
}

interface ShareTextParams {
  title: string;
  description: string;
  /** 카카오톡 메시지에서 이동할 경로. 안 넘기면 홈으로 연결한다(예: 코스 저장 전이라 갈 상세 페이지가 없는 경우). */
  path?: string;
}

/** 텍스트 템플릿으로 카카오톡 공유하기를 연다. */
export function shareTextToKakao({ title, description, path = "/" }: ShareTextParams): ShareResult {
  const ready = readyToShare();
  if (!isReady(ready)) return ready;

  const url = `${ready.origin}${path}`;
  ready.sdk.Share.sendDefault({
    objectType: "text",
    text: `${title}\n${description}`,
    link: { mobileWebUrl: url, webUrl: url },
  });
  return { ok: true };
}

interface ShareImageParams extends ShareTextParams {
  /** 결과 화면을 캡처한 PNG (src/lib/captureImage.ts의 captureElementAsFile) */
  file: File;
}

/** SDK가 요구하는 FileList 모양으로 감싼다 — DataTransfer를 못 쓰는 브라우저는 배열로 넘긴다. */
function toFileList(file: File): FileList | File[] {
  try {
    const transfer = new DataTransfer();
    transfer.items.add(file);
    return transfer.files;
  } catch {
    return [file];
  }
}

/**
 * 결과 화면 캡처를 말풍선 미리보기로 띄우는 공유 — 이미지를 카카오 서버에 올린 뒤
 * 그 URL로 feed 템플릿을 보낸다.
 *
 * 업로드는 어디까지나 덤이라, 실패하면(구버전 SDK·용량 초과·네트워크) 조용히 텍스트 공유로
 * 내려간다. 공유창 자체가 안 뜨는 것보다 이미지 없이라도 뜨는 편이 낫다.
 * NOTE: 올린 이미지는 카카오가 100일간 보관하고 그 뒤 삭제한다 — 오래된 말풍선은 썸네일만
 * 깨지고 링크는 그대로 동작한다.
 */
export async function shareImageToKakao({
  title,
  description,
  path = "/",
  file,
}: ShareImageParams): Promise<ShareResult> {
  const ready = readyToShare();
  if (!isReady(ready)) return ready;

  const upload = ready.sdk.Share.uploadImage;
  if (!upload) return shareTextToKakao({ title, description, path });

  let uploaded: KakaoUploadResponse["infos"]["original"] | null = null;
  try {
    const response = await upload({ file: toFileList(file) });
    uploaded = response?.infos?.original ?? null;
  } catch {
    uploaded = null;
  }
  if (!uploaded?.url) return shareTextToKakao({ title, description, path });

  const url = `${ready.origin}${path}`;
  ready.sdk.Share.sendDefault({
    objectType: "feed",
    content: {
      title,
      description,
      imageUrl: uploaded.url,
      ...(uploaded.width ? { imageWidth: uploaded.width } : {}),
      ...(uploaded.height ? { imageHeight: uploaded.height } : {}),
      link: { mobileWebUrl: url, webUrl: url },
    },
  });
  return { ok: true };
}
