import type { CourseStop } from "./course";

/**
 * 게시물에 박제된 방문 장소. 코스(CourseStop[][])와 달리 일차가 한 줄로 펼쳐져 있어서,
 * 몇 일차 동선이었는지를 장소마다 들고 다닌다.
 */
export interface FeedStop extends CourseStop {
  /** 0-base. 일차를 저장하기 전에 올라간 글은 전부 0이라 하루짜리로 보인다. */
  dayIndex: number;
}

/** FEED 탭에 공유되는 "코스 게시물". 프로토타입의 jyPosts에 대응 */
export interface FeedPost {
  id: string;
  authorName: string;
  authorEmoji: string;
  /** 작성자 반려동물의 MBTI 풀네임 (예: "정겹게 달려가는 페스티벌맨") */
  petTypeName: string;
  isMine: boolean;
  /** 조회 중인 사용자의 반려동물과 유형이 같은지 여부 — "같은 유형" 뱃지 노출용 */
  sameTypeMatch: boolean;
  caption: string;
  text: string;
  stops: FeedStop[];
  /** 자랑하기로 올라온 게시물이 어떤 코스에서 나왔는지. 목데이터 게시물에는 없다. */
  courseId?: string;
  tags: string[];
  likes: number;
  liked: boolean;
  saves: number;
  saved: boolean;
  /** 서버가 내려주는 ISO 문자열. 정렬은 서버가 하므로 화면에서는 표시용으로만 쓴다. */
  createdAt: string;
}
