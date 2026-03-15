import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // 이미지는 /api/image 프록시를 통해 제공 — 외부 도메인 직접 허용 없음
    remotePatterns: [],
  },
};

export default nextConfig;
