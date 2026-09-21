"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { TopBar } from "@/components/shell/TopBar";
import { LoginModal } from "@/components/my/LoginModal";
import { Emoji3D } from "@/components/ui/Emoji3D";
import { useToastStore } from "@/stores/useToastStore";
import { useCourseStore } from "@/stores/useCourseStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { usePetStore } from "@/stores/usePetStore";
import { cn } from "@/lib/cn";
import { authFetch } from "@/lib/api/authFetch";
import { usePickablePlaces } from "@/hooks/usePickablePlaces";
import { parseTripConditions, pickChatCandidates } from "@/lib/chatCandidates";
import type { PickablePlace } from "@/lib/petTourMapper";
import type { Course, CourseStop } from "@/types";

type CourseSuggestion = Omit<Course, "id">;

/** 코스 답 아래 붙는 "이렇게 바꿔서 다시" 버튼. 누르면 label이 내 말풍선이 되고 prompt로 다시 묻는다. */
interface FollowUp {
  label: string;
  prompt: string;
  /** 이미 보여준 장소 — 같은 코스를 되풀이하지 않게 서버가 후보에서 뺀다. */
  excludeIds?: string[];
}

interface ChatMessage {
  id: string;
  role: "user" | "bot";
  text: string;
  pending?: boolean;
  stops?: CourseStop[];
  course?: CourseSuggestion;
  followUps?: FollowUp[];
  action?: { label: string; href: string };
}

/** AI가 코스 하나를 짜는 데 12~25초, 한 번 다시 짜면 그 두 배까지 걸린다. */
const REQUEST_TIMEOUT_MS = 60_000;
const BAKERY_REQUEST_TIMEOUT_MS = 75_000;
/** 이 시간이 지나도 답이 없으면 멈춘 게 아니라는 안내를 덧붙인다. */
const SLOW_HINT_AFTER_MS = 10_000;

/** 방금 받은 코스에서 이어서 눌러볼 만한 변형. 이미 그 조건이면 그 버튼은 뺀다. */
function buildFollowUps(prompt: string, course: CourseSuggestion): FollowUp[] {
  const excludeIds = course.days.flat().map((stop) => stop.placeId);
  const followUps: FollowUp[] = [{ label: "🔄 다른 곳으로 다시 짜줘", prompt, excludeIds }];
  if (course.nights === 0) followUps.push({ label: "🌙 1박 2일로 늘려줘", prompt: `${prompt} 1박 2일`, excludeIds: [] });
  if (course.transport === "자차") followUps.push({ label: "🚌 대중교통으로 짜줘", prompt: `${prompt} 대중교통으로`, excludeIds: [] });
  return followUps;
}

interface FaqItem {
  q: string;
  a: string;
  /** 정확히 같은 문장이 아니어도 이 키워드 중 하나라도 포함되면 같은 답으로 매칭한다(자유 입력 대응). */
  keywords: string[];
  actionLabel?: string;
  href?: string;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    q: "이 앱은 뭐 하는 곳이야?",
    a: "대전 5개 구의 반려동물 동반 여행지를 소개하고, 그걸 묶어 여행 코스로 만들어주는 앱이에요 🐾",
    // "뭐야"는 "유성구 맛집 뭐야?"처럼 실제 장소 질문에도 걸려 FAQ로 가로채버려서 뺐다
    // (장소 질문은 AI 코스 추천으로 흘러야 한다).
    keywords: ["뭐 하는", "뭐하는", "무슨 서비스", "무슨 앱", "서비스 설명", "앱 설명", "서비스 소개", "앱 소개", "설명해줘", "소개해줘"],
  },
  {
    q: "코스는 어떻게 만들어?",
    a: "내 여정 탭에서 MBTI 추천·AI 추천·직접 짓기 중 하나로 만들 수 있어요. 저장하면 보관함에 담겨요.",
    // "코스 짜줘"·"코스 만들어줘"는 질문이 아니라 실제 코스 요청이라 여기서 가로채면 안 된다
    // (AI 추천으로 흘러야 한다). 방법을 묻는 표현만 남긴다.
    keywords: ["코스 어떻게", "코스는 어떻게", "코스 만드는 법", "코스 만드는 방법", "코스 짜는 법", "코스 짜는 방법"],
    actionLabel: "코스 만들러 가기",
    href: "/schedule",
  },
  {
    q: "MBTI가 뭐야?",
    a: "반려동물의 여행 성향을 진단하는 테스트예요. 결과에 따라 어울리는 코스 테마를 추천해드려요.",
    keywords: ["mbti가", "mbti는", "mbti 뭐", "엠비티아이"],
    actionLabel: "MBTI 검사하러 가기",
    href: "/schedule/course/new/mbti",
  },
];

const QUICK_PROMPTS = ["🥐 빵지순례 코스 추천해줘", "조용히 산책하기 좋은 곳", "당일치기 코스 추천해줘", "실내 카페 위주로", "소형견도 갈 수 있는 곳"];

/** 비로그인 상태로 "코스 저장하기"를 누르면 로그인 화면으로 이동했다가 돌아오는데, 그 왕복에
 * 이 페이지가 통째로 언마운트·리마운트돼 React state(코스 내용)가 사라진다. 로그인 후에도
 * 저장을 이어갈 수 있게 세션스토리지에 잠깐 담아둔다. */
const PENDING_COURSE_SAVE_KEY = "daejourneyu:chatbot-pending-course";

const THINKING_PHRASES = ["킁킁 냄새 맡는 중...", "지도를 펼치는 중...", "발자국 따라가는 중...", "코스를 그리는 중..."];

/** "생각하는 중..." 고정 문구 대신 문구를 순환시키며 발바닥이 통통 튀는 로딩 인터랙션. */
function ThinkingIndicator() {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setPhraseIndex((prev) => (prev + 1) % THINKING_PHRASES.length), 1100);
    const slowId = setTimeout(() => setSlow(true), SLOW_HINT_AFTER_MS);
    return () => {
      clearInterval(id);
      clearTimeout(slowId);
    };
  }, []);

  return (
    <div className="flex items-center gap-2 py-0.5">
      <div className="flex gap-0.5">
        {[0, 1, 2].map((i) => (
          <span key={i} className="inline-block animate-bounce" style={{ animationDelay: `${i * 0.15}s` }}>
            <Emoji3D emoji="🐾" size={16} />
          </span>
        ))}
      </div>
      <span className="text-xs text-ink-muted">
        {slow ? "가까운 곳끼리 꼼꼼히 짜는 중이에요. 최대 1분 걸려요" : THINKING_PHRASES[phraseIndex]}
      </span>
    </div>
  );
}

function matchFaq(text: string): FaqItem | undefined {
  const normalized = text.replace(/\s/g, "");
  return FAQ_ITEMS.find(
    (item) => item.q === text || item.keywords.some((keyword) => normalized.includes(keyword.replace(/\s/g, "")))
  );
}

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export default function ChatbotPage() {
  const router = useRouter();
  const showToast = useToastStore((state) => state.show);
  const addCourse = useCourseStore((state) => state.addCourse);
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const { data: apiPlaces } = usePickablePlaces();

  const [loginOpen, setLoginOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "greeting",
      role: "bot",
      text: "안녕하세요! 대저니유 안내입니다 🐾\n반려동물이랑 갈 곳을 추천해드리거나, 코스로 짜드릴게요. 아래에서 골라보거나 편하게 물어보세요!\n\n💡 구·기간·이동수단을 말해주면 더 정확해요.\n예) \"대덕구 1박 2일 대중교통 코스 짜줘\"",
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

  const requestCourseSuggestion = async (prompt: string, excludeIds: string[] = []) => {
    const pendingId = makeId();
    appendMessage({ id: pendingId, role: "bot", text: "생각하는 중...", pending: true });

    // 응답이 너무 오래 걸리면(기본 fetch는 브라우저 기본 타임아웃까지 무한정 기다린다) 안내
    // 메시지로 대신 끊는다 — 사용자가 "생각하는 중..." 애니메이션만 하염없이 보는 걸 막는다.
    // 백엔드는 검증에 걸리면 이유를 알려 한 번 더 짜므로(backend/src/routes/ai.ts) 그 시간까지 기다린다.
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      /빵지순례|빵집|베이커리|제과점/.test(prompt) ? BAKERY_REQUEST_TIMEOUT_MS : REQUEST_TIMEOUT_MS
    );

    try {
      if (!apiPlaces?.length) {
        replacePending(pendingId, { text: "장소 정보를 불러오지 못했어요. 잠시 후 다시 시도해주세요" });
        return;
      }
      let places: PickablePlace[] = apiPlaces;
      if (/빵지순례|빵집|베이커리|제과점/.test(prompt)) {
        const district = ["대덕구", "동구", "유성구", "중구", "서구"].find((name) => prompt.includes(name));
        const query = district ? `?district=${encodeURIComponent(district)}` : "";
        const bakeryRes = await authFetch(`/api/places/bakeries${query}`, { signal: controller.signal });
        const bakeries = bakeryRes.ok ? (await bakeryRes.json()) as PickablePlace[] : [];
        if (bakeries.length === 0) {
          replacePending(pendingId, { text: "빵집 데이터를 불러오지 못했어요. 잠시 후 다시 시도해주세요" });
          return;
        }
        places = [...places, ...bakeries];
      }
      const candidatePlaces = pickChatCandidates(places, prompt);
      // 함께 가는 아이의 크기·나이를 알려주면 소형견은 짧게, 대형견은 크기 제한 없는 곳으로 짠다.
      const activePet = usePetStore.getState().activePet();
      const pet = activePet
        ? { name: activePet.name, breed: activePet.breed, size: activePet.size, ageYears: activePet.ageYears }
        : undefined;
      const res = await authFetch("/api/ai/course-suggestion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, ...parseTripConditions(prompt), candidatePlaces, pet, excludeIds }),
        signal: controller.signal,
      });
      // 코스 추천 요청이어도 AI가 판단해서 잡담/설명이면 chat으로, 실제 코스 요청이면 course로 답한다
      // (백엔드 /api/ai/course-suggestion 참고) — 매번 코스를 억지로 지어내지 않게 하기 위함.
      const data:
        | { responseType: "chat"; message: string }
        | (CourseSuggestion & { responseType: "course"; summary?: string })
        | { error: string } = await res.json();
      if (!res.ok || "error" in data) {
        replacePending(pendingId, {
          text: "error" in data ? data.error : "답을 만들지 못했어요. 잠시 후 다시 시도해주세요",
        });
        return;
      }
      if (data.responseType === "chat") {
        replacePending(pendingId, { text: data.message });
        return;
      }
      const stops = data.days.flat();
      const { summary, ...course } = data;
      replacePending(pendingId, {
        text: `말씀하신 조건에 맞춰 골라봤어요 🐾\n"${data.label}"${summary ? `\n\n${summary}` : ""}`,
        stops,
        course,
        followUps: buildFollowUps(prompt, course),
      });
    } catch (error) {
      const timedOut = error instanceof DOMException && error.name === "AbortError";
      replacePending(pendingId, {
        text: timedOut
          ? "지금은 답변하기 어려워요. 잠시 후 다시 시도해주세요"
          : "답을 만들지 못했어요. 잠시 후 다시 시도해주세요",
      });
    } finally {
      clearTimeout(timeoutId);
    }
  };

  const handleFollowUp = (followUp: FollowUp) => {
    appendMessage({ id: makeId(), role: "user", text: followUp.label.replace(/^\S+\s/, "") });
    requestCourseSuggestion(followUp.prompt, followUp.excludeIds);
  };

  const handleSend = (presetText?: string) => {
    const text = (presetText ?? input).trim();
    if (!text) return;
    appendMessage({ id: makeId(), role: "user", text });
    setInput("");

    const faq = matchFaq(text);
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
    if (!isLoggedIn) {
      // 로그인 화면으로 이동하면 이 페이지가 통째로 리마운트돼 course를 담은 React state는
      // 사라진다 — 로그인 후 돌아왔을 때 이어서 저장할 수 있게 세션스토리지에 담아둔다.
      try {
        sessionStorage.setItem(PENDING_COURSE_SAVE_KEY, JSON.stringify(course));
      } catch (error) {
        console.error("로그인 전 코스를 임시 저장하지 못했어요:", error);
      }
      setLoginOpen(true);
      return;
    }
    saveCourse(course);
  };

  const saveCourse = (course: CourseSuggestion) => {
    const saved = addCourse(course);
    showToast("코스를 보관함에 저장했어요 🐾");
    router.push(`/schedule/course/${saved.id}`);
  };

  // 로그인 후 이 페이지로 돌아왔을 때(next 복귀) 저장을 이어간다.
  useEffect(() => {
    if (!isLoggedIn) return;
    const raw = sessionStorage.getItem(PENDING_COURSE_SAVE_KEY);
    if (!raw) return;
    sessionStorage.removeItem(PENDING_COURSE_SAVE_KEY);
    try {
      saveCourse(JSON.parse(raw) as CourseSuggestion);
    } catch (error) {
      console.error("로그인 후 이어서 저장할 코스를 복원하지 못했어요:", error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn]);

  return (
    <div className="flex flex-col" style={{ height: "calc(100dvh - 76px)" }}>
      <TopBar title="AI에게 물어보기" showBack />

      <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-3">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn("mb-3 flex items-end gap-1.5", message.role === "user" ? "justify-end" : "justify-start")}
          >
            {message.role === "bot" ? (
              <span className="mb-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-purple-light">
                <Emoji3D emoji="🤖" size={22} shadow={false} />
              </span>
            ) : null}
            <div
              className={cn(
                "max-w-[76%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                message.role === "user"
                  ? "bg-accent-purple text-white"
                  : "border border-line bg-card text-ink"
              )}
            >
              {message.pending ? (
                <ThinkingIndicator />
              ) : (
                <span className="whitespace-pre-line">{message.text}</span>
              )}

              {message.stops && message.stops.length > 0 ? (
                <div className="mt-2 flex flex-col gap-1.5">
                  {message.stops.map((stop) => (
                    <button
                      key={stop.placeId}
                      type="button"
                      onClick={() => {
                        if (!stop.placeId.startsWith("bakery-")) {
                          router.push(`/place/${encodeURIComponent(stop.name)}?id=${encodeURIComponent(stop.placeId)}`);
                        }
                      }}
                      className="flex items-center gap-2 rounded-lg border border-line bg-surface px-2.5 py-2 text-left"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-xs font-bold text-ink">{stop.name}</div>
                        <div className="mt-0.5 truncate text-[10px] text-ink-muted">
                          {stop.district} · {stop.category}{stop.placeId.startsWith("bakery-") ? " · 동반 가능 여부 확인 필요" : ""}
                        </div>
                      </div>
                      <span className="shrink-0 text-xs">
                        {stop.placeId.startsWith("bakery-") ? "확인 필요" : stop.petFriendly ? <Emoji3D emoji="🐾" size={16} shadow={false} /> : "🚫"}
                      </span>
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
                  <Emoji3D emoji="🐾" size={16} shadow={false} />이 코스 저장하기
                </button>
              ) : null}

              {message.followUps && message.followUps.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {message.followUps.map((followUp) => (
                    <button
                      key={followUp.label}
                      type="button"
                      onClick={() => handleFollowUp(followUp)}
                      className="rounded-full border border-brand-300 bg-brand-100 px-2.5 py-1.5 text-[11px] font-semibold text-brand-700"
                    >
                      {followUp.label}
                    </button>
                  ))}
                </div>
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
        <div className="mb-2.5 flex flex-wrap gap-1.5">
          {QUICK_PROMPTS.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => handleSend(q)}
              className="rounded-full bg-line px-3 py-1.5 text-[11px] font-semibold text-ink-muted"
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
              // 한글 입력 중 마지막 글자를 확정하는 Enter까지 전송으로 잡히면 안 된다 —
              // isComposing이면 조합이 아직 끝나지 않은 것이므로 무시한다.
              if (event.key === "Enter" && !event.nativeEvent.isComposing) handleSend();
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
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </div>
  );
}
