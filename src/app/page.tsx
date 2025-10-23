'use client';

import { useRouter } from 'next/navigation';
import VideoTracker from '@/components/VideoTracker';
import { DetectedObject } from '@/utils/realObjectDetection';

export default function TrackingExhibition() {
  const router = useRouter();

  const handlePersonClick = (person: DetectedObject) => {
    console.log('선택된 실제 객체:', person);
    // 선택된 실제 객체 정보를 localStorage에 저장
    localStorage.setItem('selectedPerson', JSON.stringify(person));
    // 2번 영상 페이지로 이동
    router.push('/enlarged');
  };

  const handleScreenClick = () => {
    console.log('화면 클릭됨! enlarged 페이지로 이동');
    router.push('/enlarged');
  };

  return (
    <div className="w-full h-screen bg-black aspect-[16/9] mx-auto relative overflow-hidden">
      {/* AI 객체 탐지 비디오 트래커 */}
      <VideoTracker
        videoSrc="/1.mp4"
        onPersonClick={handlePersonClick}
        className="w-full h-full"
      />

      {/* Fallback: AI 탐지가 작동하지 않을 때 화면 클릭 */}
      <div 
        className="absolute inset-0 w-full h-full z-5 cursor-pointer"
        onClick={handleScreenClick}
        style={{ pointerEvents: 'none' }}
      >
      </div>

      {/* 디버깅 정보 */}
      <div className="absolute top-4 left-4 text-white font-mono text-sm z-20 bg-black/80 p-3 rounded-lg border border-white/20">
        <div className="mb-1">현재 페이지: tracking</div>
        <div className="mb-1">실제 객체 감지 활성화</div>
        <div>움직이는 사람을 클릭하세요</div>
      </div>
    </div>
  );

}