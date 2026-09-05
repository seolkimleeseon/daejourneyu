/**
 * 카카오맵 JS SDK 로더 — https://apis.map.kakao.com/web/guide/
 *
 * app/layout.tsx가 전역으로 올리는 kakao.min.js(공유하기용 `window.Kakao`)와는 **다른 스크립트**다
 * (여기서 쓰는 건 `window.kakao.maps`). 지금은 장소 상세 화면만 지도를 쓰므로 전역 레이아웃에
 * 추가하지 않고 이 로더로 필요할 때 한 번만 지연 로드한다.
 *
 * 콘솔 설정: 앱 > 플랫폼 > Web 에 실행 도메인(로컬은 http://localhost:3000) 등록 + 앱 > 카카오맵 ON.
 */

/** 우리가 실제로 쓰는 kakao.maps 표면만 최소로 선언한다(strict 통과용, any 금지). */
interface KakaoLatLng {
  getLat(): number;
  getLng(): number;
}

interface KakaoMap {
  setCenter(latlng: KakaoLatLng): void;
  relayout(): void;
}

interface KakaoMarker {
  setMap(map: KakaoMap | null): void;
}

interface KakaoPolyline {
  setMap(map: KakaoMap | null): void;
}

interface KakaoEvent {
  addListener(target: KakaoMarker, type: "click", handler: () => void): void;
}

export interface KakaoMaps {
  load(callback: () => void): void;
  LatLng: new (lat: number, lng: number) => KakaoLatLng;
  Map: new (
    container: HTMLElement,
    options: { center: KakaoLatLng; level?: number; draggable?: boolean },
  ) => KakaoMap;
  Marker: new (options: { position: KakaoLatLng; map?: KakaoMap }) => KakaoMarker;
  Polyline: new (options: {
    path: KakaoLatLng[];
    map?: KakaoMap;
    strokeWeight?: number;
    strokeColor?: string;
    strokeOpacity?: number;
    strokeStyle?: "solid" | "shortdash" | "shortdot" | "shortdashdot";
  }) => KakaoPolyline;
  event: KakaoEvent;
}

declare global {
  interface Window {
    kakao?: { maps?: KakaoMaps };
  }
}

const JS_KEY = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;
const SDK_SRC = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${JS_KEY ?? ""}&autoload=false`;

let loader: Promise<KakaoMaps> | null = null;

/** 카카오맵 SDK를 한 번만 주입하고 `kakao.maps`가 준비되면 resolve 한다. 실패 시 사유와 함께 reject. */
export function loadKakaoMap(): Promise<KakaoMaps> {
  if (loader) return loader;

  loader = new Promise<KakaoMaps>((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("브라우저에서만 지도를 불러올 수 있어요"));
      return;
    }
    if (!JS_KEY) {
      reject(new Error("카카오 JS 키가 설정되지 않았어요"));
      return;
    }

    const finish = () => {
      const maps = window.kakao?.maps;
      if (!maps) {
        reject(new Error("카카오맵 SDK를 불러오지 못했어요"));
        return;
      }
      maps.load(() => resolve(maps));
    };

    // 이미 로드돼 있으면(다른 경로에서 주입) 바로 진행
    if (window.kakao?.maps) {
      finish();
      return;
    }

    const existing = document.querySelector<HTMLScriptElement>(`script[data-kakao-map="true"]`);
    if (existing) {
      existing.addEventListener("load", finish, { once: true });
      existing.addEventListener("error", () => reject(new Error("카카오맵 SDK 로드에 실패했어요")), {
        once: true,
      });
      return;
    }

    const script = document.createElement("script");
    script.src = SDK_SRC;
    script.async = true;
    script.dataset.kakaoMap = "true";
    script.addEventListener("load", finish, { once: true });
    script.addEventListener("error", () => reject(new Error("카카오맵 SDK 로드에 실패했어요")), {
      once: true,
    });
    document.head.appendChild(script);
  });

  // 실패한 프로미스를 캐시에 남기면 재시도가 막히므로 비운다.
  loader.catch(() => {
    loader = null;
  });

  return loader;
}
