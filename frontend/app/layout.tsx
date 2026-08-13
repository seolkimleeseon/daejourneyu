import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import { Providers } from "@/components/shell/Providers";

export const metadata: Metadata = {
  title: "Daejourneyu — 대전 반려동물 여행",
  description: "반려동물과 함께하는 대전 여행 플랫폼",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Daejourneyu" },
};

export const viewport: Viewport = {
  themeColor: "#35AD90",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css"
        />
      </head>
      <body>
        {/* 카카오톡 공유하기 SDK — https://developers.kakao.com/docs/ko/kakaotalk-share/js-link */}
        <Script src="https://developers.kakao.com/sdk/js/kakao.min.js" strategy="afterInteractive" />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
