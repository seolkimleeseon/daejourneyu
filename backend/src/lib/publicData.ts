/** 공공데이터포털(data.go.kr) 공용 fetch 헬퍼. */

export function assertPublicDataApiKey(): string {
  const key = process.env.PUBLIC_DATA_API_KEY;
  if (!key) {
    throw new Error("PUBLIC_DATA_API_KEY가 backend/.env에 설정되지 않았어요");
  }
  return key;
}

/** data.go.kr 표준 응답 봉투(response.header/body.items) — 대부분의 공공데이터포털 API가 이 형태를 따른다. */
export interface PublicDataEnvelope<Item> {
  response: {
    header: { resultCode: string; resultMsg: string };
    body: {
      items: { item: Item[] } | Item[] | "";
      numOfRows: number;
      pageNo: number;
      totalCount: number;
    };
  };
}

export function extractItems<Item>(envelope: PublicDataEnvelope<Item>): Item[] {
  const items = envelope.response.body.items;
  if (!items) return [];
  if (Array.isArray(items)) return items;
  return items.item ?? [];
}

export async function fetchPublicDataJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`공공데이터포털 요청 실패: ${res.status} ${res.statusText}`);
  }
  const text = await res.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    // 일부 API는 서비스키 오류 시에도 200 + XML 에러 메세지를 준다. 원문을 그대로 노출해 원인 파악을 쉽게 한다.
    throw new Error(`공공데이터포털 응답이 JSON이 아니에요: ${text.slice(0, 200)}`);
  }
}
