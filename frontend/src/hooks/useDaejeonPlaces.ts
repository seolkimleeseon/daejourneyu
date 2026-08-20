import { useQuery } from "@tanstack/react-query";
import { mapDaejeonPlaceToPlace, type ApiDaejeonPlace } from "@/lib/daejeonPlaceMapper";
import type { PickablePlace } from "@/lib/petTourMapper";

type DaejeonPlaceType = "culture" | "lodging" | "tourspot" | "restaurant";

async function fetchDaejeonPlaces(type: DaejeonPlaceType): Promise<PickablePlace[]> {
  const res = await fetch(`/api/daejeon-places/${type}`);
  if (!res.ok) throw new Error("대전시 장소 정보를 불러오지 못했어요");
  const data = (await res.json()) as { places: ApiDaejeonPlace[] };
  return data.places
    .map(mapDaejeonPlaceToPlace)
    .filter((place): place is PickablePlace => place !== null);
}

/** 대전시 문화시설/숙박/관광지/모범음식점 공공데이터(문화·숙박·산책·맛집 카테고리 보강용). */
export function useDaejeonPlaces(type: DaejeonPlaceType, enabled = true) {
  return useQuery({
    queryKey: ["daejeon-places", type],
    queryFn: () => fetchDaejeonPlaces(type),
    staleTime: 24 * 60 * 60 * 1000,
    retry: 1,
    enabled,
  });
}
