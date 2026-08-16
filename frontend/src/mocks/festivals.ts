import type { FestivalEvent } from "@/types";

export const mockFestivals: FestivalEvent[] = [
  {
    id: "festival-1",
    date: "2026-08-23",
    title: "유성 반려동물 마켓",
    place: "유성 반려동물 놀이터",
    time: "10:00~17:00",
    petFriendly: true,
    condition: "전 견종 동반 가능",
    instagramUrl: "https://www.instagram.com/daejourneyu",
    webUrl: "https://blog.naver.com/daejourneyu",
  },
  {
    id: "festival-2",
    date: "2026-08-30",
    title: "대전 빵지순례 페스타",
    place: "대전역 일원",
    time: "10:00~20:00",
    petFriendly: false,
    webUrl: "https://blog.naver.com/daejourneyu",
  },
];
