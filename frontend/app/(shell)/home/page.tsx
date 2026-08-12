import { TopBar } from "@/components/shell/TopBar";
import { TabPlaceholder } from "@/components/shell/TabPlaceholder";

export default function HomePage() {
  return (
    <>
      <TopBar title="대저니유" />
      <TabPlaceholder emoji="🐾" message="홈 탭은 다음 스텝에서 채웁니다." />
    </>
  );
}
