'use client';

import { useRouter } from 'next/navigation';
import VideoTracker from '@/components/VideoTracker';
import { DetectedObject } from '@/utils/realObjectDetection';

export default function PosterPage3() {
  const router = useRouter();

  const handlePersonClick = (person: DetectedObject, allObjects: DetectedObject[], clickPosition: { screenX: number }) => {
    try {
      localStorage.setItem('selectedPerson', JSON.stringify(person));
      localStorage.setItem('selectedPoster', '3'); // 포스터 3 선택 표시
      
      // 화면 중앙(50%) 기준으로 판단
      const screenWidth = window.innerWidth;
      const isLeft = clickPosition.screenX < screenWidth / 2;
      
      if (isLeft) {
        // 왼쪽 영역 = bike 영상
        localStorage.setItem('selectedType', 'bike');
        console.log('🚴 Bike 영상 선택됨 (왼쪽 영역)');
      } else {
        // 오른쪽 영역 = boat 영상
        localStorage.setItem('selectedType', 'boat');
        console.log('🚤 Boat 영상 선택됨 (오른쪽 영역)');
      }
      
      router.push('/enlarged');
      setTimeout(() => {
        window.location.href = '/enlarged';
      }, 1000);
    } catch (error) {
      console.error('페이지 이동 중 오류:', error);
    }
  };

  return (
    <div className="w-full h-screen bg-black aspect-[16/9] mx-auto relative overflow-hidden">
      <video preload="auto" style={{ display: 'none' }}>
        <source src="/2.mp4" type="video/mp4" />
      </video>
      <VideoTracker
        videoSrc="/poster video 3/1.mp4"
        onPersonClick={handlePersonClick}
        className="w-full h-full"
      />
    </div>
  );
}

