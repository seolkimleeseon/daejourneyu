export interface Article {
  id: string;
  /** YYYY-MM-DD */
  date: string;
  title: string;
  summary: string;
  body: string;
  likes: number;
  liked: boolean;
  views: number;
  /** 목록 썸네일과 상세 상단에 쓰는 대표 이미지. 없으면 신문 이모지로 대체한다. */
  imageUrl?: string;
  /** 본문 중간에 곁들이는 추가 사진. 소제목(`## `)마다 하나씩 순서대로 끼워 넣는다. */
  images?: string[];
  /** 본문에서 언급한 실제 장소 이름(Place.name과 일치). 상세 화면 맨 아래 "이 아티클에 나온 장소"
   * 목록에서 각각 `/place/[name]`으로 연결한다. */
  places?: string[];
}
