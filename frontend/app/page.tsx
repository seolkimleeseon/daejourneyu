async function getPlaces() {
  // 서버 컴포넌트에서 백엔드 호출 (next.config의 rewrites로 프록시)
  try {
    const res = await fetch("http://localhost:4000/api/places", { cache: "no-store" });
    if (!res.ok) return [];
    return (await res.json()) as { id: number; name: string; cat: string; gu: string }[];
  } catch {
    return [];
  }
}

export default async function Home() {
  const places = await getPlaces();
  return (
    <main style={{ maxWidth: 500, margin: "0 auto", padding: "var(--inset)" }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--main)" }}>🐾 Daejourneyu</h1>
      <p style={{ color: "var(--muted)", marginTop: 6 }}>
        Next.js + TypeScript + PWA · Node.js 백엔드 연동
      </p>
      <h2 style={{ fontSize: 16, fontWeight: 800, marginTop: 24 }}>반려동물 동반 장소</h2>
      <ul style={{ listStyle: "none", marginTop: 12, display: "grid", gap: 10 }}>
        {places.length === 0 && <li style={{ color: "var(--muted)" }}>백엔드(:4000)를 실행해주세요.</li>}
        {places.map((p) => (
          <li key={p.id} style={{ background: "var(--card)", border: "1px solid var(--g90)", borderRadius: "var(--radius-card)", padding: 14 }}>
            <strong>{p.name}</strong>
            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 3 }}>{p.gu} · {p.cat}</div>
          </li>
        ))}
      </ul>
    </main>
  );
}
