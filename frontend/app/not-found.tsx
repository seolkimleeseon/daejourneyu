import Link from "next/link";

/** 없는 주소로 들어왔을 때 — 영문 기본 화면 대신 앱 톤으로 안내하고 홈으로 돌려보낸다. */
export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-[480px] flex-col items-center justify-center px-6 text-center">
      <div className="mb-3 text-5xl" aria-hidden="true">
        🐾
      </div>
      <h1 className="mb-1.5 text-lg font-extrabold text-ink">페이지를 찾을 수 없어요</h1>
      <p className="mb-6 text-xs leading-relaxed text-ink-muted">
        주소가 바뀌었거나 없어진 페이지예요.
        <br />
        홈으로 돌아가서 다시 찾아볼까요?
      </p>
      <Link
        href="/home"
        className="flex min-h-11 items-center justify-center rounded-lg bg-brand-500 px-6 text-sm font-bold text-white shadow-sm"
      >
        홈으로 가기
      </Link>
    </main>
  );
}
