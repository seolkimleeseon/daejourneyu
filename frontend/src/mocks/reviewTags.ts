import type { ReviewTagOption } from "@/types";

/**
 * 후기 작성 화면의 태그 사전 — 백엔드 `backend/prisma/seed.ts`의 reviewTagOptions와 동일한
 * code/label/category로 맞춰뒀다. GET /api/reviews/tags 실패 시(로컬에서 DB가 안 떠 있는 경우 등)
 * 화면 구성 자체는 볼 수 있도록 하는 폴백 데이터다 — 실제 저장은 서버가 살아있어야 가능하다.
 */
export const mockReviewTags: ReviewTagOption[] = [
  // 반려동물 동반 조건
  { code: "LEASH_REQUIRED", label: "목줄 필수", category: "PET_CONDITION" },
  { code: "SMALL_DOG_ONLY", label: "소형견만", category: "PET_CONDITION" },
  { code: "LARGE_DOG_OK", label: "대형견 동반 가능", category: "PET_CONDITION" },
  { code: "LARGE_DOG_ZONE", label: "대형견 구역 분리", category: "PET_CONDITION" },
  { code: "INDOOR_ALLOWED", label: "실내 동반 가능", category: "PET_CONDITION" },
  { code: "WASTE_BAG_PROVIDED", label: "배변봉투 비치", category: "PET_CONDITION" },
  { code: "PET_MENU", label: "반려동물 전용 메뉴/간식", category: "PET_CONDITION" },
  // 공간 · 환경
  { code: "GOOD_WALK", label: "산책로 좋아요", category: "ENVIRONMENT" },
  { code: "GRASS_FIELD", label: "잔디밭 있어요", category: "ENVIRONMENT" },
  { code: "SHADY", label: "그늘 많아요", category: "ENVIRONMENT" },
  { code: "GOOD_VIEW", label: "경치 좋아요", category: "ENVIRONMENT" },
  { code: "QUIET", label: "조용해요", category: "ENVIRONMENT" },
  // 편의시설
  { code: "WATER_BOWL", label: "물그릇 제공", category: "AMENITY" },
  { code: "PARKING_EASY", label: "주차 편해요", category: "AMENITY" },
  { code: "CLEAN_RESTROOM", label: "화장실 깨끗해요", category: "AMENITY" },
  { code: "COMFY_SEATING", label: "좌석 편안해요", category: "AMENITY" },
  // 서비스 · 분위기
  { code: "KIND_STAFF", label: "직원이 친절해요", category: "SERVICE" },
  { code: "PET_FRIENDLY_STAFF", label: "반려동물에 친절해요", category: "SERVICE" },
  { code: "PHOTO_SPOT", label: "사진찍기 좋아요", category: "SERVICE" },
  { code: "REASONABLE_PRICE", label: "가격이 합리적이에요", category: "SERVICE" },
  // 주의할 점
  { code: "LACK_SHADE", label: "그늘 부족", category: "CAUTION" },
  { code: "MANY_STAIRS", label: "계단 많아요", category: "CAUTION" },
  { code: "NOISY", label: "소음 있어요", category: "CAUTION" },
  { code: "SLIPPERY_FLOOR", label: "바닥이 미끄러워요", category: "CAUTION" },
  { code: "PARKING_HARD", label: "주차 불편해요", category: "CAUTION" },
];
