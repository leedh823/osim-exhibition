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
      
      // 클릭된 객체가 정렬된 배열에서 몇 번째인지 찾기
      const clickedIndex = sortedObjects.findIndex(obj => obj.id === person.id);
      console.log('🔍 클릭된 인덱스:', clickedIndex);
      
      // 박스가 2개 이상일 때, 왼쪽 박스와 오른쪽 박스의 경계를 계산
      if (sortedObjects.length >= 2) {
        const leftBox = sortedObjects[0];
        const rightBox = sortedObjects[1];
        
        // 두 박스 사이의 경계선 계산 (왼쪽 박스의 끝과 오른쪽 박스의 시작 사이)
        const leftBoxEnd = leftBox.x + leftBox.width;
        const rightBoxStart = rightBox.x;
        const boundary = leftBoxEnd + (rightBoxStart - leftBoxEnd) * 0.4; // 40% 지점
        
        // 클릭된 박스의 중심 x 좌표로 판단
        const personCenterX = person.x + person.width / 2;
        
        console.log('📐 박스 경계 계산:', { 
          leftBox: { x: leftBox.x, width: leftBox.width, end: leftBoxEnd },
          rightBox: { x: rightBox.x, width: rightBox.width, start: rightBoxStart },
          boundary,
          personCenterX
        });
        
        // 위치 기반 매핑: 왼쪽 40% = people, 오른쪽 60% = taxi
        if (personCenterX < boundary) {
          // 왼쪽 40% 영역 = people 영상
          localStorage.setItem('selectedType', 'people');
          console.log('👥 People 영상 선택됨 (왼쪽 40%)');
        } else {
          // 오른쪽 60% 영역 = taxi 영상
          localStorage.setItem('selectedType', 'taxi');
          console.log('🚕 Taxi 영상 선택됨 (오른쪽 60%)');
        }
      } else if (sortedObjects.length === 1) {
        // 박스가 1개만 있을 때는 인덱스로 판단
        if (clickedIndex === 0) {
          localStorage.setItem('selectedType', 'people');
          console.log('👥 People 영상 선택됨 (단일 박스, 왼쪽)');
        } else {
          localStorage.setItem('selectedType', 'taxi');
          console.log('🚕 Taxi 영상 선택됨 (단일 박스, 오른쪽)');
        }
      } else {
        // 기본값
        localStorage.setItem('selectedType', 'people');
        console.log('👥 기본값: People 영상');
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

