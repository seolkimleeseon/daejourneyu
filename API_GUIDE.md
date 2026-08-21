# 대저니유 — 공공데이터 API 가이드

> 원본 상세 스펙(요청 파라미터 전체)은 [`API_SPEC.md`](./API_SPEC.md) 참고. 이 문서는 "우리가 어떻게 쓰고 있는지 / 뭘 확인했는지" 요약본 — 팀 공유용.
> 마지막 업데이트: 2026-08-13

---

## 1. 아키텍처

```
프론트(Next.js, :3000)
   └─ fetch("/api/…")
         │  next.config.mjs의 rewrites()가 프록시
         ▼
백엔드(Express, :4000, backend/)
   └─ backend/src/routes/*.ts → backend/src/lib/*.ts
         │  (인증키 붙여서 호출)
         ▼
공공데이터포털 data.go.kr
```

- **프론트는 공공데이터포털 키를 직접 다루지 않는다.** data.go.kr API는 브라우저 CORS를 막아둔 경우가 많고, 키를 클라이언트 번들에 넣으면 노출되기 때문에 반드시 백엔드에서만 호출한다.
- 인증키는 `backend/.env`의 `PUBLIC_DATA_API_KEY`. **이 문서/노션에는 키 값을 적지 않는다** — 필요하면 팀 시크릿 저장소나 `.env` 파일 자체를 확인할 것.
- data.go.kr 서비스키는 **계정 단위 발급**이라, 승인받은 API 전부에서 같은 키를 재사용한다.

---

## 2. 지금 구현된 API (✅ 실사용 중)

| 우리 엔드포인트 | 원본 API | 백엔드 코드 | 용도 |
|---|---|---|---|
| `GET /api/weather?lat=&lng=` | 기상청 단기예보조회(`getVilageFcst`) | `backend/src/routes/weather.ts` | 날씨 정보 |
| `GET /api/pet-tour-spots?contentTypeId=&sigunguCode=&numOfRows=` | 한국관광공사 반려동물 동반여행(`KorPetTourService2`) | `backend/src/routes/petTourSpots.ts` | 코스 위저드 장소 후보(반려동물 동반 인증) |
| `GET /api/daejeon/:dataset` (`culture`\|`lodging`\|`shopping`\|`restaurant`\|`tourspot`\|`festival`) | 대전시 `openapi2022` 6종 | `backend/src/routes/daejeon.ts` | 원본 그대로 프록시 — 응답 타입 아직 안 좁힘 |

프론트에서 실제로 소비하는 곳: `frontend/src/hooks/usePetTourSpots.ts` (TanStack Query 훅) → `frontend/src/lib/petTourMapper.ts` (우리 `Place` 타입으로 변환) → `PlacePickerSheet` / MBTI 코스 생성.

---

## 3. 실제 데이터 조사 결과 (2026-08-13 확인)

### 3-1. 한국관광공사 반려동물 동반여행(KorPetTourService2) — 대전(areaCode=3)

| 관광타입 | 건수 |
|---|---|
| 관광지(12) | 7 |
| 문화시설(14) | 0 |
| 레포츠(28) | 0 |
| 숙박(32) | 1 |
| 음식점(39) | 0 |
| **합계** | **8** |

⚠️ **대전 지역은 이 API에 데이터가 거의 없다.** 문화시설·레포츠·음식점은 0건. 그래서 코스 위저드에서는 카테고리별로 부족한 만큼 `mockPlaces`로 채우는 로직(`ensureCategoryMinimum`)을 따로 넣어뒀다.

### 3-2. 대전광역시 openapi2022 (일반 데이터, 반려동물 필터 없음)

| 데이터셋 | 건수 | 좌표(위경도) |
|---|---|---|
| 문화시설 | 131 | ❌ 없음 |
| 숙박 | 162 | ❌ 없음 |
| 모범음식점 | 121 | ✅ `mapLat`/`mapLot` |
| 관광지 | 142 | ✅ `mapLat`/`mapLot` (일부 `"0","0"`으로 비어있음) |
| 축제 | 13 | ❌ 없음 |
| 쇼핑 | 12 | ✅ `mapLat`/`mapLot` |

이쪽은 데이터가 훨씬 많지만 **"반려동물 동반 가능" 필드가 아예 없다.** 코스 생성에 그대로 쓰면 반려동물 동반 불가 장소가 섞일 수 있어서, 쓰려면 별도 필터링 기준이 필요하다.

### 3-3. 한국관광공사 국문 관광정보(KorService2) — 대전, §3-1과 직접 비교

`KorPetTourService2`(반려동물 특화)와 응답 스키마가 완전히 동일한 "일반" 관광정보 API. 대전 지역 건수를 나란히 비교하면:

| 관광타입 | KorPetTourService2(§3-1, 반려동물 인증) | KorService2(일반) |
|---|---|---|
| 관광지(12) | 7 | **84** |
| 문화시설(14) | 0 | **21** |
| 축제(15) | — | **9** |
| 레포츠(28) | 0 | **10** |
| 숙박(32) | 1 | **13** |
| 쇼핑(38) | — | **15** |
| 음식점(39) | 0 | **142** |

**데이터 양은 압도적으로 많지만(약 294건 vs 8건), 반려동물 동반 가능 여부를 보장 안 해준다.** 대신 스키마가 똑같아서(`contentid`/`title`/`addr1`/`mapx`/`mapy`/`firstimage`) 지금 `petTourMapper.ts` 코드를 거의 그대로 재사용할 수 있다 — "일단 이걸로 장소 풀을 넓히고, 반려동반 여부는 별도 필터(리뷰 태그·수동 큐레이션 등)로 보정" 전략이 현실적인 선택지.

### 3-4. 그 외 확인해본 것들 (2026-08-13 직접 호출)

| API | 결과 | 좌표 | 비고 |
|---|---|---|---|
| 23. 행정안전부 동물병원 조회 | ✅ 대전 필터 209건 | ⚠️ `CRD_INFO_X/Y` — **WGS84 위경도가 아닌 별도 좌표계**(값이 `234467.59` 같은 큰 숫자, 도로명주소 기반 사업자 좌표계로 추정) | 병원명(`BPLC_NM`)·도로명주소(`ROAD_NM_ADDR`)·전화(`TELNO`)·영업상태(`SALS_STTS_NM`)는 바로 씀직함. 카카오맵에 찍으려면 좌표 변환하거나 주소로 재지오코딩 필요 |
| 13. 대전 유기동물공고 현황 | ✅ 3,810건(매일 갱신, XML 고정) | ❌ 없음(`foundPlace` 텍스트만) | 좌표가 없어서 지도 연동 불가, 리스트/카드 UI로만 가능 |
| 11. 대전 도시공원정보 | ✅ 대전 412건(XML 고정) | ✅ `latitude`/`longitude` — **WGS84, 카카오맵 바로 사용 가능** | 공원명·주소·면적·공원구분(소공원/근린공원 등) 포함. 지금까지 확인한 것 중 **좌표 품질이 가장 좋음** |
| 25. 관광지 집중률 예측 | ❌ 실패 — `signguCd` 필수 파라미터 누락 에러 | — | 관광공사가 별도로 배포하는 "관광지_시군구_코드정보" 참고파일이 있어야 호출 가능. 코드 목록을 못 구해서 이번엔 검증 못함 |
| 19. 에어코리아 대기오염통계 | ✅ 대전 5개 구 전부 실시간 반환 | ❌ 좌표는 없지만 **구 이름이 우리 `DaejeonDistrict` 타입과 정확히 일치**(대덕구/동구/서구/유성구/중구) | PM10·PM2.5·오존·통합대기지수(`khaiValue`) 등 실시간 값. 구 단위라 좌표 매핑 없이 바로 "이 구는 공기 좋음/나쁨" 배지에 쓸 수 있음 |

---

## 4. 카카오맵 연동 관점 — 좌표 데이터 품질 정리

나중에 카카오맵에 마커로 찍으려면 **WGS84 위경도(소수점 위경도, 예: `36.35, 127.38`)**가 필요하다. 지금까지 확인한 데이터셋을 그 기준으로 다시 정리하면:

| 즉시 카카오맵에 찍을 수 있음 (WGS84) | 좌표는 있지만 변환/보정 필요 | 좌표 아예 없음(지오코딩 필요) |
|---|---|---|
| KorPetTourService2 (`mapx`/`mapy`) | 행정안전부 동물병원 (`CRD_INFO_X/Y` — 별도 좌표계) | 대전 문화시설 |
| KorService2 (`mapx`/`mapy`) | | 대전 숙박정보 |
| 대전 모범음식점 (`mapLat`/`mapLot`) | | 대전 축제 |
| 대전 관광지 (`mapLat`/`mapLot`, 일부 `0,0` 결측) | | 대전 유기동물공고 |
| 대전 쇼핑 (`mapLat`/`mapLot`) | | 에어코리아 대기오염(구 단위라 대표좌표 필요) |
| **대전 도시공원정보** (`latitude`/`longitude`) | | |

카카오맵 연동을 시작한다면 **좌표 이미 있는 6개**부터 우선 붙이는 게 제일 효율적이고, 그중에서도 **대전 도시공원정보(412건, 좌표 정확)**와 **대전 모범음식점/관광지(합쳐서 250건 이상)**가 지금까지 본 것 중 데이터 양·좌표 품질 둘 다 제일 좋다.

---

## 5. 전체 API 카탈로그 (27개) — 활용 우선순위

### ⭐ 즉시 가치 있음
| # | API | 상태 | 비고 |
|---|---|---|---|
| 26 | 한국관광공사 반려동물 동반여행(KorPetTourService2) | ✅ 구현됨 | 대전 데이터 8건뿐(§3-1) |
| 1 | 기상청 단기예보조회 | ✅ 구현됨 | 격자좌표 변환 필요(구현 완료) |
| 10 | 대전 문화축제 정보 | 🟡 프록시만 있음(타입 미정) | 13건, 좌표 없음 |

### 🟢 유용함 — 다음 후보
| # | API | 상태 | 메모 |
|---|---|---|---|
| 11 | 대전 도시공원정보 | ✅ 확인됨 | 412건, WGS84 좌표 정확 — 카카오맵 연동 1순위 후보 |
| 9 | 대전 문화관광(관광지) | ✅ 확인됨 | 142건, 좌표 있음(일부 결측) |
| 8 | 대전 문화관광(모범음식점) | ✅ 확인됨 | 121건, 좌표 있음 |
| 19 | 에어코리아 대기오염통계 | ✅ 확인됨 | 대전 5개 구 실시간, `DaejeonDistrict`와 이름 일치 — "오늘 산책하기 좋은 날" 배지에 바로 활용 가능 |
| 23 | 행정안전부 동물병원 조회 | ✅ 확인됨(대전 209건) | 좌표가 WGS84가 아님 — 변환/재지오코딩 필요 |
| 2 | 대전 문화시설 | ✅ 확인됨 | 131건, 좌표 없음 |
| 6 | 대전 문화관광(숙박정보) | ✅ 확인됨 | 162건, 좌표 없음 |
| 13 | 대전 유기동물공고 현황 | ✅ 확인됨(3,810건) | 좌표 없음 — 입양 홍보 섹션은 가능, 지도 연동은 불가 |
| 25 | 한국관광공사 관광지 집중률 | ❌ 호출 실패 | `signguCd` 코드표를 못 구해서 미해결 — 코드 참고파일 확보 필요 |

### 🔵 검토 필요 / 중복 가능성
| # | API | 메모 |
|---|---|---|
| 3, 4, 5 | 대전 주차장 정보 3종 | 사실상 중복 — 하나만 선택해서 쓸 것 |
| 7 | 대전 문화관광(쇼핑) | 12건뿐, 우선순위 낮음 |
| 12 | 대전 공연행사정보 | 10번(축제)과 역할 겹칠 수 있음 |
| 27 | 한국관광공사 국문 관광정보(KorService2) | ✅ 확인됨 — 26번 대비 데이터 최대 12배 많음(§3-3). 반려동물 인증은 없지만 장소 풀 확장용으로 유력 |

### ⚪ 후순위 / 통계성
| # | API | 메모 |
|---|---|---|
| 14 | 한국관광공사 고캠핑 정보 | "테마 코스" 확장용, 급하지 않음 |
| 16 | 한국관광공사 두루누비(걷기 코스) | 위와 동일 |
| 17, 18 | 관광사진 / 관광공모전 사진 | 콘텐츠 보강용 |
| 20~22, 24 | 반려동물 등록대행업체 / 위탁관리업 / 동물약국 / 동물미용업 | MY탭·장소 상세 부가정보, 후순위 |
| 15 | 지역별 방문자수(빅데이터) | 통계성, MVP엔 불필요 |

---

## 6. 쓸 때 주의할 점

1. **Encoding vs Decoding 키** — data.go.kr은 서비스키를 두 형태(URL-Encode / Decode)로 준다. `URLSearchParams`로 쿼리스트링을 만들 땐 **Decoding(원문) 값**을 써야 한다. Encoding 값을 그대로 넣으면 이중 인코딩되어 인증 실패(401)가 난다.
2. **트래픽 한도가 API마다 다르다** — 대부분 일일 10,000회지만, `KorPetTourService2`의 세부 오퍼레이션(`detailImage2` 등)이나 `GoCamping`, `PhotoGalleryService1` 계열은 **일일 1,000회**로 훨씬 낮다. 캐싱 없이 반복 호출하면 금방 소진된다 → 우리 백엔드는 `backend/src/lib/cache.ts`로 인메모리 TTL 캐시를 걸어둠.
3. **CORS 때문에 프론트에서 직접 호출 금지** — 반드시 `backend/`를 거친다(§1 아키텍처).
4. **응답 스키마가 API마다 다르다** — 관광공사 계열(`KorPetTourService2`, `KorService2`, `GoCamping` 등)은 `response.header/body.items` 표준 봉투를 따르지만, 대전시 `openapi2022` 계열과 행정안전부 표준데이터 계열은 필드명이 API마다 제각각이고(`signgu`, `romsNm`, `festvNm`, `BPLC_NM`처럼 접두사·명명 규칙이 다름) 문서에 응답 스키마가 없어서 실제 호출해서 확인해야 한다.
5. **좌표 없는/다른 좌표계인 데이터셋 주의** — 대전시 문화시설·숙박·축제·유기동물공고는 위경도가 아예 없다. 행정안전부 동물병원처럼 좌표 필드가 있어도 WGS84가 아닌 경우도 있다(§3-4). 카카오맵에 바로 찍을 수 있는 건 §4 표 왼쪽 칸뿐이고, 나머지는 지오코딩이나 좌표계 변환을 먼저 거쳐야 한다.
6. **XML만 주는 API도 있다** — 대전 유기동물공고·도시공원정보는 `_type=json`을 붙여도 XML로만 응답한다. 백엔드에서 파싱할 때 JSON 전제로 짜면 깨지니 주의.

---

## 7. 코드 예시

### 7-1. 지금 구현된 API 호출 예시

우리 프론트 개발 서버(`:3000`)를 통해 부르면 된다 — `next.config.mjs`의 rewrite가 알아서 백엔드(`:4000`)로 넘겨준다.

**날씨**
```bash
curl "http://localhost:3000/api/weather?lat=36.35&lng=127.38"
```
```jsonc
{
  "forecast": [
    { "date": "2026-08-13", "time": "12:00", "temperatureC": 30, "precipitationChancePercent": 30, "precipitationType": 0, "skyCondition": 4 },
    { "date": "2026-08-13", "time": "13:00", "temperatureC": 31, "precipitationChancePercent": 30, "precipitationType": 0, "skyCondition": 4 }
    // …3일치, 3시간 간격으로 계속
  ]
}
```
- `skyCondition`: 1=맑음 3=구름많음 4=흐림 · `precipitationType`: 0=없음 1=비 4=소나기

**반려동물 동반 장소** (`contentTypeId` 생략 시 카테고리별 최소 개수 보장)
```bash
curl "http://localhost:3000/api/pet-tour-spots?numOfRows=12"
curl "http://localhost:3000/api/pet-tour-spots?contentTypeId=39&numOfRows=5"   # 39=음식점만
```
```jsonc
{
  "spots": [
    {
      "id": "126838",
      "contentTypeId": "12",
      "name": "뿌리공원",
      "address": "대전광역시 중구 뿌리공원로 79 뿌리공원",
      "lat": 36.2845065219,
      "lng": 127.3864280203,
      "imageUrl": "http://tong.visitkorea.or.kr/cms/resource/87/3569387_image2_1.jpg",
      "tel": null
    }
  ]
}
```

**대전시 원본 데이터 프록시** (아직 타입 안 좁힘 — 응답 그대로 통과)
```bash
curl "http://localhost:3000/api/daejeon/festival?numOfRows=3"
```
```jsonc
{
  "response": {
    "header": { "resultCode": "C00", "resultMsg": "NORMAL SERVICE" },
    "body": {
      "totalCount": 13,
      "items": [
        {
          "festvNm": "유성 국화 페스티벌",
          "festvPrid": "2021.10.2 ~ 10.24",
          "festvPlcNm": "유림공원, 온천문화공원, 갑천일원",
          "festvAddr": "대전 중구 사정공원로 70",
          "refadNo": "042-611-2678"
        }
      ]
    }
  }
}
```
가능한 `dataset` 값: `culture`(문화시설) · `lodging`(숙박) · `shopping`(쇼핑) · `restaurant`(모범음식점) · `tourspot`(관광지) · `festival`(축제)

### 7-2. 프론트에서 쓰는 예시

`usePetTourSpots` 훅 하나로 로딩·에러·데이터를 다 받는다(내부에서 TanStack Query 사용):

```tsx
import { usePetTourSpots } from "@/hooks/usePetTourSpots";

function PlaceList() {
  const { data: places, isLoading, isError } = usePetTourSpots();

  if (isLoading) return <p>불러오는 중...</p>;
  if (isError || !places) return <p>장소를 불러오지 못했어요</p>;

  return (
    <ul>
      {places.map((place) => (
        <li key={place.id}>
          {place.name} · {place.district} · {place.category}
        </li>
      ))}
    </ul>
  );
}
```

### 7-3. 새 공공데이터 API를 백엔드에 추가하는 법 — 예: 대전 도시공원정보(#11)

§4에서 카카오맵 연동 1순위로 꼽은 API를 실제로 붙인다면 이런 순서:

**① 원본 응답 먼저 확인** (XML만 주는 API라 `fast-xml-parser` 같은 파서가 필요 — `cd backend && npm install fast-xml-parser`)
```bash
curl "https://apis.data.go.kr/6300000/parkInfoDaejeonService/parkInfoDaejeonList?serviceKey=<키>&pageNo=1&numOfRows=3&_type=json"
# _type=json을 줘도 XML만 옴 → 아래처럼 XML 그대로 내려온다
```
```xml
<items>
  <address>대전광역시 대덕구 장동 457 일원</address>
  <latitude>36.406849</latitude>
  <longitude>127.441681</longitude>
  <title>장동</title>
  <section>문화공원</section>
</items>
```

**② `backend/src/lib/parks.ts`** (기존 `weather.ts`/`petTourSpots.ts`와 같은 패턴 — `publicData.ts`의 헬퍼 재사용, 캐시는 `cache.ts`)
```ts
import { XMLParser } from "fast-xml-parser";
import { assertPublicDataApiKey } from "./publicData";
import { cached } from "./cache";

const ENDPOINT = "https://apis.data.go.kr/6300000/parkInfoDaejeonService/parkInfoDaejeonList";

export interface DaejeonPark {
  id: string;
  name: string;
  address: string;
  section: string; // 소공원/근린공원/역사공원 등
  lat: number;
  lng: number;
}

interface RawParkItem {
  ntatcSeq: string;
  title: string;
  address: string;
  section: string;
  latitude: string;
  longitude: string;
}

export async function fetchDaejeonParks(numOfRows = 50, pageNo = 1): Promise<DaejeonPark[]> {
  const key = assertPublicDataApiKey();
  return cached(`parks:${pageNo}:${numOfRows}`, 60 * 60 * 1000, async () => {
    const search = new URLSearchParams({ serviceKey: key, pageNo: String(pageNo), numOfRows: String(numOfRows) });
    const res = await fetch(`${ENDPOINT}?${search.toString()}`);
    const xml = await res.text();
    const parsed = new XMLParser().parse(xml);
    const items: RawParkItem[] = parsed.ServiceResult.MsgBody.items ?? [];
    const list = Array.isArray(items) ? items : [items]; // 결과 1건이면 배열이 아니라 객체로 옴 — 흔한 함정
    return list
      .map((item) => ({
        id: item.ntatcSeq,
        name: item.title,
        address: item.address,
        section: item.section,
        lat: Number(item.latitude),
        lng: Number(item.longitude),
      }))
      .filter((park) => Number.isFinite(park.lat) && Number.isFinite(park.lng));
  });
}
```

**③ `backend/src/routes/parks.ts`**
```ts
import { Router } from "express";
import { fetchDaejeonParks } from "../lib/parks";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const parks = await fetchDaejeonParks(
      req.query.numOfRows ? Number(req.query.numOfRows) : undefined,
      req.query.pageNo ? Number(req.query.pageNo) : undefined
    );
    res.json({ parks });
  } catch (error) {
    res.status(502).json({ error: error instanceof Error ? error.message : "공원 정보를 불러오지 못했어요" });
  }
});

export default router;
```

**④ `backend/src/index.ts`에 등록**
```ts
import parksRouter from "./routes/parks";
// …
app.use("/api/parks", parksRouter);
```

이제 프론트는 `fetch("/api/parks")` 하나로 끝 — §7-2 예시처럼 TanStack Query 훅으로 감싸면 된다. XML 파싱 부분(①②) 말고는 지금 있는 `weather.ts`/`petTourSpots.ts`랑 구조가 완전히 똑같아서, 다른 API를 붙일 때도 이 템플릿을 그대로 복붙해서 엔드포인트·필드명만 바꾸면 된다.
