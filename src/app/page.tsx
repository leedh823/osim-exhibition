'use client';

import { useRouter } from 'next/navigation';

export default function TrackingExhibition() {
  const router = useRouter();

  const handleScreenClick = () => {
    console.log('화면 클릭됨! enlarged 페이지로 이동');
    router.push('/enlarged');
  };

  return (
    <div className="w-full h-screen bg-black aspect-[16/9] mx-auto relative overflow-hidden">
      {/* 영상 */}
      <video 
        className="w-full h-full object-cover"
        autoPlay 
        loop 
        muted
        playsInline
        controls={false}
      >
        <source src="/1.mp4" type="video/mp4" />
      </video>
      
      {/* 화면 전체 클릭 */}
      <div 
        className="absolute inset-0 w-full h-full z-50 cursor-pointer"
        onClick={handleScreenClick}
      >
      </div>

      {/* 디버깅 정보 */}
      <div className="absolute top-4 left-4 text-white font-mono text-sm z-20">
        <div>현재 페이지: tracking</div>
        <div>1번 영상 - 화면 클릭하세요</div>
      </div>
    </div>
  );

}