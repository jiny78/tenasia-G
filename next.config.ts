import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Cloudflare R2 퍼블릭 버킷 도메인 허용 → Next.js 이미지 최적화 활성화
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.r2.dev",
      },
    ],
    // 브라우저 지원에 따라 AVIF → WebP → JPEG 순서로 최적 포맷 제공
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
