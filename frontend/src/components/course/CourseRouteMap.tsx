"use client";

import { useEffect, useRef, useState } from "react";
import { loadKakaoMap, type KakaoLatLng } from "@/lib/kakaoMap";
import {
  BRAND_MARKER_ANCHOR,
  BRAND_MARKER_SIZE,
  BRAND_MARKER_SRC,
} from "@/lib/kakaoBrandMarker";
import { ROUTE_PATH_STYLE } from "@/lib/kakaoRouteStyle";
import { usePickablePlaces } from "@/hooks/usePickablePlaces";
import type { CourseStop } from "@/types";

interface CourseRouteMapProps {
  stops: CourseStop[];
}

type MapStatus = "loading" | "ready" | "error";

/**
 * 코스 상세의 "동선"에 스탑들을 순서대로 핀 찍고 선으로 이은 실지도를 보여준다.
 * CourseStop엔 좌표가 없어(저장 시 이름·카테고리 등만 스냅샷으로 남김), 매번 좌표를 구해야 한다 —
 * ① `/api/places`(공식 소스) 목록에서 placeId로 먼저 찾고, ② 못 찾으면(카카오 검색으로 담긴
 * 스탑) kakao.maps.services.Places로 "구 + 이름"을 키워드 검색해 좌표를 구한다.
 * DB 스키마를 건드리지 않아 기존에 이미 저장된 코스도 그대로 지도가 뜬다.
 */
export function CourseRouteMap({ stops }: CourseRouteMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<MapStatus>("loading");
  const { data: places } = usePickablePlaces();

  useEffect(() => {
    if (stops.length === 0 || !places) return;

    let cancelled = false;
    setStatus("loading");

    const placeByExactId = new Map(places.map((place) => [place.id, place]));

    loadKakaoMap()
      .then(async (maps) => {
        if (cancelled) return;

        const resolveLatLng = (stop: CourseStop): Promise<KakaoLatLng | null> => {
          const known = placeByExactId.get(stop.placeId);
          if (known) return Promise.resolve(new maps.LatLng(known.lat, known.lng));

          return new Promise((resolve) => {
            const placesService = new maps.services.Places();
            placesService.keywordSearch(`${stop.district} ${stop.name}`, (data, statusCode) => {
              if (statusCode === maps.services.Status.OK && data.length > 0) {
                resolve(new maps.LatLng(Number(data[0].y), Number(data[0].x)));
              } else {
                resolve(null);
              }
            });
          });
        };

        const points = (await Promise.all(stops.map(resolveLatLng))).filter(
          (p): p is KakaoLatLng => p !== null
        );

        const el = containerRef.current;
        if (cancelled || !el || points.length === 0) {
          if (!cancelled) setStatus("error");
          return;
        }

        el.innerHTML = "";
        const map = new maps.Map(el, { center: points[0], level: 6 });

        // 로고 커스텀 핀 — 공용 <KakaoMap>과 동일한 브랜드 마커.
        const markerImage = new maps.MarkerImage(
          BRAND_MARKER_SRC,
          new maps.Size(BRAND_MARKER_SIZE.width, BRAND_MARKER_SIZE.height),
          { offset: new maps.Point(BRAND_MARKER_ANCHOR.x, BRAND_MARKER_ANCHOR.y) },
        );

        points.forEach((position) => {
          new maps.Marker({ position, map, image: markerImage });
        });

        if (points.length > 1) {
          new maps.Polyline({
            path: points,
            map,
            strokeWeight: ROUTE_PATH_STYLE.weight,
            strokeColor: ROUTE_PATH_STYLE.color,
            strokeOpacity: ROUTE_PATH_STYLE.opacity,
            strokeStyle: ROUTE_PATH_STYLE.style,
          });
        }

        const bounds = new maps.LatLngBounds();
        points.forEach((p) => bounds.extend(p));
        map.setBounds(bounds);

        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
      if (containerRef.current) containerRef.current.innerHTML = "";
    };
  }, [stops, places]);

  if (status === "error") return null;

  return (
    <div className="relative mb-2 h-40 w-full overflow-hidden rounded-2xl border border-line">
      <div ref={containerRef} className="h-full w-full" />
      {status === "loading" ? (
        <div className="absolute inset-0 flex items-center justify-center bg-surface text-xs text-ink-muted">
          지도를 불러오는 중…
        </div>
      ) : null}
    </div>
  );
}
