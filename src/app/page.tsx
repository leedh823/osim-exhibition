'use client';

import { useRouter } from 'next/navigation';
import VideoTracker from '@/components/VideoTracker';
import { DetectedObject } from '@/utils/realObjectDetection';

export default function TrackingExhibition() {
  const router = useRouter();


  const handlePersonClick = (person: DetectedObject) => {
    try {
      // 선택된 실제 객체 정보를 localStorage에 저장
      localStorage.setItem('selectedPerson', JSON.stringify(person));
      
      // 2번 영상 페이지로 이동
      router.push('/enlarged');
      
      // 대안적인 페이지 이동 (router가 작동하지 않을 경우)
      setTimeout(() => {
        window.location.href = '/enlarged';
      }, 1000);
    } catch (error) {
      console.error('페이지 이동 중 오류:', error);
    }
  };

  return (
    <div className="w-full h-screen bg-black aspect-[16/9] mx-auto relative overflow-hidden">
      {/* 비디오 프리로딩 (성능 최적화) */}
      <video preload="auto" style={{ display: 'none' }}>
        <source src="/2.mp4" type="video/mp4" />
      </video>
      
      {/* AI 객체 탐지 비디오 트래커 */}
      <VideoTracker
        videoSrc="/1.mp4"
        onPersonClick={handlePersonClick}
        className="w-full h-full"
      />
    </div>
  );

}