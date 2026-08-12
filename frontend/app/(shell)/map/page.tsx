import { TopBar } from "@/components/shell/TopBar";
import { TabPlaceholder } from "@/components/shell/TabPlaceholder";

export default function MapPage() {
  return (
    <>
      <TopBar title="다녀지도" />
      <TabPlaceholder emoji="🗺️" message="다녀지도 탭은 다음 스텝에서 채웁니다." />
    </>
  );
}
