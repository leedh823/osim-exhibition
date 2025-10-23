'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function EnlargedVideo() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);

  // 2번 영상 재생 (화면 로딩 완료 후에만 재생, 끝나면 다시 재생)
  useEffect(() => {
    if (videoRef.current) {
      const video = videoRef.current;
      
      const handleCanPlayThrough = () => {
        console.log('2번 영상 로딩 완료 - 재생 시작');
        video.play().catch(console.error);
      };
      
      const handleEnded = () => {
        console.log('2번 영상 재생 완료 - 다시 재생');
        video.currentTime = 0;
        video.play().catch(console.error);
      };
      
      const handlePlay = () => {
        console.log('2번 영상 재생 중...');
      };
      
      const handleLoadStart = () => {
        console.log('2번 영상 로딩 시작...');
      };
      
      const handleLoadedData = () => {
        console.log('2번 영상 데이터 로딩 완료');
      };
      
      video.addEventListener('loadstart', handleLoadStart);
      video.addEventListener('loadeddata', handleLoadedData);
      video.addEventListener('canplaythrough', handleCanPlayThrough);
      video.addEventListener('ended', handleEnded);
      video.addEventListener('play', handlePlay);
      
      return () => {
        video.removeEventListener('loadstart', handleLoadStart);
        video.removeEventListener('loadeddata', handleLoadedData);
        video.removeEventListener('canplaythrough', handleCanPlayThrough);
        video.removeEventListener('ended', handleEnded);
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
        muted
        playsInline
        controls={false}
        onClick={handleVideoClick}
        onError={(e) => console.log('2.mp4 로딩 에러:', e)}
      >
        <source src="/2.mp4" type="video/mp4" />
      </video>
      
      
      {/* 클릭 안내 */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white font-mono text-lg animate-pulse z-10">
        CLICK TO START AI CHAT
      </div>
    </div>
  );
}
