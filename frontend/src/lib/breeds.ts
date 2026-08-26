import type { PetSize } from "@/types";

/**
 * 견종 사전. 등록 폼의 자동완성과 크기 자동 채우기에 쓴다.
 *
 * 정본은 이 파일이다 — 런타임에 외부 API를 부르지 않는다. PWA라 오프라인에서도 등록이 되어야 하고,
 * 자동완성은 타이핑마다 필터링이라 네트워크를 타면 버벅인다. 목록이 바뀌는 주기도 몇 년 단위다.
 *
 * TODO(data): 지금은 한국에서 흔한 견종 위주의 1차 목록이다. 공공데이터포털
 * "국가동물보호정보시스템 유기동물 조회 서비스"(abandonmentPublicService_v2/kind_v2)에
 * 활용신청이 승인되면 스크립트로 전체 품종을 받아 이 파일을 확장한다. 그때도 UI 코드는 그대로다.
 */
export interface Breed {
  name: string;
  /**
   * 성견 기준 표준 체형. 장소 동반 조건("소형견만 가능") 판정에 쓰이므로 임의로 바꾸지 않는다.
   * 믹스견처럼 체형이 정해지지 않는 견종은 undefined로 두고 자동 채우기를 하지 않는다.
   */
  size?: PetSize;
  /** 줄임말·다른 표기·영문명. 사용자가 실제로 칠 법한 말만 넣는다. */
  aliases: string[];
}

/** 성견 10kg 이하 */
const SMALL: Breed[] = [
  { name: "말티즈", size: "소형견", aliases: ["몰티즈", "말티", "maltese"] },
  { name: "토이푸들", size: "소형견", aliases: ["푸들", "토이 푸들", "toy poodle"] },
  { name: "미니어처푸들", size: "소형견", aliases: ["미니푸들", "miniature poodle"] },
  { name: "포메라니안", size: "소형견", aliases: ["포메", "pomeranian"] },
  { name: "시츄", size: "소형견", aliases: ["시추", "shih tzu"] },
  { name: "치와와", size: "소형견", aliases: ["chihuahua"] },
  { name: "요크셔테리어", size: "소형견", aliases: ["요크셔", "요키", "yorkshire terrier"] },
  { name: "비숑프리제", size: "소형견", aliases: ["비숑", "bichon"] },
  { name: "닥스훈트", size: "소형견", aliases: ["닥스", "다크스훈트", "dachshund"] },
  { name: "미니어처핀셔", size: "소형견", aliases: ["미니핀", "min pin"] },
  { name: "미니어처슈나우저", size: "소형견", aliases: ["슈나우저", "미니슈나우저", "schnauzer"] },
  { name: "파피용", size: "소형견", aliases: ["파피", "papillon"] },
  { name: "페키니즈", size: "소형견", aliases: ["페키", "pekingese"] },
  { name: "퍼그", size: "소형견", aliases: ["pug"] },
  { name: "보스턴테리어", size: "소형견", aliases: ["보스턴", "boston terrier"] },
  { name: "잭러셀테리어", size: "소형견", aliases: ["잭러셀", "jack russell"] },
  { name: "재패니즈스피츠", size: "소형견", aliases: ["스피츠", "spitz"] },
  { name: "웨스트하이랜드화이트테리어", size: "소형견", aliases: ["웨스티", "westie"] },
  { name: "이탈리안그레이하운드", size: "소형견", aliases: ["이글", "italian greyhound"] },
  { name: "말티푸", size: "소형견", aliases: ["말티푸들", "maltipoo"] },
  { name: "폼피츠", size: "소형견", aliases: [] },
];

/** 성견 10~25kg */
const MEDIUM: Breed[] = [
  { name: "프렌치불독", size: "중형견", aliases: ["프렌치불도그", "프렌치", "french bulldog"] },
  { name: "웰시코기", size: "중형견", aliases: ["코기", "펨브록웰시코기", "corgi"] },
  { name: "시바견", size: "중형견", aliases: ["시바", "shiba"] },
  { name: "비글", size: "중형견", aliases: ["beagle"] },
  { name: "보더콜리", size: "중형견", aliases: ["보더", "border collie"] },
  { name: "코커스패니얼", size: "중형견", aliases: ["코카스파니엘", "cocker spaniel"] },
  { name: "진돗개", size: "중형견", aliases: ["진도개", "jindo"] },
  { name: "삽살개", size: "중형견", aliases: ["삽사리", "sapsali"] },
  { name: "셰틀랜드쉽독", size: "중형견", aliases: ["셀티", "셔틀랜드", "sheltie"] },
  { name: "화이트테리어", size: "중형견", aliases: ["화이트"] },
  { name: "불테리어", size: "중형견", aliases: ["bull terrier"] },
  { name: "아메리칸코커스패니얼", size: "중형견", aliases: ["아메코카", "american cocker"] },
  { name: "스탠다드슈나우저", size: "중형견", aliases: ["standard schnauzer"] },
];

/** 성견 25kg 이상 */
const LARGE: Breed[] = [
  { name: "골든리트리버", size: "대형견", aliases: ["골든", "골리", "리트리버", "golden retriever"] },
  { name: "래브라도리트리버", size: "대형견", aliases: ["래브라도", "랩", "labrador"] },
  { name: "시베리안허스키", size: "대형견", aliases: ["허스키", "husky"] },
  { name: "사모예드", size: "대형견", aliases: ["사모", "samoyed"] },
  { name: "저먼셰퍼드", size: "대형견", aliases: ["셰퍼드", "셰파드", "german shepherd"] },
  { name: "도베르만", size: "대형견", aliases: ["doberman"] },
  { name: "로트와일러", size: "대형견", aliases: ["로트", "rottweiler"] },
  { name: "그레이트피레니즈", size: "대형견", aliases: ["피레니즈", "great pyrenees"] },
  { name: "달마시안", size: "대형견", aliases: ["dalmatian"] },
  { name: "아키타", size: "대형견", aliases: ["아키타견", "akita"] },
  { name: "차우차우", size: "대형견", aliases: ["chow chow"] },
  { name: "스탠다드푸들", size: "대형견", aliases: ["standard poodle"] },
  { name: "버니즈마운틴독", size: "대형견", aliases: ["버니즈", "bernese"] },
  { name: "그레이트데인", size: "대형견", aliases: ["데인", "great dane"] },
];

/** 체형이 개체마다 달라 자동 채우기를 하지 않는 항목. */
const UNSIZED: Breed[] = [
  { name: "믹스견", aliases: ["믹스", "잡종", "mixed"] },
];

export const DOG_BREEDS: Breed[] = [...SMALL, ...MEDIUM, ...LARGE, ...UNSIZED];

/** 공백·대소문자 차이로 검색이 빗나가지 않게 맞춘다. */
function normalize(value: string): string {
  return value.replace(/\s+/g, "").toLowerCase();
}

/** 사용자가 친 값이 목록의 견종과 정확히 일치하는지. 크기 자동 채우기 판단에 쓴다. */
export function findBreed(value: string): Breed | null {
  const q = normalize(value);
  if (!q) return null;
  return (
    DOG_BREEDS.find((breed) => normalize(breed.name) === q) ??
    DOG_BREEDS.find((breed) => breed.aliases.some((alias) => normalize(alias) === q)) ??
    null
  );
}

/**
 * 자동완성 후보. 이름이 앞에서부터 맞는 것 → 중간에 포함된 것 → 별칭으로 걸린 것 순으로 준다.
 * 목록에 없는 견종도 그대로 저장할 수 있어야 하므로, 결과가 비어도 입력을 막지 않는다.
 */
export function searchBreeds(query: string, limit = 6): Breed[] {
  const q = normalize(query);
  if (!q) return [];

  const starts: Breed[] = [];
  const contains: Breed[] = [];
  const byAlias: Breed[] = [];

  for (const breed of DOG_BREEDS) {
    const name = normalize(breed.name);
    if (name.startsWith(q)) starts.push(breed);
    else if (name.includes(q)) contains.push(breed);
    else if (breed.aliases.some((alias) => normalize(alias).includes(q))) byAlias.push(breed);
  }

  return [...starts, ...contains, ...byAlias].slice(0, limit);
}
