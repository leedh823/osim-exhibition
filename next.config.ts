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
  // 로컬 서버 환경 최적화: 정적 자산 캐싱 강화
  async headers() {
    return [
      {
        source: '/poster video :path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/:path*.mp4',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/:path*.png',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/:path*.jpg',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
