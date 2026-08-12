export interface Review {
  id: string;
  placeId: string;
  placeName: string;
  authorId: string;
  authorName: string;
  isMine: boolean;
  text: string;
  tags: string[];
  photoUrl?: string;
  likes: number;
  liked: boolean;
  /** 프로토타입과 동일하게 상대시간 라벨 문자열로 표기 (예: "2일 전") */
  createdAtLabel: string;
}
