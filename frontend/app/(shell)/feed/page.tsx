import { TopBar } from "@/components/shell/TopBar";
import { TabPlaceholder } from "@/components/shell/TabPlaceholder";

export default function FeedPage() {
  return (
    <>
      <TopBar title="둘러보기" />
      <TabPlaceholder emoji="🧭" message="둘러보기 탭은 다음 스텝에서 채웁니다." />
    </>
  );
}
