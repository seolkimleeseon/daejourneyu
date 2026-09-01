"use client";

import { useEffect, useRef, useState } from "react";
import { loadKakaoMap } from "@/lib/kakaoMap";

interface PlaceMapProps {
  name: string;
  lat: number;
  lng: number;
}

type MapStatus = "loading" | "ready" | "error";

/**
 * 장소 상세의 위치 지도. 카카오맵 JS SDK를 지연 로드해 마커 1개짜리 실지도를 그린다.
 * SDK가 안 뜨거나 좌표가 없으면 지도는 숨기고 카카오맵 링크 2개(길찾기·큰 지도)만 남긴다.
 */
export function PlaceMap({ name, lat, lng }: PlaceMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<MapStatus>("loading");

  const hasCoords = Number.isFinite(lat) && Number.isFinite(lng) && (lat !== 0 || lng !== 0);

  useEffect(() => {
    if (!hasCoords) return;

    let cancelled = false;
    setStatus("loading");

    loadKakaoMap()
      .then((maps) => {
        const el = containerRef.current;
        if (cancelled || !el) return;
        el.innerHTML = "";
        const center = new maps.LatLng(lat, lng);
        const map = new maps.Map(el, { center, level: 4 });
        new maps.Marker({ position: center, map });
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
      if (containerRef.current) containerRef.current.innerHTML = "";
    };
  }, [hasCoords, lat, lng]);

  if (!hasCoords) {
    return <div className="text-xs text-ink-muted">위치 정보가 없어요.</div>;
  }

  const encodedName = encodeURIComponent(name);

  return (
    <div>
      {status !== "error" ? (
        <div className="relative h-44 w-full overflow-hidden rounded-xl border border-line">
          <div ref={containerRef} className="h-full w-full" />
          {status === "loading" ? (
            <div className="absolute inset-0 flex items-center justify-center text-xs text-ink-muted">
              지도를 불러오는 중…
            </div>
          ) : null}
        </div>
      ) : (
        <div className="text-xs text-ink-muted">
          지도를 불러오지 못했어요. 카카오맵에서 확인해 주세요.
        </div>
      )}

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
