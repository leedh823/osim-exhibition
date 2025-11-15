'use client';

import { useRouter } from 'next/navigation';
import VideoTracker from '@/components/VideoTracker';
import { DetectedObject } from '@/utils/realObjectDetection';

export default function PosterPage2() {
  const router = useRouter();

  const handlePersonClick = (person: DetectedObject) => {
    try {
      localStorage.setItem('selectedPerson', JSON.stringify(person));
      localStorage.setItem('selectedPoster', '2'); // 포스터 2 선택 표시
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
        videoSrc="/poster%20video%202/1.mp4"
        onPersonClick={handlePersonClick}
        className="w-full h-full"
      />
    </div>
  );
}

