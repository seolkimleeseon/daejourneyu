"use client";

import { CourseButton as Button } from "@/components/course/CourseButton";
import { Tag } from "@/components/ui/Tag";
import { Emoji3D } from "@/components/ui/Emoji3D";

interface IntroStepProps {
  onStart: () => void;
}

const STATS = ["질문 12개", "16가지 유형", "약 1분"];

export function IntroStep({ onStart }: IntroStepProps) {
  return (
    <div className="px-5 pb-6 pt-4 text-center">
      <div className="relative mx-auto mb-5 flex h-32 w-32 items-center justify-center">
        <Emoji3D emoji="🐕" size={104} glowClassName="bg-brand-300" />
        <span className="absolute -right-1 top-2 rotate-12">
          <Emoji3D emoji="✨" size={28} shadow={false} />
        </span>
        <span className="absolute -left-2 bottom-3 -rotate-12">
          <Emoji3D emoji="🐾" size={24} shadow={false} />
        </span>
      </div>
      <div className="mb-2 text-lg font-extrabold leading-relaxed text-ink">
        내 댕이의
        <br />
        여행 MBTI는?
      </div>
      <div className="mb-4 text-xs leading-relaxed text-ink-muted">대전 맞춤 코스 테마까지 알려드려요</div>
      <div className="mb-8 flex justify-center gap-1.5">
        {STATS.map((stat) => (
          <Tag key={stat} tone="neutral" className="cursor-default">
            {stat}
          </Tag>
        ))}
      </div>
      <div>
        <Button onClick={onStart}>테스트 시작하기</Button>
      </div>
    </div>
  );
}
