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
        <meta name="mobile-web-app-capable" content="yes" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css"
        />
      </head>
      <body>
        {/* 카카오톡 공유하기 SDK — https://developers.kakao.com/docs/ko/kakaotalk-share/js-link
            developers.kakao.com/sdk/js/kakao.min.js(버전 미표기 레거시 경로)는 PC 웹에서
            카카오톡 앱이 없을 때 뜨는 QR 공유 팝업이 안 열리는 문제가 있었다 — 카카오가 현재
            안내하는 버전 명시 CDN(t1.kakaocdn.net)으로 교체. integrity 해시는 배포된 파일을
            직접 sha384로 계산한 값(카카오 다운로드 페이지의 값과 동일한 방식). */}
        <Script
          src="https://t1.kakaocdn.net/kakao_js_sdk/2.8.2/kakao.min.js"
          integrity="sha384-zt/G7/KfaRQ9dT/QIkS0ujMtzouJqzuSJcXVQu50x0rl/+mD1dc70AeOejVbMD9E"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
