"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { TopBar } from "@/components/shell/TopBar";
import { Card } from "@/components/ui/Card";
import { Tag } from "@/components/ui/Tag";
import { Button } from "@/components/ui/Button";
import { LoginModal } from "@/components/my/LoginModal";
import { PlaceMap } from "@/components/place/PlaceMap";
import { usePlaces } from "@/hooks/usePlaces";
import { useReviews } from "@/hooks/useReviews";
import { useAuthStore } from "@/stores/useAuthStore";
import { getConditionTags } from "@/lib/placeFilters";
import { conditionSourceLabel } from "@/lib/courseFormat";

/**
 * 후기는 이 화면의 본체가 아니라 확인 사살용이다 — 동반 가능 여부는 위쪽 조건 카드에서 이미 끝났다.
 * 목록을 통째로 펼치면 후기 쓰기 버튼만 덩그러니 남고 한참 스크롤해야 해서, 지도 탭·장소 선택
 * 시트와 같은 "더 보기" 방식으로 끊어 보여준다.
 * TODO(api): 서버가 아직 전량을 내려준다(GET /api/reviews에 limit/cursor 없음) — 화면만 끊는 것이라
 * 후기가 쌓이면 네트워크 양은 그대로다. 백엔드 페이지네이션과 함께 다시 볼 것.
 */
const REVIEW_PREVIEW_COUNT = 3;
/** 한 번 펼치기로 마음먹은 사람에게 3개씩 주는 건 너무 잘다 — 더 보기는 크게 연다. */
const REVIEW_PAGE_SIZE = 10;

export default function PlaceDetailPage({ params }: { params: { name: string } }) {
  return (
    <Suspense fallback={null}>
      <PlaceDetailPageContent params={params} />
    </Suspense>
  );
}

function PlaceDetailPageContent({ params }: { params: { name: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const placeName = decodeURIComponent(params.name);
  // 동명 장소(예: 여러 구에 있는 "OO공원")가 있을 수 있어, 넘어온 id가 있으면 이름보다 우선한다.
  // id 없이 이름으로만 들어온 링크(다른 탭에서 건 링크 등)는 기존처럼 첫 일치 결과로 대체한다.
  const placeId = searchParams.get("id");
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const { data: places = [], isLoading: placesLoading } = usePlaces();
  const [loginOpen, setLoginOpen] = useState(false);

  const place = (placeId ? places.find((p) => p.id === placeId) : undefined) ?? places.find((p) => p.name === placeName);
  const { data: reviews = [], isLoading: reviewsLoading } = useReviews(place?.id, {
    enabled: !placesLoading && Boolean(place),
  });
  const placeReviews = place ? reviews : [];
  const conditionTags = place ? getConditionTags(place.condition, place.smallDogOnly) : [];

  const [visibleReviewCount, setVisibleReviewCount] = useState(REVIEW_PREVIEW_COUNT);
  const visibleReviews = placeReviews.slice(0, visibleReviewCount);
  // 같은 이름의 다른 장소로 바뀌면(주소의 id만 달라지는 경우) 이전 장소에서 펼친 만큼은 의미가 없다.
  useEffect(() => {
    setVisibleReviewCount(REVIEW_PREVIEW_COUNT);
  }, [place?.id]);

  const reviewHref = place
    ? `/place/${encodeURIComponent(placeName)}/review?id=${encodeURIComponent(place.id)}`
    : `/place/${encodeURIComponent(placeName)}/review`;

  const handleWriteReview = () => {
    if (!isLoggedIn) {
      setLoginOpen(true);
      return;
    }
    router.push(reviewHref);
  };

  if (placesLoading) {
    return (
      <>
        <TopBar title="장소 정보" showBack />
        <div className="py-16 text-center text-xs text-ink-muted">불러오는 중…</div>
      </>
    );
  }

  if (!place) {
    return (
      <>
        <TopBar title="장소 정보" showBack />
        <div className="py-16 text-center text-xs text-ink-muted">
          존재하지 않는 장소예요.
        </div>
      </>
    );
  }

  return (
    <>
      <TopBar title={place.name} showBack />
      <div className="px-4 pb-6 pt-3">
        <div className="mb-3 flex flex-wrap gap-1.5">
          <Tag tone="brand" className="cursor-default px-2.5 py-1 text-[11px]">
            {place.category}
          </Tag>
          <Tag tone="neutral" className="cursor-default px-2.5 py-1 text-[11px]">
            {place.district}
          </Tag>
          {place.smallDogOnly ? (
            <Tag tone="amber" className="cursor-default px-2.5 py-1 text-[11px]">
              소형견만
            </Tag>
          ) : null}
        </div>

        <Card highlighted={place.petFriendly} className="mb-5">
          <div className="text-xs font-bold text-ink">
            {place.petFriendly ? "🐾 반려동물 동반 가능" : "🚫 반려동물 동반 불가"}
          </div>
          {conditionTags.length > 0 ? (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {conditionTags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-line-strong bg-surface px-2 py-0.5 text-[10px] font-medium text-ink-muted"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
          <div className="mt-1.5 text-xs text-ink-muted">
            {conditionTags.length > 0 ? conditionSourceLabel(place.condition) : place.condition}
          </div>
        </Card>

        <div className="mb-2 px-1 text-xs font-bold text-ink-muted">위치</div>
        <div className="mb-5">
          <PlaceMap name={place.name} lat={place.lat} lng={place.lng} />
        </div>

        <div className="mb-2 px-1 text-xs font-bold text-ink-muted">후기 {placeReviews.length}개</div>

        {/* 같은 동작을 헤더 링크와 목록 아래 큰 버튼 두 군데에 두다 보니 '후기 쓰기'가 한 화면에
            두 번 나왔다 — 목록 바로 위 한 곳으로 합친다. 후기가 길어도 끝까지 내려갈 필요가 없다. */}
        <div className="mb-3">
          <Button variant="primary" onClick={handleWriteReview}>
            후기 쓰기
          </Button>
        </div>

        <div className="flex flex-col gap-2.5">
          {reviewsLoading ? (
            <div className="py-8 text-center text-xs text-ink-muted">불러오는 중…</div>
          ) : placeReviews.length === 0 ? (
            <div className="py-8 text-center text-xs text-ink-muted">
              아직 후기가 없어요. 첫 후기를 남겨보세요.
            </div>
          ) : (
            visibleReviews.map((review) => (
              <Card key={review.id}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-ink">{review.authorName}</span>
                  <span className="text-[10px] text-ink-muted">{review.createdAtLabel}</span>
                </div>
                {review.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- data URL이라 next/image 최적화 대상이 아님
                  <img
                    src={review.photoUrl}
                    alt={`${review.authorName}님이 첨부한 사진`}
                    className="mt-2 h-32 w-full rounded-lg object-cover"
                  />
                ) : null}
                {review.text ? <div className="mt-1.5 text-xs text-ink">{review.text}</div> : null}
                <div className="mt-2 flex flex-wrap gap-1">
                  {review.tags.map((tag) => (
                    <Tag
                      key={tag.code}
                      tone={tag.category === "CAUTION" ? "amber" : "brand"}
                      className="cursor-default px-2 py-1 text-[10px]"
                    >
                      {tag.label}
                    </Tag>
                  ))}
                </div>
              </Card>
            ))
          )}
        </div>

        {placeReviews.length > visibleReviews.length ? (
          <button
            type="button"
            onClick={() => setVisibleReviewCount((prev) => prev + REVIEW_PAGE_SIZE)}
            className="mt-2.5 w-full rounded-lg border border-line bg-surface py-2.5 text-xs font-semibold text-ink-muted"
          >
            더 보기 · {placeReviews.length - visibleReviews.length}개 남음
          </button>
        ) : null}
      </div>

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} redirectTo={reviewHref} />
    </>
  );
}
