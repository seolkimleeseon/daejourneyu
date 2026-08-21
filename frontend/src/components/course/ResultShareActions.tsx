"use client";

import type { RefObject } from "react";
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
  className?: string;
}

/** 결과 화면 공용 — 이미지로 저장하기 + 카카오톡 공유하기 */
export function ResultShareActions({
  captureRef,
  fileName,
  kakaoTitle,
  kakaoDescription,
  className,
}: ResultShareActionsProps) {
  const showToast = useToastStore((state) => state.show);

  const handleSaveImage = async () => {
    showToast("이미지를 만드는 중이에요...");
    const ok = await saveElementAsImage(captureRef.current, fileName);
    showToast(ok ? "이미지로 저장했어요 🖼️" : "이미지 저장에 실패했어요. 잠시 후 다시 시도해주세요.");
  };

  const handleKakaoShare = () => {
    const result = shareTextToKakao({ title: kakaoTitle, description: kakaoDescription });
    if (!result.ok) showToast(result.reason ?? "카카오톡 공유를 열지 못했어요");
  };

  return (
    <div className={className ?? "mt-2 flex gap-2"}>
      <Button variant="secondary" className="flex-1" onClick={handleSaveImage}>
        🖼️ 이미지 저장
      </Button>
      <Button variant="secondary" className="flex-1" onClick={handleKakaoShare}>
        💬 카카오톡 공유
      </Button>
    </div>
  );
}
