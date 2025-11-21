'use client';

import { useRouter } from 'next/navigation';
import VideoTracker from '@/components/VideoTracker';
import { DetectedObject } from '@/utils/realObjectDetection';

export default function PosterPage2() {
  const router = useRouter();

  const handlePersonClick = (person: DetectedObject, allObjects: DetectedObject[]) => {
    try {
      console.log('🎯 handlePersonClick 호출됨:', { person, allObjects, allObjectsLength: allObjects.length });
      
      localStorage.setItem('selectedPerson', JSON.stringify(person));
      localStorage.setItem('selectedPoster', '2'); // 포스터 2 선택 표시
      
      // 감지된 객체들을 x 좌표로 정렬 (왼쪽부터 오른쪽 순서)
      const sortedObjects = [...allObjects].sort((a, b) => a.x - b.x);
      console.log('📊 정렬된 객체들:', sortedObjects);
      
      // 화면 너비 계산 (모든 박스의 최대 x + width 사용, 또는 window.innerWidth 사용)
      // 비디오 좌표계를 사용하므로, 가장 오른쪽 박스의 끝을 기준으로 계산
      const maxX = allObjects.length > 0 
        ? Math.max(...allObjects.map(obj => obj.x + obj.width))
        : window.innerWidth; // 박스가 없으면 화면 너비 사용
      const screenWidth = maxX;
      const thresholdX = screenWidth * 0.4; // 왼쪽 40% 기준선
      
      // 클릭된 박스의 중심 x 좌표로 판단
      const personCenterX = person.x + person.width / 2;
      
      console.log('📐 화면 너비 기준:', { 
        screenWidth, 
        thresholdX, 
        personX: person.x, 
        personCenterX,
        personWidth: person.width
      });
      
      // 위치 기반 매핑: 왼쪽 40% = people, 오른쪽 60% = taxi
      if (personCenterX < thresholdX) {
        // 왼쪽 40% 영역 = people 영상
        localStorage.setItem('selectedType', 'people');
        console.log('👥 People 영상 선택됨 (왼쪽 40%)');
      } else {
        // 오른쪽 60% 영역 = taxi 영상
        localStorage.setItem('selectedType', 'taxi');
        console.log('🚕 Taxi 영상 선택됨 (오른쪽 60%)');
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

