import type { Review } from "@/types";
import { mockReviewTags } from "./reviewTags";

const tagsFor = (...codes: string[]) => mockReviewTags.filter((tag) => codes.includes(tag.code));

type ReviewCase = [string, string, string, string, string, string[], number];
const authorNames: Record<string, string> = {
  "user-1": "콩이맘", "user-2": "보리아빠", "user-3": "몽이언니", "user-4": "두부아빠",
  "user-5": "초코누나", "user-6": "산체형", "user-7": "마루맘", "user-8": "별이아빠",
};
const additionalReviews: ReviewCase[] = [
  ["review-17", "place-1", "한밭수목원", "user-8", "별이가 한적한 길에서는 잘 걸었어요. 주말 오후에는 사람이 많아 짧게 둘러봤습니다.", ["GOOD_WALK", "NOISY"], 2],
  ["review-18", "place-2", "계족산 황톳길", "user-6", "산체와 걷기 좋은 구간이 있었지만 비 온 다음 날은 미끄러운 곳이 있어 조심했습니다.", ["GOOD_WALK", "SLIPPERY_FLOOR"], 4],
  ["review-19", "place-3", "대청호 오백리길", "user-2", "호수 전망이 좋고 보리와 천천히 걷기 편했어요. 길이 길어 물과 쉬는 시간을 넉넉히 잡았습니다.", ["GOOD_VIEW", "GOOD_WALK"], 18],
  ["review-20", "place-4", "유성 반려동물 놀이터", "user-1", "콩이는 작은 개 구역에서 놀았어요. 구역이 나뉘어 있어 다른 크기의 반려견과 동선이 겹치지 않았습니다.", ["LARGE_DOG_ZONE", "GRASS_FIELD"], 5],
  ["review-21", "place-5", "댕댕 베이커리", "user-3", "몽이와 실내에서 쉬면서 간식을 골랐어요. 직원이 반려견 동반 안내를 친절하게 해주셨습니다.", ["INDOOR_ALLOWED", "PET_MENU", "KIND_STAFF"], 12],
  ["review-22", "place-5", "댕댕 베이커리", "user-4", "두부와 잠깐 들렀어요. 사람이 몰리는 시간에는 자리가 적을 수 있어요.", ["INDOOR_ALLOWED", "NOISY"], 1],
  ["review-23", "place-6", "대흥동 감성 카페", "user-7", "마루와 편하게 앉아 쉴 수 있었어요. 소형견 동반 조건은 방문 전에 확인했습니다.", ["SMALL_DOG_ONLY", "COMFY_SEATING"], 6],
  ["review-24", "place-7", "성심당 본점", "user-4", "두부와 함께 매장 안에 들어갈 수 없어 동행인이 포장을 맡았어요. 대기 줄이 길었습니다.", ["NOISY"], 9],
  ["review-25", "place-9", "엑스포과학공원", "user-5", "초코와 야외 공간을 산책했어요. 사진 찍기 좋지만 실내 동반은 별도로 확인해야 합니다.", ["PHOTO_SPOT", "GOOD_WALK"], 7],
  ["review-26", "place-10", "유성온천 족욕체험장", "user-3", "몽이와 실외 구역만 이용했습니다. 사람이 적은 시간에는 조용히 둘러보기 좋아요.", ["QUIET", "PHOTO_SPOT"], 3],
  ["review-27", "place-11", "장태산자연휴양림", "user-6", "산체와 그늘진 길을 걸었어요. 주말에는 주차 공간을 찾는 데 시간이 걸렸습니다.", ["SHADY", "PARKING_HARD"], 11],
  ["review-28", "place-11", "장태산자연휴양림", "user-1", "콩이와 짧은 산책로만 돌았어요. 사진 찍을 곳이 많고 숲 그늘도 넉넉했습니다.", ["SHADY", "PHOTO_SPOT"], 4],
  ["review-29", "place-12", "대전오월드", "user-4", "두부와 야외 구역을 둘러봤어요. 입장 전에 동반 가능한 구역을 안내받는 편이 좋겠습니다.", ["GOOD_WALK", "PHOTO_SPOT"], 8],
  ["review-30", "place-3", "대청호 오백리길", "user-5", "초코와 호숫길을 걸었어요. 넓은 길이 좋았지만 해가 강한 날에는 일찍 움직이는 편이 낫습니다.", ["GOOD_VIEW", "LACK_SHADE"], 14],
];

export const mockReviews: Review[] = [
  ...additionalReviews.map(([id, placeId, placeName, authorId, text, codes, likes], index) => ({
    id, placeId, placeName, authorId, authorName: authorNames[authorId], isMine: authorId === "user-1",
    text, tags: tagsFor(...codes), likes, liked: false, createdAtLabel: `${index + 1}일 전`,
  })),
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
    authorId: "user-2",
    authorName: "보리아빠",
    isMine: false,
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
    authorId: "user-3",
    authorName: "몽이언니",
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
