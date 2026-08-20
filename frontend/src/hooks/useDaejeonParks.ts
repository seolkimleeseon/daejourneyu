import { useQuery } from "@tanstack/react-query";
import { mapParkToPlace, type ApiDaejeonPark } from "@/lib/parksMapper";
import type { PickablePlace } from "@/lib/petTourMapper";

async function fetchParkPlaces(): Promise<PickablePlace[]> {
  const res = await fetch("/api/parks?numOfRows=300");
  if (!res.ok) throw new Error("공원 정보를 불러오지 못했어요");
  const data = (await res.json()) as { parks: ApiDaejeonPark[] };
  return data.parks
    .map(mapParkToPlace)
    .filter((place): place is PickablePlace => place !== null);
}

/**
 * 대전시 공식 도시공원정보(산책 카테고리 보강용). enabled: false로 두면 요청을 보내지 않는다 —
 * 바텀시트가 열릴 때만 필요하다.
 */
export function useDaejeonParks(enabled = true) {
  return useQuery({
    queryKey: ["daejeon-parks"],
    queryFn: fetchParkPlaces,
    staleTime: 24 * 60 * 60 * 1000,
    retry: 1,
    enabled,
  });
}
