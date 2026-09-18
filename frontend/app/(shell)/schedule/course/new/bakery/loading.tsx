import { TopBar } from "@/components/shell/TopBar";
import { BakeryLoading } from "@/components/course/BakeryLoading";

export default function BakeryPageLoading() {
  return (
    <>
      <TopBar title="대전 빵지순례" showBack />
      <div className="px-5 pb-4 pt-4 text-xs font-bold text-ink-muted">추천 지역을 준비하고 있어요</div>
      <BakeryLoading />
    </>
  );
}
