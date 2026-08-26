import { XMLParser } from "fast-xml-parser";
import { assertPublicDataApiKey } from "./publicData";
import { supplementImagesByName } from "./kakaoLocal";
import { cached } from "./cache";

const ENDPOINT = "https://apis.data.go.kr/6300000/parkInfoDaejeonService/parkInfoDaejeonList";

/** 공원 사진 보충은 카카오 이미지 검색 호출이 추가로 드니 한 번 조회에서 이만큼만 채운다. */
const MAX_IMAGE_SUPPLEMENT_PER_REQUEST = 80;

export interface DaejeonPark {
  id: string;
  name: string;
  address: string;
  /** 소공원/어린이공원/근린공원/역사공원/문화공원/수변공원/묘지공원/체육공원/도시농업공원 */
  section: string;
  lat: number;
  lng: number;
  imageUrl: string | null;
}

interface RawParkItem {
  ntatcSeq: string;
  title: string;
  address: string;
  section: string;
  latitude: string;
  longitude: string;
}

interface RawParkResponse {
  ServiceResult: {
    comMsgHeader: { returnCode: string; returnMessage: string };
    msgHeader: { numOfRows: number; pageNo: number; totalCount: number };
    MsgBody: { items: RawParkItem[] };
  };
}

// 대전 도시공원정보는 _type=json을 줘도 XML로만 응답한다 — <items>가 1건뿐이면 배열이 아니라 객체로 오는 게
// XML→JSON 변환의 흔한 함정이라, isArray로 항상 배열로 강제한다.
const parser = new XMLParser({
  isArray: (name) => name === "items",
});

/** 대전광역시 도시공원 목록을 조회한다(WGS84 좌표 포함, 데이터 품질 가장 좋음). */
export async function fetchDaejeonParks(numOfRows = 50, pageNo = 1): Promise<DaejeonPark[]> {
  const key = assertPublicDataApiKey();

  const parks = await cached(`parks:${pageNo}:${numOfRows}`, 24 * 60 * 60 * 1000, async () => {
    const search = new URLSearchParams({ serviceKey: key, pageNo: String(pageNo), numOfRows: String(numOfRows) });
    const res = await fetch(`${ENDPOINT}?${search.toString()}`);
    if (!res.ok) {
      throw new Error(`대전 도시공원정보 요청 실패: ${res.status} ${res.statusText}`);
    }
    const xml = await res.text();
    const parsed = parser.parse(xml) as RawParkResponse;
    const items = parsed.ServiceResult?.MsgBody?.items ?? [];

    return items
      .map((item) => ({
        id: item.ntatcSeq,
        // 원본 title에 "중   리"처럼 고정폭 공백 패딩이 낀 경우가 있어 연속 공백을 하나로 접는다.
        name: item.title.replace(/\s+/g, " ").trim(),
        address: item.address,
        section: item.section,
        lat: Number(item.latitude),
        lng: Number(item.longitude),
        imageUrl: null as string | null,
      }))
      .filter((park) => Number.isFinite(park.lat) && Number.isFinite(park.lng));
  });

  return supplementImagesByName(parks, (park) => `대전 ${park.name}${park.section}`, MAX_IMAGE_SUPPLEMENT_PER_REQUEST);
}
