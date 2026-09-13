/** 후기 태그 — 자유 입력 불가, GET /api/reviews/tags가 내려주는 사전에서만 고른다. */
export interface ReviewTagOption {
  code: string;
  label: string;
  /** "PET_CONDITION" | "ENVIRONMENT" | "AMENITY" | "SERVICE" | "CAUTION" */
  category: string;
}

export interface Review {
  id: string;
  placeId: string;
  placeName: string;
  authorId: string;
  authorName: string;
  isMine: boolean;
  /** 선택 입력 — 빈 문자열일 수 있다. */
  text: string;
  /** 최소 1개~최대 5개(서버가 검증). 사전에 없는 태그는 만들 수 없다. */
  tags: ReviewTagOption[];
  /** 선택 입력. 아직 별도 이미지 스토리지가 없어 data URL을 그대로 저장한다. */
  photoUrl?: string;
  likes: number;
  liked: boolean;
  /** 프로토타입과 동일하게 상대시간 라벨 문자열로 표기 (예: "2일 전") */
  createdAtLabel: string;
}
