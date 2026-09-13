"use client";

import { useMemo, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { TopBar } from "@/components/shell/TopBar";
import { Button } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Tag";
import { usePlaces } from "@/hooks/usePlaces";
import { useCreateReview } from "@/hooks/useReviews";
import { useReviewTags } from "@/hooks/useReviewTags";
import { useAuthStore } from "@/stores/useAuthStore";
import { useToastStore } from "@/stores/useToastStore";
import { cn } from "@/lib/cn";
import type { ReviewTagOption } from "@/types";

const MIN_TAGS = 1;
const MAX_TAGS = 5;
/** data URL로 그대로 저장한다(아직 별도 이미지 스토리지가 없음) — 너무 큰 사진은 미리 막는다. */
const MAX_PHOTO_BYTES = 2 * 1024 * 1024;

const CATEGORY_ORDER = ["PET_CONDITION", "ENVIRONMENT", "AMENITY", "SERVICE", "CAUTION"];
const CATEGORY_LABELS: Record<string, string> = {
  PET_CONDITION: "반려동물 동반 조건",
  ENVIRONMENT: "공간 · 환경",
  AMENITY: "편의시설",
  SERVICE: "서비스 · 분위기",
  CAUTION: "주의할 점",
};

function groupByCategory(tags: ReviewTagOption[]): Array<[string, ReviewTagOption[]]> {
  const groups = new Map<string, ReviewTagOption[]>();
  for (const tag of tags) {
    const list = groups.get(tag.category) ?? [];
    list.push(tag);
    groups.set(tag.category, list);
  }
  return CATEGORY_ORDER.filter((category) => groups.has(category)).map((category) => [
    category,
    groups.get(category)!,
  ]);
}

export default function ReviewWritePage({ params }: { params: { name: string } }) {
  const router = useRouter();
  const placeName = decodeURIComponent(params.name);
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const { data: places = [] } = usePlaces();
  const { data: tagOptions = [] } = useReviewTags();
  const createReview = useCreateReview();
  const showToast = useToastStore((state) => state.show);

  const [text, setText] = useState("");
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(undefined);

  const place = places.find((p) => p.name === placeName);
  const groupedTags = useMemo(() => groupByCategory(tagOptions), [tagOptions]);

  const toggleTag = (code: string) => {
    setSelectedCodes((prev) => {
      if (prev.includes(code)) return prev.filter((c) => c !== code);
      if (prev.length >= MAX_TAGS) {
        showToast(`태그는 최대 ${MAX_TAGS}개까지 선택할 수 있어요`);
        return prev;
      }
      return [...prev, code];
    });
  };

  const handlePhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > MAX_PHOTO_BYTES) {
      showToast("사진 용량이 너무 커요 (2MB 이하로 올려주세요)");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPhotoUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = () => {
    if (!place || createReview.isPending) return;
    createReview.mutate(
      { placeId: place.id, placeName: place.name, text: text.trim(), photoUrl, tagCodes: selectedCodes },
      {
        onSuccess: () => {
          showToast("후기가 등록되었어요");
          router.replace(`/place/${encodeURIComponent(placeName)}`);
        },
        onError: () => showToast("후기 등록에 실패했어요. 잠시 후 다시 시도해주세요"),
      }
    );
  };

  if (!isLoggedIn) {
    return (
      <>
        <TopBar title="후기 쓰기" showBack />
        <div className="py-16 text-center text-xs text-ink-muted">로그인이 필요해요.</div>
      </>
    );
  }

  if (!place) {
    return (
      <>
        <TopBar title="후기 쓰기" showBack />
        <div className="py-16 text-center text-xs text-ink-muted">존재하지 않는 장소예요.</div>
      </>
    );
  }

  const canSubmit = selectedCodes.length >= MIN_TAGS && selectedCodes.length <= MAX_TAGS && !createReview.isPending;

  return (
    <>
      <TopBar title="후기 쓰기" showBack />
      <div className="px-4 pb-6 pt-3">
        <div className="mb-4 text-sm font-bold text-ink">{place.name}</div>

        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs font-bold text-ink-muted">
            이 장소, 반려동물과 어땠나요?
          </span>
          <span className="text-[11px] font-semibold text-brand">
            {selectedCodes.length}/{MAX_TAGS}
          </span>
        </div>

        <div className="flex flex-col gap-3">
          {groupedTags.map(([category, tags]) => (
            <div key={category}>
              <div
                className={cn(
                  "mb-1.5 text-[11px] font-bold",
                  category === "CAUTION" ? "text-accent-amber" : "text-ink-muted"
                )}
              >
                {CATEGORY_LABELS[category] ?? category}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <Tag
                    key={tag.code}
                    tone={category === "CAUTION" ? "amber" : "brand"}
                    active={selectedCodes.includes(tag.code)}
                    onClick={() => toggleTag(tag.code)}
                  >
                    {tag.label}
                  </Tag>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mb-2 mt-6 text-xs font-bold text-ink-muted">후기 내용 (선택)</div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="반려동물과 함께한 경험을 남겨주세요"
          rows={5}
          className="w-full resize-none rounded-lg border border-line bg-card p-3 text-sm text-ink outline-none focus:border-brand-400"
        />

        <div className="mb-2 mt-6 text-xs font-bold text-ink-muted">사진 (선택)</div>
        <label className="flex h-40 w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-dashed border-line-strong bg-surface text-center text-[11px] text-ink-muted">
          {photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- data URL 미리보기라 next/image 대상이 아님
            <img src={photoUrl} alt="첨부한 사진 미리보기" className="h-full w-full object-cover" />
          ) : (
            "사진 추가"
          )}
          <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
        </label>

        <div className="mt-6">
          <Button variant="primary" disabled={!canSubmit} onClick={handleSubmit}>
            {createReview.isPending ? "등록 중…" : "등록하기"}
          </Button>
        </div>
      </div>
    </>
  );
}
