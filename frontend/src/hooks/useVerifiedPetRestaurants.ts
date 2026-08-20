import { useQuery } from "@tanstack/react-query";
import { mapVerifiedRestaurantToPlace, type ApiVerifiedPetRestaurant } from "@/lib/verifiedPetRestaurantMapper";
import type { PickablePlace } from "@/lib/petTourMapper";

async function fetchVerifiedRestaurantPlaces(): Promise<PickablePlace[]> {
  const res = await fetch("/api/verified-pet-restaurants");
  if (!res.ok) throw new Error("인증 맛집 정보를 불러오지 못했어요");
  const data = (await res.json()) as { restaurants: ApiVerifiedPetRestaurant[] };
  return data.restaurants
    .map(mapVerifiedRestaurantToPlace)
    .filter((place): place is PickablePlace => place !== null);
}

/** 식약처 반려동물 동반출입 가능 업소 정식 등록 목록(대전, 맛집 카테고리 보강용). */
export function useVerifiedPetRestaurants(enabled = true) {
  return useQuery({
    queryKey: ["verified-pet-restaurants"],
    queryFn: fetchVerifiedRestaurantPlaces,
    staleTime: 24 * 60 * 60 * 1000,
    retry: 1,
    enabled,
  });
}
