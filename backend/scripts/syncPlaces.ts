/**
 * `/api/places`는 이제 요청마다(짧은 캐시를 두고) 공공데이터 API를 실시간으로 호출한다
 * (`src/lib/placesAggregator.ts` — 공모전 규정상 DB 스냅샷이 아니라 그때그때 API 호출이어야
 * 해서 이렇게 바꿨다). 이 스크립트는 그 전 방식(DB에 미리 적재)의 흔적으로, 지금은 앱
 * 런타임에 쓰이지 않고 필요할 때 수동으로 Place 테이블에 백업 스냅샷을 남기고 싶을 때만 쓴다.
 */
import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { fetchAggregatedPlaces } from "../src/lib/placesAggregator";

async function main() {
  console.log("공공데이터 API 호출 중...");
  const places = await fetchAggregatedPlaces();
  console.log(`합계 ${places.length}건.`);

  console.log("DB에 upsert 중...");
  for (const row of places) {
    await prisma.place.upsert({
      where: { id: row.id },
      update: row,
      create: row,
    });
  }

  console.log(`✅ Place 백업 스냅샷 저장 완료: ${places.length}건`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
