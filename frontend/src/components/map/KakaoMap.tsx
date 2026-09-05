"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { loadKakaoMap } from "@/lib/kakaoMap";

export interface KakaoMapMarker {
  id: string | number;
  lat: number;
  lng: number;
  onClick?: () => void;
}

/** app/globals.css의 --color-brand(#35ad90)와 동일 — 캔버스로 그리는 선이라 CSS 토큰을 그대로 못 쓴다. */
const DEFAULT_PATH_COLOR = "#35ad90";

interface KakaoMapProps {
  center: { lat: number; lng: number };
  /** 렌더링될 때마다 지도를 통째로 다시 그리므로, 매 렌더 새 배열을 넘기지 말고 호출부에서 useMemo로 감싼다. */
  markers?: KakaoMapMarker[];
  level?: number;
  /** 지도 박스(반지름·테두리 등) 스타일. 없으면 h-full/w-full만 채운다 — 크기는 항상 호출부 책임. */
  className?: string;
  /** SDK 로딩 중 지도 위에 겹쳐 보여줄 내용(스피너·안내 문구 등). */
  loadingSlot?: ReactNode;
  /** SDK 로드 실패 시 지도 박스 대신 통째로 보여줄 내용. */
  errorSlot?: ReactNode;
  /** true면 markers 배열 순서대로(예: 코스 1일차 방문 순서) 선을 이어 그린다. 마커 2개 미만이면 무시. */
  path?: boolean;
  pathColor?: string;
  pathWeight?: number;
  pathOpacity?: number;
}

type MapStatus = "loading" | "ready" | "error";

/**
 * 카카오맵 JS SDK를 지연 로드해 마커 n개짜리 실지도를 그리는 범용 컴포넌트.
 * 장소 상세(마커 1개)부터 여러 핀을 한 번에 보여줘야 하는 화면까지 공용으로 쓴다 —
 * SDK 로딩·상태 관리·마커 생성 로직은 여기 한 곳에만 둔다.
 */
export function KakaoMap({
  center,
  markers = [],
  level = 4,
  className,
  loadingSlot,
  errorSlot,
  path = false,
  pathColor = DEFAULT_PATH_COLOR,
  pathWeight = 4,
  pathOpacity = 0.85,
}: KakaoMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<MapStatus>("loading");

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");

    loadKakaoMap()
      .then((maps) => {
        const el = containerRef.current;
        if (cancelled || !el) return;
        el.innerHTML = "";

        const map = new maps.Map(el, { center: new maps.LatLng(center.lat, center.lng), level });
        markers.forEach((marker) => {
          const kakaoMarker = new maps.Marker({ position: new maps.LatLng(marker.lat, marker.lng), map });
          if (marker.onClick) {
            maps.event.addListener(kakaoMarker, "click", marker.onClick);
          }
        });

        // markers 배열 순서 = 방문 순서로 간주하고 그 순서 그대로 잇는다.
        if (path && markers.length >= 2) {
          new maps.Polyline({
            path: markers.map((marker) => new maps.LatLng(marker.lat, marker.lng)),
            map,
            strokeWeight: pathWeight,
            strokeColor: pathColor,
            strokeOpacity: pathOpacity,
            strokeStyle: "solid",
          });
        }

        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
      if (containerRef.current) containerRef.current.innerHTML = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center.lat, center.lng, level, markers, path, pathColor, pathWeight, pathOpacity]);

  if (status === "error") {
    return <>{errorSlot}</>;
  }

  return (
    <div className={className}>
      <div ref={containerRef} className="h-full w-full" />
      {status === "loading" ? loadingSlot : null}
    </div>
  );
}
