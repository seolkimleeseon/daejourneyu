import { geocodeAddress, supplementImagesByName } from "./kakaoLocal";
import { mapWithConcurrency } from "./concurrency";
import { cached } from "./cache";

/** 카카오 지오코딩 동시 요청 상한 — 레이트리밋(429) 방지. */
const KAKAO_CONCURRENCY = 8;

/**
 * 식품의약품안전처 "반려동물 동반출입 가능 업소 현황"(2026.3.31 18시 업데이트 기준) 중 대전 지역만
 * 정적으로 옮겨둔 목록. 이 API는 오픈API가 없고 엑셀/PDF 다운로드만 제공해서, 한 번 받아둔 걸
 * 코드에 시드로 박아둔다 — 갱신되면 이 배열만 다시 교체하면 된다.
 */
const RAW_ENTRIES: { name: string; address: string }[] = [
  { name: "경기미당 관저점", address: "대전광역시 서구 관저동로 85" },
  { name: "글림(gleam)", address: "대전광역시 서구 용소로40번길 39" },
  { name: "루트커피 복합터미널점", address: "대전광역시 동구 동서대로 1677" },
  { name: "별빛이흐르는카페", address: "대전광역시 동구 동대전로110번길 176" },
  { name: "코어카페 CORE CAFE", address: "대전광역시 동구 옥천로 56-1" },
  { name: "티티엠(ttm)", address: "대전광역시 서구 계룡로 381" },
  { name: "(주)식사 다이너 대전점", address: "대전광역시 서구 둔산로31번길 56" },
  { name: "견우재", address: "대전광역시 동구 대동천좌안5길 19" },
  { name: "그로브소제(grovesoje)", address: "대전광역시 동구 수향길 25" },
  { name: "그루그루", address: "대전광역시 유성구 반석로 136-28" },
  { name: "금시월", address: "대전광역시 서구 용소로46번길 11" },
  { name: "까사 드 까페", address: "대전광역시 유성구 봉명서로 9" },
  { name: "낮밤", address: "대전광역시 동구 동대전로131번길 8-10" },
  { name: "노프레임커피", address: "대전광역시 동구 홍도로46번길 100" },
  { name: "눕시(NUPTSE)", address: "대전광역시 서구 대덕대로 129" },
  { name: "대전버거(TAEJON BURGER)", address: "대전광역시 동구 동광장로 86" },
  { name: "댕라운지", address: "대전광역시 서구 대덕대로317번길 20" },
  { name: "댕스파크", address: "대전광역시 서구 장안로 26-12" },
  { name: "더돈하우스", address: "대전광역시 서구 둔산남로105번길 22" },
  { name: "데이오프", address: "대전광역시 서구 도안중로305번안길 59" },
  { name: "라온 RAON", address: "대전광역시 서구 관저북로13번길 23-12" },
  { name: "레이크 뷰", address: "대전광역시 동구 회남로275번길 197-6" },
  { name: "롤라 Lolla", address: "대전광역시 동구 회남로275번길 123" },
  { name: "몽베르트", address: "대전광역시 동구 충정로 37" },
  { name: "미들슬로우 궁동점", address: "대전광역시 유성구 농대로15번길 3" },
  { name: "소소림", address: "대전광역시 유성구 동서대로 184-45" },
  { name: "아트사이트 소제 카페", address: "대전광역시 동구 철갑3길 15" },
  { name: "엘 깜뽀 데 떼레노", address: "대전광역시 동구 대동천좌안5길 31" },
  { name: "울댕카페 파쏘 북대전점", address: "대전광역시 유성구 관용로 52" },
  { name: "원조황소삼춘네본점", address: "대전광역시 중구 대흥로157번길 35" },
  { name: "이니셜 initial", address: "대전광역시 서구 도안북로118번길 73" },
  { name: "점선면", address: "대전광역시 중구 부용로 44" },
  { name: "카페니치 어은점", address: "대전광역시 유성구 농대로8번길 7" },
  { name: "캡프로젝트", address: "대전광역시 대덕구 중리로53번길 42" },
  { name: "파스톤", address: "대전광역시 서구 원도안로241번길 24-12" },
  { name: "퍼피스 그린", address: "대전광역시 유성구 송정길84번길 66" },
  { name: "풍류 소제", address: "대전광역시 동구 수향길 31" },
  { name: "헤레디움카페(Heredium cafe)", address: "대전광역시 동구 대전로 735" },
  { name: "후루룩 대전", address: "대전광역시 동구 철갑2길 16" },
  { name: "텍스트가든", address: "대전광역시 유성구 문지로 6-1" },
];

const DISTRICTS = ["유성구", "중구", "동구", "대덕구", "서구"];

export interface VerifiedPetRestaurant {
  id: string;
  name: string;
  district: string;
  address: string;
  lat: number;
  lng: number;
  phone: string | null;
  representativeMenu: string | null;
  imageUrl: string | null;
}

/**
 * 대전 지역 식약처 등록 반려동물 동반출입 음식점 목록 — 좌표는 카카오 지오코딩으로 채운다.
 * (대전시 음식점 정보조회 API로 전화번호·대표메뉴를 보강해보려 했으나, 그 데이터셋 실제 건수가
 * 3천여 건뿐이라 이 40곳과 매칭이 하나도 안 돼 걷어냈다 — phone/representativeMenu는 항상 null.)
 * geocodeAddress가 주소 단위로 30일 캐시하니 이후 호출은 대부분 캐시 히트.
 */
export async function fetchVerifiedPetRestaurants(): Promise<VerifiedPetRestaurant[]> {
  return cached("verified-pet-restaurants:all", 24 * 60 * 60 * 1000, async () => {
    const geocoded = await mapWithConcurrency(RAW_ENTRIES, KAKAO_CONCURRENCY, async (entry, index) => {
      const district = DISTRICTS.find((candidate) => entry.address.includes(candidate));
      if (!district) return null;

      const point = await geocodeAddress(entry.address).catch(() => null);
      if (!point) return null;
      return {
        id: `foodsafety-${index}`,
        name: entry.name,
        district,
        address: entry.address,
        lat: point.lat,
        lng: point.lng,
        phone: null as string | null,
        representativeMenu: null as string | null,
        imageUrl: null as string | null,
      } satisfies VerifiedPetRestaurant;
    });

    const restaurants = geocoded.filter((restaurant): restaurant is VerifiedPetRestaurant => restaurant !== null);
    return supplementImagesByName(
      restaurants,
      (restaurant) => `대전 ${restaurant.district} ${restaurant.name} 맛집`,
      restaurants.length
    );
  });
}
