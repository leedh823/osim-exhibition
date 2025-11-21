import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 빌드 최적화
  swcMinify: true,
  // 컴파일러 최적화
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },
  // 이미지 최적화
  images: {
    unoptimized: false,
  },
};

export default nextConfig;
