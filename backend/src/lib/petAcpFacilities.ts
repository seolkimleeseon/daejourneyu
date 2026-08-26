/**
 * 문화체육관광부 "반려동물 동반가능 시설 현황"(2023, 공공데이터포털 파일 배포 15111389) 중
 * 대전 지역 · 여행 카테고리(여행지/카페/박물관/문예회관/미술관)만 정적으로 옮겨둔 목록.
 * 이 데이터셋은 오픈API가 없고 CSV 파일 다운로드만 제공해서, 한 번 내려받아 파싱한 결과를
 * 코드에 시드로 박아둔다 — 갱신되면 이 배열만 다시 교체하면 된다.
 * (동물병원·약국·미용·용품점·위탁관리 등 반려동물 "서비스업" 536건은 코스에 담을 여행 장소가
 * 아니라서 제외했다. 전체 23,929건 중 대전 635건, 그중 이 98건만 해당.)
 */

type PlaceCategory = "산책" | "놀이터" | "맛집" | "문화";

export interface RawPetAcpEntry {
  name: string;
  category: PlaceCategory;
  district: string;
  lat: number;
  lng: number;
  /** 반려동물 동반가능여부(Y/N) */
  petPossible: "Y" | "N";
  /** 입장가능 반려동물 크기 (예: "모두 가능", "10kg 미만", "해당없음") */
  petSize: string;
  /** 반려동물 제한사항 (예: "목줄", "해당없음") */
  petLimit: string;
}

export const PET_ACP_FACILITIES: RawPetAcpEntry[] = [
  { name: "가수원근린공원", category: "산책", district: "서구", lat: 36.29819101, lng: 127.352494, petPossible: "Y", petSize: "모두 가능", petLimit: "목줄" },
  { name: "갈마봉근린공원", category: "산책", district: "유성구", lat: 36.38402393, lng: 127.317422, petPossible: "Y", petSize: "모두 가능", petLimit: "목줄" },
  { name: "갑천근린공원", category: "산책", district: "유성구", lat: 36.35459963, lng: 127.350864, petPossible: "Y", petSize: "모두 가능", petLimit: "목줄" },
  { name: "강아지왈츠 카페", category: "맛집", district: "서구", lat: 36.34872388, lng: 127.382183, petPossible: "Y", petSize: "10kg 미만", petLimit: "불독, 웰시코기, 시바견 입장 불가, 공격성, 입질, 전염질환, 생리 중인 경우 입장 불가" },
  { name: "고래들근린공원", category: "산책", district: "유성구", lat: 36.3865439, lng: 127.30993, petPossible: "Y", petSize: "모두 가능", petLimit: "목줄" },
  { name: "관저문예회관", category: "문화", district: "서구", lat: 36.30167117, lng: 127.33955, petPossible: "N", petSize: "해당없음", petLimit: "해당없음" },
  { name: "관저체육공원", category: "산책", district: "서구", lat: 36.29278461, lng: 127.333588, petPossible: "Y", petSize: "모두 가능", petLimit: "목줄" },
  { name: "구봉근린공원", category: "산책", district: "서구", lat: 36.29242722, lng: 127.344422, petPossible: "Y", petSize: "모두 가능", petLimit: "목줄" },
  { name: "궁동근린공원", category: "산책", district: "유성구", lat: 36.36414435, lng: 127.349258, petPossible: "Y", petSize: "모두 가능", petLimit: "목줄" },
  { name: "금성근린공원", category: "산책", district: "유성구", lat: 36.38753122, lng: 127.348112, petPossible: "Y", petSize: "모두 가능", petLimit: "목줄" },
  { name: "꿈", category: "맛집", district: "유성구", lat: 36.42586127, lng: 127.388107, petPossible: "Y", petSize: "모두 가능", petLimit: "제한사항 없음" },
  { name: "남선공원", category: "산책", district: "서구", lat: 36.34623037, lng: 127.397991, petPossible: "Y", petSize: "모두 가능", petLimit: "목줄, 배변봉투" },
  { name: "남철미술관", category: "문화", district: "서구", lat: 36.33897188, lng: 127.375968, petPossible: "N", petSize: "해당없음", petLimit: "해당없음" },
  { name: "냥다방", category: "맛집", district: "서구", lat: 36.35295741, lng: 127.377795, petPossible: "Y", petSize: "모두 가능", petLimit: "제한사항 없음" },
  { name: "너구리와친구들", category: "맛집", district: "서구", lat: 36.35189717, lng: 127.37574, petPossible: "Y", petSize: "모두 가능", petLimit: "제한사항 없음" },
  { name: "느리울근린공원", category: "산책", district: "서구", lat: 36.29971867, lng: 127.342487, petPossible: "Y", petSize: "모두 가능", petLimit: "목줄" },
  { name: "대골근린공원", category: "산책", district: "유성구", lat: 36.37556862, lng: 127.334262, petPossible: "Y", petSize: "모두 가능", petLimit: "목줄" },
  { name: "대덕문예회관", category: "문화", district: "대덕구", lat: 36.37411504, lng: 127.420651, petPossible: "N", petSize: "해당없음", petLimit: "해당없음" },
  { name: "대전대학교박물관", category: "문화", district: "동구", lat: 36.33669617, lng: 127.459002, petPossible: "Y", petSize: "모두 가능", petLimit: "야외만 반려동물 동반 가능" },
  { name: "대전선사박물관", category: "문화", district: "유성구", lat: 36.37191134, lng: 127.32384, petPossible: "Y", petSize: "모두 가능", petLimit: "야외만 반려동물 동반 가능" },
  { name: "대전시립미술관", category: "문화", district: "서구", lat: 36.36704787, lng: 127.385726, petPossible: "N", petSize: "해당없음", petLimit: "해당없음" },
  { name: "대전시립박물관", category: "문화", district: "유성구", lat: 36.33685903, lng: 127.33534, petPossible: "Y", petSize: "모두 가능", petLimit: "야외만 반려동물 동반 가능" },
  { name: "대전시립연정국악원", category: "문화", district: "서구", lat: 36.36634129, lng: 127.389383, petPossible: "N", petSize: "해당없음", petLimit: "해당없음" },
  { name: "대전예술가의집", category: "문화", district: "중구", lat: 36.32245342, lng: 127.416099, petPossible: "N", petSize: "해당없음", petLimit: "해당없음" },
  { name: "대전예술의전당", category: "문화", district: "서구", lat: 36.3666138, lng: 127.383759, petPossible: "N", petSize: "해당없음", petLimit: "해당없음" },
  { name: "대청호반자연생태공원", category: "산책", district: "동구", lat: 36.37267216, lng: 127.474852, petPossible: "Y", petSize: "모두 가능", petLimit: "목줄, 배변봉투" },
  { name: "댕라운지", category: "맛집", district: "서구", lat: 36.36138851, lng: 127.378426, petPossible: "Y", petSize: "모두 가능", petLimit: "제한사항 없음" },
  { name: "덕산근린공원", category: "산책", district: "유성구", lat: 36.37554471, lng: 127.306656, petPossible: "Y", petSize: "모두 가능", petLimit: "목줄" },
  { name: "도안문화공원", category: "산책", district: "유성구", lat: 36.33685903, lng: 127.33534, petPossible: "Y", petSize: "모두 가능", petLimit: "목줄" },
  { name: "도안숲공원", category: "산책", district: "서구", lat: 36.31877973, lng: 127.342464, petPossible: "Y", petSize: "모두 가능", petLimit: "목줄" },
  { name: "두레샘골근린공원", category: "산책", district: "유성구", lat: 36.38088409, lng: 127.336126, petPossible: "Y", petSize: "모두 가능", petLimit: "목줄" },
  { name: "두루봉근린공원", category: "산책", district: "유성구", lat: 36.37923521, lng: 127.32146, petPossible: "Y", petSize: "모두 가능", petLimit: "목줄" },
  { name: "둔산선사유적지", category: "산책", district: "서구", lat: 36.36095306, lng: 127.378937, petPossible: "Y", petSize: "모두 가능", petLimit: "목줄" },
  { name: "들의공원", category: "산책", district: "서구", lat: 36.36268299, lng: 127.384904, petPossible: "Y", petSize: "모두 가능", petLimit: "목줄" },
  { name: "뚜드림", category: "맛집", district: "유성구", lat: 36.38675549, lng: 127.309132, petPossible: "Y", petSize: "모두 가능", petLimit: "제한사항 없음" },
  { name: "라노보", category: "맛집", district: "동구", lat: 36.34972753, lng: 127.44353, petPossible: "Y", petSize: "모두 가능", petLimit: "제한사항 없음" },
  { name: "루카의하루", category: "맛집", district: "유성구", lat: 36.34701932, lng: 127.296164, petPossible: "Y", petSize: "12kg 미만", petLimit: "입질, 공격성 있는 경우 입장 제한" },
  { name: "메이드인선", category: "맛집", district: "유성구", lat: 36.36930711, lng: 127.314264, petPossible: "Y", petSize: "모두 가능", petLimit: "제한사항 없음" },
  { name: "모던팬트리", category: "맛집", district: "유성구", lat: 36.33624966, lng: 127.339106, petPossible: "Y", petSize: "모두 가능", petLimit: "제한사항 없음" },
  { name: "몽그라운드", category: "맛집", district: "중구", lat: 36.33493651, lng: 127.403943, petPossible: "Y", petSize: "모두 가능", petLimit: "제한사항 없음" },
  { name: "배재대학교박물관", category: "문화", district: "서구", lat: 36.32323828, lng: 127.366074, petPossible: "Y", petSize: "모두 가능", petLimit: "야외만 반려동물 동반 가능" },
  { name: "사정소류지", category: "산책", district: "중구", lat: 36.29660676, lng: 127.397995, petPossible: "Y", petSize: "모두 가능", petLimit: "목줄" },
  { name: "상대근린공원", category: "산책", district: "유성구", lat: 36.34441607, lng: 127.331972, petPossible: "Y", petSize: "모두 가능", petLimit: "목줄" },
  { name: "상소동산림욕장", category: "산책", district: "동구", lat: 36.23328708, lng: 127.472082, petPossible: "Y", petSize: "모두 가능", petLimit: "목줄, 배변봉투" },
  { name: "서당골근린공원", category: "산책", district: "유성구", lat: 36.37023325, lng: 127.331892, petPossible: "Y", petSize: "모두 가능", petLimit: "목줄" },
  { name: "성암미술관", category: "문화", district: "유성구", lat: 36.35367969, lng: 127.348841, petPossible: "N", petSize: "해당없음", petLimit: "해당없음" },
  { name: "세미래공원", category: "산책", district: "유성구", lat: 36.39756458, lng: 127.308018, petPossible: "Y", petSize: "모두 가능", petLimit: "목줄" },
  { name: "소라실근린공원", category: "산책", district: "유성구", lat: 36.38676917, lng: 127.312532, petPossible: "Y", petSize: "모두 가능", petLimit: "목줄" },
  { name: "소태근린공원", category: "산책", district: "서구", lat: 36.31705996, lng: 127.346609, petPossible: "Y", petSize: "모두 가능", petLimit: "목줄" },
  { name: "송림근린공원", category: "산책", district: "유성구", lat: 36.38620074, lng: 127.319541, petPossible: "Y", petSize: "모두 가능", petLimit: "목줄" },
  { name: "수천이들근린공원", category: "산책", district: "유성구", lat: 36.39381131, lng: 127.3532, petPossible: "Y", petSize: "모두 가능", petLimit: "목줄" },
  { name: "신선암근린공원", category: "산책", district: "서구", lat: 36.29817053, lng: 127.334044, petPossible: "Y", petSize: "모두 가능", petLimit: "목줄" },
  { name: "신탄진휴게소 반려견놀이터", category: "산책", district: "대덕구", lat: 36.42560177, lng: 127.418666, petPossible: "Y", petSize: "모두 가능", petLimit: "배변봉투" },
  { name: "애니플 반려문화교육센터 앤 퍼피스그린", category: "맛집", district: "유성구", lat: 36.28658787, lng: 127.253189, petPossible: "Y", petSize: "12kg 미만", petLimit: "제한사항 없음" },
  { name: "엑스포다리", category: "산책", district: "유성구", lat: 36.37535245, lng: 127.386308, petPossible: "Y", petSize: "모두 가능", petLimit: "목줄, 배변봉투" },
  { name: "여진불교미술관", category: "문화", district: "유성구", lat: 36.41077032, lng: 127.406116, petPossible: "N", petSize: "해당없음", petLimit: "해당없음" },
  { name: "옛터민속박물관", category: "문화", district: "동구", lat: 36.21510494, lng: 127.440844, petPossible: "Y", petSize: "모두 가능", petLimit: "야외만 반려동물 동반 가능" },
  { name: "오리골근린공원", category: "산책", district: "유성구", lat: 36.4008503, lng: 127.362717, petPossible: "Y", petSize: "모두 가능", petLimit: "목줄" },
  { name: "오푼", category: "맛집", district: "서구", lat: 36.33958148, lng: 127.390039, petPossible: "Y", petSize: "모두 가능", petLimit: "매너벨트 필수" },
  { name: "옥녀봉체육공원", category: "산책", district: "서구", lat: 36.3317391, lng: 127.34483, petPossible: "Y", petSize: "모두 가능", petLimit: "목줄" },
  { name: "와동245", category: "맛집", district: "대덕구", lat: 36.4125425, lng: 127.424046, petPossible: "Y", petSize: "주말 및 공휴일은 13kg 이하", petLimit: "제한사항 없음" },
  { name: "용반들근린공원", category: "산책", district: "유성구", lat: 36.35204245, lng: 127.34229, petPossible: "Y", petSize: "모두 가능", petLimit: "목줄" },
  { name: "유림공원", category: "산책", district: "유성구", lat: 36.3606845, lng: 127.357688, petPossible: "Y", petSize: "모두 가능", petLimit: "목줄" },
  { name: "은구비공원", category: "산책", district: "유성구", lat: 36.37503773, lng: 127.323363, petPossible: "Y", petSize: "모두 가능", petLimit: "목줄" },
  { name: "은평공원", category: "산책", district: "서구", lat: 36.35946928, lng: 127.363506, petPossible: "Y", petSize: "모두 가능", petLimit: "목줄" },
  { name: "이누인", category: "맛집", district: "유성구", lat: 36.27332553, lng: 127.288635, petPossible: "Y", petSize: "모두 가능", petLimit: "제한사항 없음" },
  { name: "이응노미술관", category: "문화", district: "서구", lat: 36.36686823, lng: 127.387019, petPossible: "N", petSize: "해당없음", petLimit: "해당없음" },
  { name: "자운근린공원", category: "산책", district: "유성구", lat: 36.39655746, lng: 127.351271, petPossible: "Y", petSize: "모두 가능", petLimit: "목줄" },
  { name: "작은내수변공원", category: "산책", district: "유성구", lat: 36.34176555, lng: 127.341998, petPossible: "Y", petSize: "모두 가능", petLimit: "목줄" },
  { name: "장갓골근린공원", category: "산책", district: "서구", lat: 36.30099511, lng: 127.33051, petPossible: "Y", petSize: "모두 가능", petLimit: "목줄" },
  { name: "장현근린공원", category: "산책", district: "유성구", lat: 36.36132686, lng: 127.343057, petPossible: "Y", petSize: "모두 가능", petLimit: "목줄" },
  { name: "정부대전청사숲의공원A", category: "산책", district: "서구", lat: 36.36268299, lng: 127.384904, petPossible: "Y", petSize: "모두 가능", petLimit: "목줄" },
  { name: "정부대전청사숲의공원B", category: "산책", district: "서구", lat: 36.36268299, lng: 127.384904, petPossible: "Y", petSize: "모두 가능", petLimit: "목줄" },
  { name: "정부대전청사자연마당", category: "산책", district: "서구", lat: 36.35877314, lng: 127.384881, petPossible: "Y", petSize: "모두 가능", petLimit: "목줄" },
  { name: "죽동근린공원", category: "산책", district: "유성구", lat: 36.37413835, lng: 127.336737, petPossible: "Y", petSize: "모두 가능", petLimit: "목줄" },
  { name: "진잠근린공원", category: "산책", district: "유성구", lat: 36.29461195, lng: 127.320607, petPossible: "Y", petSize: "모두 가능", petLimit: "목줄" },
  { name: "천년근린공원", category: "산책", district: "유성구", lat: 36.34256958, lng: 127.337496, petPossible: "Y", petSize: "모두 가능", petLimit: "목줄" },
  { name: "충남대학교 자연사박물관", category: "문화", district: "유성구", lat: 36.36832812, lng: 127.341662, petPossible: "Y", petSize: "모두 가능", petLimit: "야외만 반려동물 동반 가능" },
  { name: "충남대학교박물관", category: "문화", district: "유성구", lat: 36.36832812, lng: 127.341662, petPossible: "Y", petSize: "모두 가능", petLimit: "야외만 반려동물 동반 가능" },
  { name: "카페 포레스트", category: "맛집", district: "대덕구", lat: 36.46999596, lng: 127.472323, petPossible: "Y", petSize: "모두 가능", petLimit: "케이지 지참 시 실내 동반 가능, 미지참 시 1층 야외테라스 건물 앞 뒤 만 동반 가능, 목줄 필수" },
  { name: "카페사계절", category: "맛집", district: "중구", lat: 36.26938625, lng: 127.399391, petPossible: "Y", petSize: "모두 가능", petLimit: "제한사항 없음" },
  { name: "커피타임", category: "맛집", district: "대덕구", lat: 36.36476714, lng: 127.427119, petPossible: "Y", petSize: "모두 가능", petLimit: "제한사항 없음" },
  { name: "쿠쿠펫 애견카페", category: "맛집", district: "유성구", lat: 36.34238192, lng: 127.342701, petPossible: "Y", petSize: "15kg 미만", petLimit: "매너벨트, 안거나 목줄 착용" },
  { name: "퍼피스그린", category: "맛집", district: "유성구", lat: 36.28658787, lng: 127.253189, petPossible: "Y", petSize: "모두 가능", petLimit: "제한사항 없음" },
  { name: "피터펫", category: "맛집", district: "서구", lat: 36.34576454, lng: 127.401442, petPossible: "Y", petSize: "모두 가능", petLimit: "제한사항 없음" },
  { name: "하늘아래공원", category: "산책", district: "서구", lat: 36.29298998, lng: 127.335204, petPossible: "Y", petSize: "모두 가능", petLimit: "목줄" },
  { name: "한국수자원공사 대청댐물문화관", category: "문화", district: "대덕구", lat: 36.47443489, lng: 127.481538, petPossible: "Y", petSize: "모두 가능", petLimit: "야외만 반려동물 동반 가능" },
  { name: "한국조폐공사 화폐박물관", category: "문화", district: "유성구", lat: 36.37847117, lng: 127.370534, petPossible: "Y", petSize: "모두 가능", petLimit: "야외만 반려동물 동반 가능" },
  { name: "한국족보박물관", category: "문화", district: "중구", lat: 36.28538043, lng: 127.3883, petPossible: "Y", petSize: "모두 가능", petLimit: "야외만 반려동물 동반 가능" },
  { name: "한국지질자원연구원 지질박물관", category: "문화", district: "유성구", lat: 36.38105757, lng: 127.357358, petPossible: "Y", petSize: "모두 가능", petLimit: "야외만 반려동물 동반 가능" },
  { name: "한남대학교 자연사박물관", category: "문화", district: "대덕구", lat: 36.35279952, lng: 127.423309, petPossible: "Y", petSize: "모두 가능", petLimit: "야외만 반려동물 동반 가능" },
  { name: "한남대학교 중앙박물관", category: "문화", district: "대덕구", lat: 36.35279952, lng: 127.423309, petPossible: "Y", petSize: "모두 가능", petLimit: "야외만 반려동물 동반 가능" },
  { name: "한밭교육박물관", category: "문화", district: "동구", lat: 36.33739295, lng: 127.428797, petPossible: "N", petSize: "해당없음", petLimit: "해당없음" },
  { name: "한밭수목원", category: "산책", district: "서구", lat: 36.36646902, lng: 127.388017, petPossible: "Y", petSize: "모두 가능", petLimit: "목줄" },
  { name: "해랑숲공원", category: "산책", district: "유성구", lat: 36.38643196, lng: 127.30816, petPossible: "Y", petSize: "모두 가능", petLimit: "목줄" },
  { name: "헤이독 애견카페", category: "맛집", district: "중구", lat: 36.32673416, lng: 127.428331, petPossible: "Y", petSize: "모두 가능", petLimit: "제한사항 없음" },
  { name: "DAZE", category: "맛집", district: "중구", lat: 36.32763693, lng: 127.429569, petPossible: "Y", petSize: "모두 가능", petLimit: "제한사항 없음" },
  { name: "KAIST비전관", category: "문화", district: "유성구", lat: 36.36828278, lng: 127.356982, petPossible: "Y", petSize: "모두 가능", petLimit: "야외만 반려동물 동반 가능" },];
