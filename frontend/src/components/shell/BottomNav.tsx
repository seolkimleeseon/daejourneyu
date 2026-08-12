"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

interface NavTab {
  href: string;
  label: string;
  icon: JSX.Element;
}

const iconProps = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.9,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  width: 21,
  height: 21,
};

const TABS: NavTab[] = [
  {
    href: "/map",
    label: "다녀지도",
    icon: (
      <svg {...iconProps}>
        <path d="M12 21s-6.5-5.8-6.5-10.5a6.5 6.5 0 0 1 13 0C18.5 15.2 12 21 12 21z" />
        <circle cx="12" cy="10.5" r="2.4" />
      </svg>
    ),
  },
  {
    href: "/schedule",
    label: "내 여정",
    icon: (
      <svg {...iconProps}>
        <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
        <path d="M3.5 9.5h17M8 3.5v3M16 3.5v3" />
      </svg>
    ),
  },
  {
    href: "/home",
    label: "홈",
    icon: (
      <svg {...iconProps}>
        <path d="M4 10.5 12 4l8 6.5" />
        <path d="M6 9.7V20h12V9.7" />
      </svg>
    ),
  },
  {
    href: "/feed",
    label: "둘러보기",
    icon: (
      <svg {...iconProps}>
        <circle cx="12" cy="12" r="8.5" />
        <path d="m15 9-1.8 4.2L9 15l1.8-4.2L15 9z" />
      </svg>
    ),
  },
  {
    href: "/my",
    label: "마이",
    icon: (
      <svg {...iconProps}>
        <circle cx="12" cy="8.5" r="3.6" />
        <path d="M5.5 20a6.5 6.5 0 0 1 13 0" />
      </svg>
    ),
  },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 flex justify-around border-t border-line bg-card pb-[max(8px,env(safe-area-inset-bottom))] pt-2">
      {TABS.map((tab) => {
        const active = pathname === tab.href || pathname?.startsWith(`${tab.href}/`);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 text-[9px] font-semibold",
              active ? "text-brand" : "text-ink-muted"
            )}
          >
            <span
              className={cn(
                "flex h-[26px] w-[30px] items-center justify-center rounded-lg",
                active && "bg-brand-100"
              )}
            >
              {tab.icon}
            </span>
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
