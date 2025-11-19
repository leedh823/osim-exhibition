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
      
      // 감지된 객체들을 크기(면적)로 정렬 (작은 것부터 큰 것 순서)
      const sortedObjects = [...allObjects].sort((a, b) => {
        const areaA = a.width * a.height;
        const areaB = b.width * b.height;
        return areaA - areaB; // 작은 것부터 정렬
      });
      
      // 클릭된 객체가 정렬된 배열에서 몇 번째인지 찾기
      const clickedIndex = sortedObjects.findIndex(obj => obj.id === person.id);
      
      // 작은 박스(인덱스 0) = people, 큰 박스(인덱스 1) = taxi
      if (clickedIndex === 0) {
        // 작은 박스 클릭 = people 영상
        localStorage.setItem('selectedType', 'people');
        console.log('👥 People 영상 선택됨 (작은 박스)');
      } else if (clickedIndex === 1) {
        // 큰 박스 클릭 = taxi 영상
        localStorage.setItem('selectedType', 'taxi');
        console.log('🚕 Taxi 영상 선택됨 (큰 박스)');
      } else {
        // 기본값 (people)
        localStorage.setItem('selectedType', 'people');
        console.log('👥 기본값: People 영상');
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

