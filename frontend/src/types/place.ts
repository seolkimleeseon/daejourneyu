export type DaejeonDistrict = "유성구" | "중구" | "동구" | "대덕구" | "서구";

export type PlaceCategory = "산책" | "놀이터" | "맛집" | "문화";

export interface Place {
  id: string;
  name: string;
  category: PlaceCategory;
  district: DaejeonDistrict;
  /** 반려동물 동반 조건 설명 (예: "전 견종 · 목줄 필수", "소형견만 가능") */
  condition: string;
  petFriendly: boolean;
  smallDogOnly?: boolean;
  lat: number;
  lng: number;
}
