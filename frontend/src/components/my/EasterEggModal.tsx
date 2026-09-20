"use client";

import Image from "next/image";
import { Modal } from "@/components/ui/Modal";

interface EasterEggModalProps {
  open: boolean;
  onClose: () => void;
}

const CREW = [
  { src: "/easter-egg/easter_cho.png", name: "외강내초콩", bgClass: "bg-accent-coral-light", rotateClass: "-rotate-6" },
  { src: "/easter-egg/easter_su.png", name: "외강내수염", bgClass: "bg-accent-purple-light", rotateClass: "rotate-3" },
  { src: "/easter-egg/easter_deo.png", name: "외유내더영", bgClass: "bg-brand-100", rotateClass: "-rotate-2" },
  { src: "/easter-egg/easter_da.png", name: "외강내다영", bgClass: "bg-accent-amber-light", rotateClass: "rotate-6" },
  { src: "/easter-egg/easter_ming.png", name: "외강내민경", bgClass: "bg-brand-50", rotateClass: "-rotate-3" },
] as const;

function CrewCard({ member }: { member: (typeof CREW)[number] }) {
  return (
    <div
      className={`w-[86px] shrink-0 overflow-hidden rounded-2xl border-2 border-card shadow-md transition-transform hover:scale-105 hover:rotate-0 ${member.rotateClass}`}
    >
      <div className={`relative aspect-square ${member.bgClass}`}>
        <Image src={member.src} alt={member.name} fill sizes="86px" className="object-cover" />
      </div>
      <div className="bg-card px-0.5 py-1.5 text-center text-[10px] font-bold leading-tight text-ink">
        {member.name}
      </div>
    </div>
  );
}

/** 마이페이지 버전 문구를 5번 탭하면 뜨는 숨은 이스터에그 — 개발팀을 캐릭터로 소개한다.
 * 카드를 랜덤하게 기울여 스티커를 흩뿌려 놓은 듯한 느낌을 낸다. 2줄(2장+3장)로 배치한다. */
export function EasterEggModal({ open, onClose }: EasterEggModalProps) {
  const [row1, row2] = [CREW.slice(0, 2), CREW.slice(2)];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="🥚 기여한 사람 🥚"
      description="대저니유에 기여했어요."
      widthClass="w-[320px]"
    >
      <div className="flex flex-col gap-y-4 px-1 pt-2">
        <div className="flex justify-center gap-x-2">
          {row1.map((member) => (
            <CrewCard key={member.name} member={member} />
          ))}
        </div>
        <div className="flex justify-center gap-x-2">
          {row2.map((member) => (
            <CrewCard key={member.name} member={member} />
          ))}
        </div>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="mt-4 w-full rounded-lg bg-surface py-2.5 text-xs font-bold text-ink-muted active:bg-line"
      >
        닫기
      </button>
    </Modal>
  );
}
