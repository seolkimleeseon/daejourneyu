import { Emoji3D } from "@/components/ui/Emoji3D";
import { CATEGORY_EMOJI, nightsLabel } from "@/lib/courseFormat";
import type { Place } from "@/types";

interface CourseShareCardProps {
  title: string;
  /** 헤더에 보여줄 뱃지 문구(이모지 포함). 예: ["☀️ 당일치기", "🚗 자차"] */
  tags: string[];
  days: Place[][];
}

/** app/globals.css의 @theme 토큰 값을 그대로 옮겨왔다 — 아래 이유로 Tailwind 클래스 대신
 * 인라인 style로 직접 박아 넣어야 해서, 토큰 자체는 여기서 중복 정의할 수밖에 없다. */
const COLOR = {
  amber: "#b8891c",
  amberLight: "#fdf3d2",
  coral: "#ff8a3d",
  coralLight: "#ffe9d6",
  ink: "#253039",
  inkMuted: "#6b7682",
  line: "#eceff1",
  surface: "#f8f9fa",
  card: "#ffffff",
};

/** 헤더/바디 이음새의 반원 노치 하나. 좌우 가장자리에 정확히 걸치도록 원 중심을 카드 폭 경계에 둔다 —
 * 캡처 시 카드 폭(360px) 밖으로 나간 절반은 캔버스 경계에서 잘려서, 딱 절취선을 오려낸 듯한 반원만 남는다. */
function TicketNotch({ side }: { side: "left" | "right" }) {
  return (
    <div
      style={{
        position: "absolute",
        top: -12,
        [side]: -12,
        width: 24,
        height: 24,
        borderRadius: "50%",
        background: COLOR.surface,
      }}
    />
  );
}

/**
 * 이미지 저장·카카오톡 공유 전용 카드. 화면에 보이는 편집 UI를 그대로 캡처하면 "앱 스크린샷" 느낌이
 * 강해서, 브랜드 헤더·요약·동선을 다시 짠 전용 레이아웃을 하나 만들어 숨겨두고 그걸 캡처한다
 * (호출부에서 `position: fixed; left: -9999px`로 화면 밖에 렌더링).
 * 헤더와 동선 표 사이에 비행기 티켓/영수증처럼 반원 노치 + 점선 절취선을 넣어서 "공유용으로
 * 만들어진 카드"라는 느낌을 확실히 준다.
 *
 * 캡처는 `src/lib/captureImage.ts`의 html-to-image가 담당한다(원래 html2canvas를 썼는데
 * 자체 텍스트 렌더링 버그로 한글이 깨져서 교체했다 — 그 파일 주석 참고).
 *
 * 이 컴포넌트는 Tailwind 클래스 대신 인라인 style로 색·레이아웃을 지정한다 — html-to-image로
 * 바꾼 뒤로는 필수는 아니지만, 캡처 전용 카드라 어떤 렌더러를 쓰든 안전하게 그대로 나오게 유지한다.
 *
 * 장소 사진 대신 카테고리 3D 아이콘을 쓴다 — 카카오 검색 사진은 대부분 CORS 헤더가 없어서
 * 캡처 시 깨지거나 빈 칸으로 나오는데, 우리가 직접 호스팅하는 아이콘은 그 문제가 없다.
 */
export function CourseShareCard({ title, tags, days }: CourseShareCardProps) {
  const nights = Math.max(0, days.length - 1);
  const stopCount = days.reduce((sum, day) => sum + day.length, 0);

  return (
    <div style={{ width: 360, fontFamily: '"Malgun Gothic", "Apple SD Gothic Neo", "Noto Sans KR", sans-serif' }}>
      <div
        style={{
          borderRadius: "24px 24px 0 0",
          background: COLOR.coralLight,
          padding: "24px 24px 28px",
          color: COLOR.ink,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 800, letterSpacing: 0.5, color: COLOR.coral }}>
          <Emoji3D emoji="🐾" size={18} shadow={false} />
          DAEJOURNEYU
        </div>
        <div style={{ marginTop: 16, fontSize: 20, fontWeight: 800, lineHeight: 1.4, wordBreak: "keep-all", color: COLOR.ink }}>
          {title}
        </div>
        <div style={{ marginTop: 6, fontSize: 12, fontWeight: 600, color: COLOR.inkMuted }}>
          {nightsLabel(nights)} · {stopCount}곳
        </div>
        {tags.length > 0 ? (
          <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 6 }}>
            {tags.map((tag) => (
              <span
                key={tag}
                style={{
                  borderRadius: 999,
                  background: COLOR.card,
                  color: COLOR.coral,
                  padding: "4px 10px",
                  fontSize: 10,
                  fontWeight: 700,
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      {/* 티켓 절취선 — 반원 노치(좌우) + 가운데 점선 */}
      <div style={{ position: "relative", height: 0 }}>
        <TicketNotch side="left" />
        <TicketNotch side="right" />
        <div style={{ position: "absolute", left: 28, right: 28, top: -1, borderTop: `2px dashed ${COLOR.line}` }} />
      </div>

      <div style={{ borderRadius: "0 0 24px 24px", background: COLOR.card, padding: "26px 20px 20px" }}>
        {days.map((day, dayIndex) => (
          <div key={dayIndex} style={{ marginBottom: 16 }}>
            {days.length > 1 ? (
              <div style={{ marginBottom: 8, fontSize: 12, fontWeight: 800, color: COLOR.coral }}>{dayIndex + 1}일차</div>
            ) : null}
            <div style={{ overflow: "hidden", borderRadius: 12, border: `1px solid ${COLOR.line}` }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "30px 1fr 82px",
                  background: COLOR.amberLight,
                }}
              >
                <div style={{ padding: "8px 6px", textAlign: "center", fontSize: 10, fontWeight: 800, color: COLOR.amber }}>#</div>
                <div style={{ padding: "8px 10px", fontSize: 10, fontWeight: 800, color: COLOR.amber }}>장소</div>
                <div style={{ padding: "8px 10px", fontSize: 10, fontWeight: 800, color: COLOR.amber }}>분류</div>
              </div>
              {day.map((place, i) => (
                <div
                  key={place.id ?? `${dayIndex}-${i}`}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "30px 1fr 82px",
                    background: i % 2 === 1 ? COLOR.surface : COLOR.card,
                    borderTop: `1px solid ${COLOR.line}`,
                  }}
                >
                  <div style={{ padding: "10px 6px", textAlign: "center", fontSize: 12, fontWeight: 700, color: COLOR.inkMuted }}>
                    {i + 1}
                  </div>
                  <div style={{ padding: "10px 10px", minWidth: 0 }}>
                    <span
                      style={{
                        display: "block",
                        fontSize: 12,
                        fontWeight: 700,
                        color: COLOR.ink,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {CATEGORY_EMOJI[place.category] ?? "📍"} {place.name}
                    </span>
                  </div>
                  <div
                    style={{
                      padding: "10px 10px",
                      minWidth: 0,
                      fontSize: 10,
                      color: COLOR.inkMuted,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {place.district} · {place.category}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div
          style={{
            marginTop: 16,
            borderTop: `1px dashed ${COLOR.line}`,
            paddingTop: 12,
            textAlign: "center",
            fontSize: 10,
            color: COLOR.inkMuted,
          }}
        >
          🐾 대저니유에서 만든 반려동물 여행 코스
        </div>
      </div>
    </div>
  );
}
