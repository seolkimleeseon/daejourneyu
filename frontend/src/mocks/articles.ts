import type { Article } from "@/types";

export const mockArticles: Article[] = [
  {
    id: "article-1",
    date: "2026-08-05",
    title: "성심당 말고도, 대전 빵지순례",
    summary: "반려동물과 함께 갈 수 있는 로컬 베이커리 4곳",
    body: "대전 하면 성심당이 먼저 떠오르지만, 골목마다 숨은 베이커리들도 반려동물과 함께 들르기 좋습니다.\n\n다음 코스를 짤 때는 성심당 하나만 고집하지 말고, 주변 로컬 빵집도 같이 묶어 '빵지순례 코스'로 만들어보세요.",
    likes: 128,
    liked: false,
    views: 1204,
  },
  {
    id: "article-2",
    date: "2026-08-12",
    title: "대전 5개 자치구 반려동물 놀이터 완전정복",
    summary: "전국 최초로 5개 구 전체에 반려동물 전용 놀이터가 생긴 대전",
    body: "대전은 전국에서 처음으로 5개 자치구 전체에 반려동물 전용 놀이터를 조성했습니다.\n\n지도 탭에서 '반려동물 놀이터' 필터로 우리 동네에서 가장 가까운 곳을 찾아보세요.",
    likes: 203,
    liked: false,
    views: 2310,
  },
];
