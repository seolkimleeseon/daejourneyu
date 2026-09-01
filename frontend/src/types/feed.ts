import type { CourseStop } from "./course";

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
  stops: CourseStop[];
  /** 자랑하기로 올라온 게시물이 어떤 코스에서 나왔는지. 목데이터 게시물에는 없다. */
  courseId?: string;
  tags: string[];
  likes: number;
  liked: boolean;
  saves: number;
  saved: boolean;
}
