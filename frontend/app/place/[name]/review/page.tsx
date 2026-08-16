"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TopBar } from "@/components/shell/TopBar";
import { Button } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Tag";
import { usePlaces } from "@/hooks/usePlaces";
import { useAuthStore } from "@/stores/useAuthStore";
import { useToastStore } from "@/stores/useToastStore";

const SUGGESTED_TAGS = [
  "산책 좋아요",
  "물그릇 제공",
  "그늘 부족",
  "좌석 편안",
  "소형견만",
  "대형견 구역 분리",
];

// TODO(api): POST /api/places/:id/reviews 로 교체. 지금은 목데이터라 실제로 저장하지 않는다.
export default function ReviewWritePage({ params }: { params: { name: string } }) {
  const router = useRouter();
  const placeName = decodeURIComponent(params.name);
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const { data: places = [] } = usePlaces();
  const showToast = useToastStore((state) => state.show);
  const [text, setText] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const place = places.find((p) => p.name === placeName);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = () => {
    showToast("후기가 등록되었어요");
    router.replace(`/place/${encodeURIComponent(placeName)}`);
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

  return (
    <>
      <TopBar title="후기 쓰기" showBack />
      <div className="px-4 pb-6 pt-3">
        <div className="mb-4 text-sm font-bold text-ink">{place.name}</div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="반려동물과 함께한 경험을 남겨주세요"
          rows={5}
          className="w-full resize-none rounded-lg border border-line bg-card p-3 text-sm text-ink outline-none focus:border-brand-400"
        />

        <div className="mb-2 mt-4 text-xs font-bold text-ink-muted">태그 선택</div>
        <div className="flex flex-wrap gap-1.5">
          {SUGGESTED_TAGS.map((tag) => (
            <Tag key={tag} active={selectedTags.includes(tag)} onClick={() => toggleTag(tag)}>
              {tag}
            </Tag>
          ))}
        </div>

        <div className="mt-6">
          <Button variant="primary" disabled={text.trim().length === 0} onClick={handleSubmit}>
            등록하기
          </Button>
        </div>
      </div>
    </>
  );
}
