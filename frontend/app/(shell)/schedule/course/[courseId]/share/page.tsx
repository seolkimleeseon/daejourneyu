"use client";

import { TopBar } from "@/components/shell/TopBar";
import { TabPlaceholder } from "@/components/shell/TabPlaceholder";

export default function CourseSharePage() {
  return (
    <>
      <TopBar title="코스 공유하기" showBack />
      <TabPlaceholder emoji="🧭" message="둘러보기 공유는 다음 스텝에서 채웁니다." />
    </>
  );
}
