"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

const SHOW_MS = 1200;
const FADE_MS = 550;

/** 앱 최초 마운트 시 한 번만 보여주는 스플래시. 탭 이동으로는 다시 뜨지 않는다(루트 레이아웃에 한 번만 마운트). */
export function Splash() {
  const [hiding, setHiding] = useState(false);
  const [mounted, setMounted] = useState(true);

  useEffect(() => {
    const hideTimer = setTimeout(() => setHiding(true), SHOW_MS);
    return () => clearTimeout(hideTimer);
  }, []);

  useEffect(() => {
    if (!hiding) return;
    const unmountTimer = setTimeout(() => setMounted(false), FADE_MS);
    return () => clearTimeout(unmountTimer);
  }, [hiding]);

  if (!mounted) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-[200] flex flex-col items-center justify-center gap-4 bg-brand transition-opacity",
        hiding ? "pointer-events-none opacity-0" : "opacity-100"
      )}
      style={{ transitionDuration: `${FADE_MS}ms` }}
    >
      <div className="text-[27px] font-extrabold tracking-tight text-white">대저니유</div>
      <div className="font-mono text-[9px] font-bold tracking-[2.6px] text-white/80">
        DAEJEON · JOURNEY · YOU
      </div>
    </div>
  );
}
