'use client';

import { useRouter } from 'next/navigation';
import VideoTracker from '@/components/VideoTracker';
import { DetectedObject } from '@/utils/realObjectDetection';

export default function PosterPage2() {
  const router = useRouter();

  const handlePersonClick = (person: DetectedObject, allObjects: DetectedObject[], clickPosition: { screenX: number }) => {
    try {
      console.log('🎯 handlePersonClick 호출됨:', { person, allObjects, allObjectsLength: allObjects.length });
      
      localStorage.setItem('selectedPerson', JSON.stringify(person));
      localStorage.setItem('selectedPoster', '2'); // 포스터 2 선택 표시
      
      // 화면 중앙(50%) 기준으로 판단
      const screenWidth = window.innerWidth;
      const isLeft = clickPosition.screenX < screenWidth / 2;
      
      if (isLeft) {
        // 왼쪽 영역 = people 영상
        localStorage.setItem('selectedType', 'people');
        console.log('👥 People 영상 선택됨 (왼쪽 영역)');
      } else {
        // 오른쪽 영역 = taxi 영상
        localStorage.setItem('selectedType', 'taxi');
        console.log('🚕 Taxi 영상 선택됨 (오른쪽 영역)');
      }
      
      console.log('🚀 페이지 이동 시작...');
      router.push('/enlarged');
      setTimeout(() => {
        console.log('⏰ setTimeout 실행 - window.location.href로 이동');
        window.location.href = '/enlarged';
      }, 1000);
    } catch (error) {
      console.error('❌ 페이지 이동 중 오류:', error);
    }
  };

  return (
    <div className="w-full h-screen bg-black aspect-[16/9] mx-auto relative overflow-hidden">
      <video preload="auto" style={{ display: 'none' }}>
        <source src="/2.mp4" type="video/mp4" />
      </video>
      <VideoTracker
        videoSrc="/poster video 2/1.mp4"
        onPersonClick={handlePersonClick}
        className="w-full h-full"
      />
    </div>
  );
}

