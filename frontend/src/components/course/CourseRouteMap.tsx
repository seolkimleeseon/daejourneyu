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
import type { CourseStop, Place } from "@/types";

type CourseRouteMapProps =
  | { stops: CourseStop[]; places?: undefined }
  /** 위저드 단계(장소담기·동선확인·MBTI 결과)는 애초에 좌표가 있는 Place를 그대로 들고 있으니,
   * CourseStop으로 스냅샷했다가 placeId로 다시 찾는 우회 없이 바로 지도에 꽂는다. */
  | { places: Place[]; stops?: undefined };

type MapStatus = "loading" | "ready" | "error";

/**
 * 순서대로 핀 찍고 선으로 이은 실지도를 보여준다. 두 가지 입력을 받는다 —
 * ① `stops`(CourseStop[], 저장된 코스): 좌표가 없어(저장 시 이름·카테고리 등만 스냅샷으로 남김)
 *   매번 좌표를 구해야 한다 — 먼저 `/api/places`(공식 소스) 목록에서 placeId로 찾고, 못 찾으면
 *   (카카오 검색으로 담긴 스탑) kakao.maps.services.Places로 "구 + 이름"을 키워드 검색한다.
 * ② `places`(Place[], 위저드 진행 중): 이미 좌표가 있으니 그대로 쓴다 — 재조회 없음.
 */
export function CourseRouteMap(props: CourseRouteMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<MapStatus>("loading");
  const [errorReason, setErrorReason] = useState<string>("");
  const stops = props.stops;
  const directPlaces = props.places;
  const needsLookup = !!stops;
  const { data: lookupPlaces } = usePickablePlaces(needsLookup);

  useEffect(() => {
    const items = stops ?? directPlaces ?? [];
    if (items.length === 0) return;
    if (needsLookup && !lookupPlaces) return;

    let cancelled = false;
    setStatus("loading");

    const placeByExactId = new Map((lookupPlaces ?? []).map((place) => [place.id, place]));

    loadKakaoMap()
      .then(async (maps) => {
        if (cancelled) return;

        const resolveLatLng = (item: CourseStop | Place): Promise<KakaoLatLng | null> => {
          if (!needsLookup) {
            const place = item as Place;
            return Promise.resolve(new maps.LatLng(place.lat, place.lng));
          }
          const stop = item as CourseStop;
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

        const points = (await Promise.all(items.map(resolveLatLng))).filter(
          (p): p is KakaoLatLng => p !== null
        );

        const el = containerRef.current;
        if (cancelled || !el || points.length === 0) {
          if (!cancelled) {
            console.error("[CourseRouteMap] 좌표를 하나도 못 구했어요", { itemCount: items.length });
            setErrorReason("좌표를 확인할 수 없어요");
            setStatus("error");
          }
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
      .catch((error) => {
        console.error("[CourseRouteMap] 지도를 불러오지 못했어요", error);
        if (!cancelled) {
          setErrorReason(error instanceof Error ? error.message : "알 수 없는 오류");
          setStatus("error");
        }
      });

    return () => {
      cancelled = true;
      if (containerRef.current) containerRef.current.innerHTML = "";
    };
  }, [stops, directPlaces, lookupPlaces, needsLookup]);

  return (
    <div className="relative mb-2 h-40 w-full overflow-hidden rounded-2xl border border-line">
      <div ref={containerRef} className="h-full w-full" />
      {status === "loading" ? (
        <div className="absolute inset-0 flex items-center justify-center bg-surface text-xs text-ink-muted">
          지도를 불러오는 중…
        </div>
      ) : null}
      {status === "error" ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-surface px-3 text-center text-xs text-ink-muted">
          <span>🗺️ 지도를 표시할 수 없어요</span>
          {errorReason ? <span className="text-[10px] text-ink-muted/80">{errorReason}</span> : null}
        </div>
      ) : null}
    </div>
  );
}
