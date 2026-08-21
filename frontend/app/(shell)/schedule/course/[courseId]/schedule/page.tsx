"use client";

import { TopBar } from "@/components/shell/TopBar";
import { TabPlaceholder } from "@/components/shell/TabPlaceholder";

export default function CourseScheduleAddPage() {
  return (
    <>
      <TopBar title="일정 추가" showBack />
      <TabPlaceholder emoji="🗓️" message="일정 추가·편집은 다음 스텝에서 채웁니다." />
    </>
  );
}
