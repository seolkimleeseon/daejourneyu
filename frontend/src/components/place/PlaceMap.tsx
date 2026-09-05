"use client";

import { useMemo } from "react";
import { KakaoMap, type KakaoMapMarker } from "@/components/map/KakaoMap";

interface PlaceMapProps {
  name: string;
  lat: number;
  lng: number;
}

/**
 * 장소 상세의 위치 지도. 범용 <KakaoMap>에 마커 1개짜리 설정을 얹은 얇은 래퍼다.
 * SDK가 안 뜨거나 좌표가 없으면 지도는 숨기고 카카오맵 링크 2개(길찾기·큰 지도)만 남긴다.
 */
export function PlaceMap({ name, lat, lng }: PlaceMapProps) {
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lng) && (lat !== 0 || lng !== 0);
  const markers = useMemo<KakaoMapMarker[]>(() => (hasCoords ? [{ id: "self", lat, lng }] : []), [hasCoords, lat, lng]);

  if (!hasCoords) {
    return <div className="text-xs text-ink-muted">위치 정보가 없어요.</div>;
  }

  const encodedName = encodeURIComponent(name);

  return (
    <div>
      <KakaoMap
        center={{ lat, lng }}
        markers={markers}
        className="relative h-44 w-full overflow-hidden rounded-xl border border-line"
        loadingSlot={
          <div className="absolute inset-0 flex items-center justify-center text-xs text-ink-muted">
            지도를 불러오는 중…
          </div>
        }
        errorSlot={
          <div className="text-xs text-ink-muted">
            지도를 불러오지 못했어요. 카카오맵에서 확인해 주세요.
          </div>
        }
      />

      <div className="mt-2 flex gap-4 px-1">
        <a
          href={`https://map.kakao.com/link/to/${encodedName},${lat},${lng}`}
          target="_blank"
          rel="noreferrer"
          className="text-xs font-semibold text-brand"
        >
          길찾기 ›
        </a>
        <a
          href={`https://map.kakao.com/link/map/${encodedName},${lat},${lng}`}
          target="_blank"
          rel="noreferrer"
          className="text-xs font-semibold text-brand"
        >
          큰 지도로 보기 ›
        </a>
      </div>
    </div>
  );
}
