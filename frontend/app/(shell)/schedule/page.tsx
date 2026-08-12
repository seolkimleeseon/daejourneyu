import { TopBar } from "@/components/shell/TopBar";
import { TabPlaceholder } from "@/components/shell/TabPlaceholder";

export default function SchedulePage() {
  return (
    <>
      <TopBar title="내 여정" />
      <TabPlaceholder emoji="🗓️" message="내 여정 탭은 다음 스텝에서 채웁니다." />
    </>
  );
}
