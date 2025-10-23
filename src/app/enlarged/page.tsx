'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function EnlargedVideo() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);

  // 2번 영상 로딩 완료 확인
  useEffect(() => {
    if (videoRef.current) {
      const video = videoRef.current;
      
      const handleLoadedData = () => {
        console.log('2번 영상 로딩 완료, 자동 재생 확인');
        // autoPlay 속성으로 자동 재생되므로 별도 play() 호출 불필요
      };
      
      const handlePlay = () => {
        console.log('2번 영상 재생 시작');
      };
      
      video.addEventListener('loadeddata', handleLoadedData);
      video.addEventListener('play', handlePlay);
      
      return () => {
        video.removeEventListener('loadeddata', handleLoadedData);
        video.removeEventListener('play', handlePlay);
      };
    }
  }, []);

  const handleVideoClick = () => {
    console.log('2번 영상 클릭됨! AI 채팅으로 이동');
    router.push('/ai-chat');
  };

  return (
    <div className="w-full h-screen bg-black aspect-[16/9] mx-auto relative overflow-hidden">
      {/* 영상 */}
      <video 
        ref={videoRef}
        className="w-full h-full object-cover cursor-pointer"
        autoPlay 
        loop 
        muted
        playsInline
        controls={false}
        onClick={handleVideoClick}
        onError={(e) => console.log('2.mp4 로딩 에러:', e)}
      >
        <source src="/2.mp4" type="video/mp4" />
      </video>
      
      {/* 디버깅 정보 */}
      <div className="absolute top-4 left-4 text-white font-mono text-sm z-20">
        <div>현재 페이지: enlarged</div>
        <div>2번 영상 재생 중</div>
        <div>영상 경로: /2.mp4</div>
        <div>자동재생: ON</div>
      </div>
      
      {/* 클릭 안내 */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white font-mono text-lg animate-pulse z-10">
        CLICK TO START AI CHAT
      </div>
    </div>
  );
}
