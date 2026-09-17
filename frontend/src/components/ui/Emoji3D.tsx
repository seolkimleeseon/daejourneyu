import { cn } from "@/lib/cn";

/**
 * 평면 이모지 대신 쓰는 3D 렌더 아이콘(토스류 서비스에서 쓰는 스타일).
 * 출처: Microsoft Fluent Emoji 3D(MIT) — `public/icons/3d/`에 내려받아 셀프 호스팅한다.
 * 여기 매핑에 없는 이모지는 원래 문자를 그대로 보여준다 — 커버리지를 넓힐 때 이 표에만 추가하면 된다.
 *
 * next/image 대신 일반 <img>를 쓴다 — 이 컴포넌트가 CourseShareCard·MBTI 결과처럼 html-to-image로
 * 캡처되는 화면 안에서도 쓰이는데, next/image의 최적화 프록시(/_next/image?url=...)를 거친 이미지는
 * 캡처 시점에 안 읽혀서 저장된 이미지에서 아이콘이 빈 칸으로 나왔다. 로컬 PNG라 최적화 이득도 없다.
 */
const EMOJI_3D_MAP: Record<string, string> = {
  "✨": "/icons/3d/sparkles_3d.png",
  "🤖": "/icons/3d/robot_3d.png",
  "📍": "/icons/3d/round_pushpin_3d.png",
  "🔖": "/icons/3d/bookmark_3d.png",
  "🐾": "/icons/3d/paw_prints_3d.png",
  "🌳": "/icons/3d/deciduous_tree_3d.png",
  "🎾": "/icons/3d/tennis_3d.png",
  "🍖": "/icons/3d/meat_on_bone_3d.png",
  "🎨": "/icons/3d/artist_palette_3d.png",
  "🥐": "/icons/3d/croissant_3d.png",
  "🏛️": "/icons/3d/classical_building_3d.png",
  "🎯": "/icons/3d/bullseye_3d.png",
  "🐶": "/icons/3d/dog_face_3d.png",
  "🐈": "/icons/3d/cat_face_3d.png",
  "🐕": "/icons/3d/dog_3d.png",
  "🐩": "/icons/3d/poodle_3d.png",
  "🎉": "/icons/3d/party_popper_3d.png",
  "🧭": "/icons/3d/compass_3d.png",
  "🗺️": "/icons/3d/world_map_3d.png",
  "🥾": "/icons/3d/hiking_boot_3d.png",
  "🥺": "/icons/3d/pleading_face_3d.png",
  "🧐": "/icons/3d/face_with_monocle_3d.png",
  "😳": "/icons/3d/flushed_face_3d.png",
  "🦴": "/icons/3d/bone_3d.png",
  "🐕‍🦺": "/icons/3d/service_dog_3d.png",
  "⏰": "/icons/3d/alarm_clock_3d.png",
  "📅": "/icons/3d/tear-off_calendar_3d.png",
  "😎": "/icons/3d/smiling_face_with_sunglasses_3d.png",
  "🎒": "/icons/3d/backpack_3d.png",
  "🤔": "/icons/3d/thinking_face_3d.png",
  "🧸": "/icons/3d/teddy_bear_3d.png",
  "🪀": "/icons/3d/yo-yo_3d.png",
  "🔍": "/icons/3d/magnifying_glass_tilted_left_3d.png",
  "🌙": "/icons/3d/crescent_moon_3d.png",
  "🏠": "/icons/3d/house_3d.png",
  "🌸": "/icons/3d/cherry_blossom_3d.png",
  "🌈": "/icons/3d/rainbow_3d.png",
  "💡": "/icons/3d/light_bulb_3d.png",
  "🎲": "/icons/3d/game_die_3d.png",
  "💭": "/icons/3d/thought_balloon_3d.png",
  "🚀": "/icons/3d/rocket_3d.png",
  "🤝": "/icons/3d/handshake_3d.png",
  "⭐": "/icons/3d/star_3d.png",
  "🎈": "/icons/3d/balloon_3d.png",
  // 둘러보기(FEED)
  "🔒": "/icons/3d/locked_3d.png",
  "📰": "/icons/3d/newspaper_3d.png",
  "✍️": "/icons/3d/writing_hand_3d.png",
  "🗑": "/icons/3d/wastebasket_3d.png",
  "🔥": "/icons/3d/fire_3d.png",
  "📥": "/icons/3d/inbox_tray_3d.png",
  "❤️": "/icons/3d/red_heart_3d.png",
  "🤍": "/icons/3d/white_heart_3d.png",
  // 마이(MY) — 여권·반려동물
  "👋": "/icons/3d/waving_hand_3d.png",
  "🔔": "/icons/3d/bell_3d.png",
  "🦮": "/icons/3d/guide_dog_3d.png",
  "🐇": "/icons/3d/rabbit_3d.png",
  // 마이(MY) — 뱃지
  "❔": "/icons/3d/white_question_mark_3d.png",
  "⛰️": "/icons/3d/mountain_3d.png",
  "❄️": "/icons/3d/snowflake_3d.png",
  "🌄": "/icons/3d/sunrise_over_mountains_3d.png",
  "🌟": "/icons/3d/glowing_star_3d.png",
  "🌧️": "/icons/3d/cloud_with_rain_3d.png",
  "🌰": "/icons/3d/chestnut_3d.png",
  "🌲": "/icons/3d/evergreen_tree_3d.png",
  "🍁": "/icons/3d/maple_leaf_3d.png",
  "🍚": "/icons/3d/cooked_rice_3d.png",
  "🍽️": "/icons/3d/fork_and_knife_with_plate_3d.png",
  "🎂": "/icons/3d/birthday_cake_3d.png",
  "🎆": "/icons/3d/fireworks_3d.png",
  "🎪": "/icons/3d/circus_tent_3d.png",
  "🏞️": "/icons/3d/national_park_3d.png",
  "🏡": "/icons/3d/house_with_garden_3d.png",
  "🐢": "/icons/3d/turtle_3d.png",
  "💚": "/icons/3d/green_heart_3d.png",
  "💯": "/icons/3d/hundred_points_3d.png",
  "📆": "/icons/3d/tear-off_calendar_3d.png",
  "📸": "/icons/3d/camera_with_flash_3d.png",
  "🚌": "/icons/3d/bus_3d.png",
  "🚗": "/icons/3d/automobile_3d.png",
  "🚩": "/icons/3d/triangular_flag_3d.png",
  "🤸": "/icons/3d/person_cartwheeling_3d.png",
  "🧬": "/icons/3d/dna_3d.png",
  "🧳": "/icons/3d/luggage_3d.png",
};

/**
 * 이모지 이성질체(U+FE0F 이형 선택자) 흡수용 조회 인덱스.
 * 같은 그림인데 소스마다 "⛰️"처럼 붙어 있기도, "🗑"처럼 빠져 있기도 해서 — 키를 그대로 비교하면
 * 한쪽만 3D로 바뀌고 다른 쪽은 평면 이모지로 남는다. 조회 전에 양쪽 모두 떼어내고 맞춘다.
 */
const stripVariationSelector = (emoji: string) => emoji.replace(/\uFE0F/g, "");

const EMOJI_3D_INDEX: Record<string, string> = Object.fromEntries(
  Object.entries(EMOJI_3D_MAP).map(([emoji, src]) => [stripVariationSelector(emoji), src])
);

interface Emoji3DProps {
  emoji: string;
  /** px 단위 정사각 크기. */
  size?: number;
  className?: string;
  /** 아이콘 뒤에 번지는 은은한 색 블롭(Tailwind bg 클래스, 예: "bg-brand-300"). 단색 배경 위에서
   * 아이콘이 딱딱한 사각 칩 안에 박혀 보이지 않고 공중에 떠 있는 것처럼 보이게 한다. */
  glowClassName?: string;
  /** 바닥에 닿는 듯한 접지 그림자. 평면 이모지가 아니라 진짜 렌더라는 걸 알아보게 하는 디테일이라
   * 기본으로 켜져 있다 — 아주 작은 인라인 아이콘 등에서만 false로 끈다. */
  shadow?: boolean;
}

export function Emoji3D({ emoji, size = 28, className, glowClassName, shadow = true }: Emoji3DProps) {
  const src = EMOJI_3D_INDEX[stripVariationSelector(emoji)];

  if (!src) {
    // 3D 렌더가 없는 이모지도 매핑된 아이콘과 같은 정사각 박스를 차지해야, 같은 자리에서
    // 쓰일 때(예: 타일 버튼 3개 나란히) 아이콘 크기·위치가 달라 보이지 않는다.
    return (
      <span
        className={cn("relative inline-flex items-center justify-center leading-none", className)}
        style={{ width: size, height: size, fontSize: size * 0.75 }}
      >
        {emoji}
      </span>
    );
  }

  return (
    <span className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      {glowClassName ? (
        <span
          aria-hidden
          className={cn("absolute rounded-full opacity-35 blur-md", glowClassName)}
          style={{ width: size * 0.75, height: size * 0.75 }}
        />
      ) : null}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        width={size}
        height={size}
        className={cn(
          "relative inline-block shrink-0 select-none",
          shadow && "drop-shadow-[0_3px_4px_rgba(0,0,0,0.12)]",
          className
        )}
        draggable={false}
      />
    </span>
  );
}
