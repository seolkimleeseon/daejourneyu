import { redirect } from "next/navigation";

/**
 * 코스 상세의 '이 코스 둘러보기에 공유하기' 진입점.
 * 실제 화면은 게시물을 만드는 쪽(FEED)이 소유하므로 `/feed/share`로 넘긴다 — 여기서는 코스만 실어 보낸다.
 */
export default function CourseSharePage({ params }: { params: { courseId: string } }) {
  redirect(`/feed/share?courseId=${encodeURIComponent(params.courseId)}`);
}
