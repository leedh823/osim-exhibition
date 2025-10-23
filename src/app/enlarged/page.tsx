'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function EnlargedVideo() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);

  // 2번 영상 재생 (사이트 진입 시 1번만, 끝나면 다시 재생)
  useEffect(() => {
    if (videoRef.current) {
      const video = videoRef.current;
      let hasStartedPlaying = false;
      
      const handleCanPlay = () => {
        if (!hasStartedPlaying) {
          console.log('2번 영상 재생 가능 - 재생 시작');
          hasStartedPlaying = true;
          video.play().catch(console.error);
        }
      };
      
      const handleEnded = () => {
        console.log('2번 영상 재생 완료 - 다시 재생');
        video.currentTime = 0;
        video.play().catch(console.error);
      };
      
      const handlePlay = () => {
        console.log('2번 영상 재생 중...');
      };
      
      const handlePause = () => {
        console.log('2번 영상 일시정지');
      };
      
      video.addEventListener('canplay', handleCanPlay);
      video.addEventListener('ended', handleEnded);
      video.addEventListener('play', handlePlay);
      video.addEventListener('pause', handlePause);
      
      return () => {
        video.removeEventListener('canplay', handleCanPlay);
        video.removeEventListener('ended', handleEnded);
        video.removeEventListener('play', handlePlay);
        video.removeEventListener('pause', handlePause);
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
        <div>재생 모드: 끝나면 다시 재생</div>
        <div>재생 시간: {videoRef.current?.currentTime?.toFixed(1) || '0.0'}초</div>
        <div>영상 길이: {videoRef.current?.duration?.toFixed(1) || '0.0'}초</div>
      </div>
      
      {/* 클릭 안내 */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white font-mono text-lg animate-pulse z-10">
        CLICK TO START AI CHAT
      </div>
    </div>
  );
}
