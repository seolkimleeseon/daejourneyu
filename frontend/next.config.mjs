import withPWAInit from "next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development", // 개발 중엔 SW 비활성(캐시 혼란 방지)
});

// 백엔드(Railway 등) 배포 도메인. 미설정 시(로컬 개발) localhost:4000을 쓴다.
const BACKEND_ORIGIN = process.env.BACKEND_ORIGIN ?? "http://localhost:4000";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    // /api/* 요청을 백엔드(Node, backend/)로 프록시
    return [{ source: "/api/:path*", destination: `${BACKEND_ORIGIN}/api/:path*` }];
  },
};

export default withPWA(nextConfig);
