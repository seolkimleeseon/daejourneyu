import type { Review } from "@/types";
import { mockReviewTags } from "./reviewTags";

const tagsFor = (...codes: string[]) => mockReviewTags.filter((tag) => codes.includes(tag.code));

export const mockReviews: Review[] = [
  {
    id: "review-7", placeId: "place-1", placeName: "한밭수목원", authorId: "user-6", authorName: "산체형",
    isMine: false, text: "아침에는 한적해서 산체와 천천히 걷기 좋았어요. 목줄을 착용하고 산책로를 이용했습니다.",
    tags: tagsFor("GOOD_WALK", "QUIET", "LEASH_REQUIRED"), likes: 7, liked: false, createdAtLabel: "3일 전",
  },
  {
    id: "review-8", placeId: "place-2", placeName: "계족산 황톳길", authorId: "user-2", authorName: "보리아빠",
    isMine: false, text: "보리와 걷기 좋았지만 일부 구간은 계단이 많아 돌아갔어요. 물은 따로 챙기는 게 편했습니다.",
    tags: tagsFor("GOOD_WALK", "MANY_STAIRS"), likes: 2, liked: false, createdAtLabel: "5일 전",
  },
  {
    id: "review-9", placeId: "place-4", placeName: "유성 반려동물 놀이터", authorId: "user-5", authorName: "초코누나",
    isMine: false, text: "대형견 구역이 분리돼 있어 초코가 편하게 뛰었어요. 한낮에는 그늘이 적었습니다.",
    tags: tagsFor("LARGE_DOG_ZONE", "LACK_SHADE"), likes: 14, liked: false, createdAtLabel: "1주 전",
  },
  {
    id: "review-10", placeId: "place-5", placeName: "댕댕 베이커리", authorId: "user-7", authorName: "마루맘",
    isMine: false, text: "마루와 함께 실내에서 쉬었어요. 반려견 간식 종류가 있어 성분표를 확인하고 골랐습니다.",
    tags: tagsFor("INDOOR_ALLOWED", "PET_MENU", "PET_FRIENDLY_STAFF"), likes: 8, liked: false, createdAtLabel: "2일 전",
  },
  {
    id: "review-11", placeId: "place-6", placeName: "대흥동 감성 카페", authorId: "user-8", authorName: "별이아빠",
    isMine: false, text: "비 오는 날 별이와 방문했어요. 조용한 자리는 편했지만 소형견 동반 조건은 방문 전에 다시 확인했어요.",
    tags: tagsFor("SMALL_DOG_ONLY", "COMFY_SEATING", "QUIET"), likes: 1, liked: false, createdAtLabel: "어제",
  },
  {
    id: "review-12", placeId: "place-7", placeName: "성심당 본점", authorId: "user-3", authorName: "몽이언니",
    isMine: false, text: "매장 안에는 몽이를 데려갈 수 없어 동행인이 포장해 왔어요. 반려견 동반 방문 계획이라면 이 점을 먼저 확인하세요.",
    tags: tagsFor("NOISY"), likes: 5, liked: false, createdAtLabel: "4일 전",
  },
  {
    id: "review-13", placeId: "place-9", placeName: "엑스포과학공원", authorId: "user-1", authorName: "콩이맘",
    isMine: true, text: "콩이와 야외 구역을 걸었어요. 사진 찍기 좋은 곳이 많지만 실내 시설은 동반 조건을 따로 확인해야 합니다.",
    tags: tagsFor("GOOD_WALK", "PHOTO_SPOT"), likes: 10, liked: false, createdAtLabel: "6일 전",
  },
  {
    id: "review-14", placeId: "place-10", placeName: "유성온천 족욕체험장", authorId: "user-4", authorName: "두부아빠",
    isMine: false, text: "두부와 실외 구역만 둘러봤어요. 사람이 많은 시간에는 잠깐 머물다 나오는 편이 낫겠습니다.",
    tags: tagsFor("NOISY", "PHOTO_SPOT"), likes: 0, liked: false, createdAtLabel: "오늘",
  },
  {
    id: "review-15", placeId: "place-11", placeName: "장태산자연휴양림", authorId: "user-2", authorName: "보리아빠",
    isMine: false, text: "숲길 그늘이 좋아 보리와 오래 걸었습니다. 주말 주차 공간은 넉넉하지 않았어요.",
    tags: tagsFor("SHADY", "GOOD_VIEW", "PARKING_HARD"), likes: 16, liked: false, createdAtLabel: "2주 전",
  },
  {
    id: "review-16", placeId: "place-12", placeName: "대전오월드", authorId: "user-7", authorName: "마루맘",
    isMine: false, text: "마루와 야외 구역만 이용했어요. 방문 가능한 구역을 입구에서 먼저 확인하니 동선 잡기가 쉬웠습니다.",
    tags: tagsFor("GOOD_WALK", "PHOTO_SPOT"), likes: 3, liked: false, createdAtLabel: "1주 전",
  },
  {
    id: "review-1",
    placeId: "place-1",
    placeName: "한밭수목원",
    authorId: "user-1",
    authorName: "콩이맘",
    isMine: true,
    text: "물가 산책로가 넓어서 콩이가 신나게 뛰어다녔어요. 목줄은 필수지만 사람도 적당히 붐벼서 좋았습니다.",
    tags: [
      { code: "GOOD_WALK", label: "산책로 좋아요", category: "ENVIRONMENT" },
      { code: "WATER_BOWL", label: "물그릇 제공", category: "AMENITY" },
    ],
    likes: 6,
    liked: false,
    createdAtLabel: "2일 전",
  },
  {
    id: "review-2",
    placeId: "place-4",
    placeName: "유성 반려동물 놀이터",
    authorId: "user-1",
    authorName: "콩이맘",
    isMine: true,
    text: "대형견 구역이 따로 있어서 안심하고 풀어놓을 수 있었어요. 그늘이 부족한 게 아쉬워요.",
    tags: [
      { code: "LARGE_DOG_ZONE", label: "대형견 구역 분리", category: "PET_CONDITION" },
      { code: "LACK_SHADE", label: "그늘 부족", category: "CAUTION" },
    ],
    likes: 3,
    liked: false,
    createdAtLabel: "5일 전",
  },
  {
    id: "review-3",
    placeId: "place-6",
    placeName: "대흥동 감성 카페",
    authorId: "user-2",
    authorName: "모찌아빠",
    isMine: false,
    text: "소형견만 가능하다는 걸 미리 안내해줘서 헷갈리지 않았어요. 자리도 편안했습니다.",
    tags: [
      { code: "SMALL_DOG_ONLY", label: "소형견만", category: "PET_CONDITION" },
      { code: "COMFY_SEATING", label: "좌석 편안해요", category: "AMENITY" },
    ],
    likes: 4,
    liked: false,
    createdAtLabel: "1주 전",
  },
];
