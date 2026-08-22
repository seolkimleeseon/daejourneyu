"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { TopBar } from "@/components/shell/TopBar";
import { useToastStore } from "@/stores/useToastStore";
import { useCourseStore } from "@/stores/useCourseStore";
import { cn } from "@/lib/cn";
import { mockPlaces } from "@/mocks";
import type { Course, CourseStop } from "@/types";

type CourseSuggestion = Omit<Course, "id">;

interface ChatMessage {
  id: string;
  role: "user" | "bot";
  text: string;
  pending?: boolean;
  stops?: CourseStop[];
  course?: CourseSuggestion;
  action?: { label: string; href: string };
}

const FAQ_ITEMS: { q: string; a: string; actionLabel?: string; href?: string }[] = [
  {
    q: "이 앱은 뭐 하는 곳이야?",
    a: "대전 5개 구의 반려동물 동반 여행지를 소개하고, 그걸 묶어 여행 코스로 만들어주는 앱이에요 🐾",
  },
  {
    q: "코스는 어떻게 만들어?",
    a: "내 여정 탭에서 MBTI 추천·AI 추천·직접 짓기 중 하나로 만들 수 있어요. 저장하면 보관함에 담겨요.",
    actionLabel: "코스 만들러 가기",
    href: "/schedule",
  },
  {
    q: "MBTI가 뭐야?",
    a: "반려동물의 여행 성향을 진단하는 테스트예요. 결과에 따라 어울리는 코스 테마를 추천해드려요.",
    actionLabel: "MBTI 검사하러 가기",
    href: "/schedule/course/new/mbti",
  },
];

const QUICK_PROMPTS = ["조용히 산책하기 좋은 곳", "당일치기 코스 추천해줘", "실내 카페 위주로", "소형견도 갈 수 있는 곳"];

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export default function ChatbotPage() {
  const router = useRouter();
  const showToast = useToastStore((state) => state.show);
  const addCourse = useCourseStore((state) => state.addCourse);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "greeting",
      role: "bot",
      text: "안녕하세요! 대저니유 안내입니다 🐾\n반려동물이랑 갈 곳을 추천해드리거나, 코스로 짜드릴게요. 아래에서 골라보거나 편하게 물어보세요!",
    },
  ]);
  const [input, setInput] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages]);

  const appendMessage = (message: ChatMessage) => setMessages((prev) => [...prev, message]);

  const replacePending = (id: string, patch: Partial<ChatMessage>) =>
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, pending: false, ...patch } : m)));

  const requestCourseSuggestion = async (prompt: string) => {
    const pendingId = makeId();
    appendMessage({ id: pendingId, role: "bot", text: "생각하는 중...", pending: true });

    try {
      const res = await fetch("/api/ai/course-suggestion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, nights: 0, transport: "자차", candidatePlaces: mockPlaces }),
      });
      const data: CourseSuggestion | { error: string } = await res.json();
      if (!res.ok || "error" in data) {
        replacePending(pendingId, {
          text: "error" in data ? data.error : "코스를 만들지 못했어요. 잠시 후 다시 시도해주세요",
        });
        return;
      }
      const stops = data.days.flat();
      replacePending(pendingId, {
        text: `말씀하신 조건에 맞춰 골라봤어요 🐾\n"${data.label}"`,
        stops,
        course: data,
      });
    } catch {
      replacePending(pendingId, { text: "코스를 만들지 못했어요. 잠시 후 다시 시도해주세요" });
    }
  };

  const handleSend = (presetText?: string) => {
    const text = (presetText ?? input).trim();
    if (!text) return;
    appendMessage({ id: makeId(), role: "user", text });
    setInput("");

    const faq = FAQ_ITEMS.find((item) => item.q === text);
    if (faq) {
      appendMessage({
        id: makeId(),
        role: "bot",
        text: faq.a,
        action: faq.href && faq.actionLabel ? { label: faq.actionLabel, href: faq.href } : undefined,
      });
      return;
    }

    requestCourseSuggestion(text);
  };

  const handleSaveCourse = (course: CourseSuggestion) => {
    const saved = addCourse(course);
    showToast("코스를 보관함에 저장했어요 🐾");
    router.push(`/schedule/course/${saved.id}`);
  };

  return (
    <div className="flex flex-col" style={{ height: "calc(100dvh - 76px)" }}>
      <TopBar title="AI에게 물어보기" showBack />

      <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-3">
        {messages.map((message) => (
          <div key={message.id} className={cn("mb-2.5 flex", message.role === "user" ? "justify-end" : "justify-start")}>
            <div
              className={cn(
                "max-w-[82%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                message.role === "user"
                  ? "bg-accent-purple text-white"
                  : "border border-line bg-card text-ink"
              )}
            >
              {message.pending ? (
                <span className="text-ink-muted">생각하는 중...</span>
              ) : (
                <span className="whitespace-pre-line">{message.text}</span>
              )}

              {message.stops && message.stops.length > 0 ? (
                <div className="mt-2 flex flex-col gap-1.5">
                  {message.stops.map((stop) => (
                    <button
                      key={stop.placeId}
                      type="button"
                      onClick={() => router.push(`/place/${encodeURIComponent(stop.name)}`)}
                      className="flex items-center gap-2 rounded-lg border border-line bg-surface px-2.5 py-2 text-left"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-xs font-bold text-ink">{stop.name}</div>
                        <div className="mt-0.5 truncate text-[10px] text-ink-muted">
                          {stop.district} · {stop.category}
                        </div>
                      </div>
                      <span className="shrink-0 text-xs">{stop.petFriendly ? "🐾" : "🚫"}</span>
                    </button>
                  ))}
                </div>
              ) : null}

              {message.course ? (
                <button
                  type="button"
                  onClick={() => handleSaveCourse(message.course!)}
                  className="mt-2 flex h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-brand text-xs font-bold text-white"
                >
                  <span>🐾</span>이 코스 저장하기
                </button>
              ) : null}

              {message.action ? (
                <button
                  type="button"
                  onClick={() => router.push(message.action!.href)}
                  className="mt-2 flex h-9 w-full items-center justify-center rounded-lg border border-brand-300 bg-brand-100 text-xs font-bold text-brand-700"
                >
                  {message.action.label} ›
                </button>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      <div className="shrink-0 border-t border-line px-4 pb-3 pt-2.5">
        <div className="mb-1.5 text-[10px] font-bold text-ink-muted">💬 자주 묻는 질문</div>
        <div className="mb-2 flex gap-1.5 overflow-x-auto pb-0.5">
          {FAQ_ITEMS.map((item) => (
            <button
              key={item.q}
              type="button"
              onClick={() => handleSend(item.q)}
              className="shrink-0 rounded-full bg-brand-100 px-3 py-1.5 text-[11px] font-semibold text-brand-700"
            >
              {item.q}
            </button>
          ))}
        </div>
        <div className="mb-1.5 text-[10px] font-bold text-ink-muted">✨ 빠른 추천</div>
        <div className="mb-2.5 flex gap-1.5 overflow-x-auto pb-0.5">
          {QUICK_PROMPTS.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => handleSend(q)}
              className="shrink-0 rounded-full border border-line-strong bg-card px-3 py-1.5 text-[11px] font-semibold text-ink-muted"
            >
              {q}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") handleSend();
            }}
            placeholder="예: 유성구에서 산책하기 좋은 곳 알려줘"
            className="flex-1 rounded-lg border border-line bg-card px-3.5 py-3 text-sm text-ink outline-none focus:border-brand"
          />
          <button
            type="button"
            onClick={() => handleSend()}
            className="shrink-0 rounded-lg bg-brand px-4 text-sm font-bold text-white"
          >
            전송
          </button>
        </div>
      </div>
    </div>
  );
}
