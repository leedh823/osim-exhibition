import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 빌드 최적화
  swcMinify: true,
  // 컴파일러 최적화
  compiler: {
    removeConsole: false, // 디버깅을 위해 console.log 유지
  },
  // 이미지 최적화
  images: {
    unoptimized: false,
  },
};

export default nextConfig;
