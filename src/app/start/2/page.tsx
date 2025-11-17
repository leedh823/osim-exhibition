'use client';

import { useRouter } from 'next/navigation';
import VideoTracker from '@/components/VideoTracker';
import { DetectedObject } from '@/utils/realObjectDetection';

export default function PosterPage2() {
  const router = useRouter();

  const handlePersonClick = (person: DetectedObject, allObjects: DetectedObject[]) => {
    try {
      localStorage.setItem('selectedPerson', JSON.stringify(person));
      localStorage.setItem('selectedPoster', '2'); // 포스터 2 선택 표시
      
      // 감지된 객체들을 x 좌표로 정렬 (왼쪽부터 오른쪽 순서)
      const sortedObjects = [...allObjects].sort((a, b) => a.x - b.x);
      
      // 클릭된 객체가 정렬된 배열에서 몇 번째인지 찾기
      const clickedIndex = sortedObjects.findIndex(obj => obj.id === person.id);
      
      // 왼쪽(인덱스 0) = left, 오른쪽(인덱스 1) = left (동일한 영상 세트 사용)
      if (clickedIndex === 0) {
        // 왼쪽 클릭 = left 영상
        localStorage.setItem('selectedType', 'left');
        console.log('⬅️ Left 영상 선택됨');
      } else if (clickedIndex === 1) {
        // 오른쪽 클릭 = left 영상 (동일)
        localStorage.setItem('selectedType', 'left');
        console.log('⬅️ Left 영상 선택됨');
      } else {
        // 기본값 (left)
        localStorage.setItem('selectedType', 'left');
        console.log('⬅️ 기본값: Left 영상');
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
        videoSrc="/poster video 2/1.mp4"
        onPersonClick={handlePersonClick}
        className="w-full h-full"
      />
    </div>
  );
}

