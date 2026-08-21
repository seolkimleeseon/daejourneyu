import { useQuery } from "@tanstack/react-query";
import type { Place } from "@/types";
import { mockPlaces } from "@/mocks";

// TODO(api): GET /api/places 로 교체. 지금은 목데이터를 비동기 흉내만 내어 반환한다.
async function fetchPlaces(): Promise<Place[]> {
  return mockPlaces;
}

export function usePlaces() {
  return useQuery({ queryKey: ["places"], queryFn: fetchPlaces });
}
