import withPWAInit from "next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development", // 개발 중엔 SW 비활성(캐시 혼란 방지)
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    // /api/* 요청을 백엔드(Node)로 프록시
    return [
      { source: "/api/:path*", destination: "http://localhost:4000/api/:path*" },
    ];
  },
};

export default withPWA(nextConfig);
