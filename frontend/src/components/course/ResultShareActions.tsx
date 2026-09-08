"use client";

import { useState, type RefObject } from "react";
import { Button } from "@/components/ui/Button";
import { useToastStore } from "@/stores/useToastStore";
import { saveElementAsImage } from "@/lib/captureImage";
import { shareTextToKakao } from "@/lib/kakao";

interface ResultShareActionsProps {
  /** 캡처할 결과 카드 영역 */
  captureRef: RefObject<HTMLElement>;
  fileName: string;
  kakaoTitle: string;
  kakaoDescription: string;
  /** 카카오톡 공유 링크가 이동할 경로. 없으면 홈으로 연결한다(예: 저장 전이라 갈 상세 페이지가 없는 경우). */
  path?: string;
  className?: string;
}

/** 결과 화면 공용 — 이미지로 저장하기 + 카카오톡 공유하기 */
export function ResultShareActions({
  captureRef,
  fileName,
  kakaoTitle,
  kakaoDescription,
  path,
  className,
}: ResultShareActionsProps) {
  const showToast = useToastStore((state) => state.show);
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveImage = async () => {
    setIsSaving(true);
    showToast("이미지를 만드는 중이에요...");
    try {
      const ok = await saveElementAsImage(captureRef.current, fileName);
      showToast(ok ? "이미지로 저장했어요 🖼️" : "이미지 저장에 실패했어요. 잠시 후 다시 시도해주세요.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleKakaoShare = () => {
    const result = shareTextToKakao({ title: kakaoTitle, description: kakaoDescription, path });
    if (!result.ok) showToast(result.reason ?? "카카오톡 공유를 열지 못했어요");
  };

  return (
    <div className={className ?? "mt-2 flex gap-2"}>
      <Button variant="secondary" className="flex-1 gap-1.5" onClick={handleSaveImage} disabled={isSaving}>
        <span className="inline-flex w-5 shrink-0 justify-center text-lg leading-none">
          {isSaving ? "⏳" : "🖼️"}
        </span>
        <span>{isSaving ? "저장 중..." : "이미지 저장"}</span>
      </Button>
      <Button variant="secondary" className="flex-1 gap-1.5" onClick={handleKakaoShare}>
        <span className="inline-flex w-5 shrink-0 justify-center text-lg leading-none">💬</span>
        <span>카카오톡 공유</span>
      </Button>
    </div>
  );
}
