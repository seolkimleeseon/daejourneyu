"use client";

import { TopBar } from "@/components/shell/TopBar";
import { Card } from "@/components/ui/Card";
import { Tag } from "@/components/ui/Tag";
import { useReviews } from "@/hooks/useReviews";

export default function MyReviewsPage() {
  const { data: reviews = [], isLoading } = useReviews();
  const myReviews = reviews.filter((review) => review.isMine);

  return (
    <>
      <TopBar title="내가 쓴 후기" showBack />
      <div className="flex flex-col gap-2.5 px-4 pb-6 pt-3">
        {isLoading ? (
          <div className="py-10 text-center text-xs text-ink-muted">불러오는 중…</div>
        ) : myReviews.length === 0 ? (
          <div className="py-10 text-center text-xs text-ink-muted">
            아직 작성한 후기가 없어요. 장소 상세에서 후기를 남겨보세요.
          </div>
        ) : (
          myReviews.map((review) => (
            <Card key={review.id}>
              <div className="text-sm font-bold text-ink">{review.placeName}</div>
              <div className="mt-0.5 text-[10px] text-ink-muted">{review.createdAtLabel}</div>
              <div className="mt-1.5 text-xs text-ink">{review.text}</div>
              <div className="mt-2 flex flex-wrap gap-1">
                {review.tags.map((tag) => (
                  <Tag key={tag} tone="brand" className="cursor-default px-2 py-1 text-[10px]">
                    {tag}
                  </Tag>
                ))}
              </div>
            </Card>
          ))
        )}
      </div>
    </>
  );
}
