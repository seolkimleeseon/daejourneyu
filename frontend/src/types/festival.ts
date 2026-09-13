export interface FestivalEvent {
  id: string;
  /** YYYY-MM-DD — 시작일 */
  date: string;
  /** YYYY-MM-DD — 종료일. 당일 행사면 없음(date와 동일하게 취급) */
  endDate?: string;
  title: string;
  place: string;
  /** 공공데이터에 시간 정보가 없는 경우도 있어 선택값 */
  time?: string;
  petFriendly: boolean;
  /** true면 petFriendly=false가 "동반 불가" 확정이 아니라 "검증된 정보 없음"이라는 뜻(일반 축제 API 공통) */
  petFriendlyUnknown?: boolean;
  /** 행사 좌표 인근에 반려동반 인증 장소가 있다는 뜻 — 행사 자체의 동반 허용을 보장하진 않음 */
  venuePetFriendly?: boolean;
  condition?: string;
  webUrl?: string;
  instagramUrl?: string;
}
