"use client";

import { BottomSheet } from "@/components/ui/BottomSheet";
import { Card } from "@/components/ui/Card";
import { Tag } from "@/components/ui/Tag";
import { CourseButton as Button } from "@/components/course/CourseButton";
import { CourseRouteMap } from "@/components/course/CourseRouteMap";
import { conditionSourceLabel, NEEDS_CHECK_LABEL } from "@/lib/courseFormat";
import type { CourseStop } from "@/types";

interface KakaoPlacePreviewSheetProps {
  stop: CourseStop | null;
  onClose: () => void;
}

/**
 * 카카오 검색으로 담긴 장소는 우리 DB에 없어 `/place/[name]`(Player1 소유, 후기 포함) 상세로
 * 못 보낸다. 그렇다고 그냥 카카오맵 새 탭으로 튕겨보내면 앱을 벗어나는 느낌이 커서, 같은
 * 앱 안에서 우리 장소 상세와 비슷한 생김새(태그·강조 카드·지도)로 미리보기를 보여준다.
 * 후기는 우리 시스템에 없는 장소라 표시하지 않는 대신, 카카오맵 원본으로 가는 버튼을 둔다.
 */
export function KakaoPlacePreviewSheet({ stop, onClose }: KakaoPlacePreviewSheetProps) {
  return (
    <BottomSheet open={!!stop} onClose={onClose} title={stop?.name}>
      {stop ? (
        <>
          <div className="mb-3 flex flex-wrap gap-1.5">
            <Tag tone="brand" className="cursor-default px-2.5 py-1 text-[11px]">
              {stop.category}
            </Tag>
            <Tag tone="neutral" className="cursor-default px-2.5 py-1 text-[11px]">
              {stop.district}
            </Tag>
          </div>

          <Card className="mb-5">
            <div className="text-xs font-bold text-ink">🌐 {conditionSourceLabel(stop.condition)}</div>
            <div className="mt-1 text-xs text-ink-muted">{NEEDS_CHECK_LABEL}</div>
          </Card>

          <div className="mb-2 px-1 text-xs font-bold text-ink-muted">위치</div>
          <div className="mb-5">
            <CourseRouteMap stops={[stop]} />
          </div>

          <div className="mb-2 px-1 text-xs text-ink-muted">
            카카오맵 검색 결과라 후기·평점은 이 화면에서 못 보여드려요. 원본 페이지에서 확인해주세요.
          </div>

          {stop.placeUrl ? (
            <Button onClick={() => window.open(stop.placeUrl!, "_blank", "noopener,noreferrer")}>
              카카오맵에서 자세히 보기 ›
            </Button>
          ) : null}
        </>
      ) : null}
    </BottomSheet>
  );
}
