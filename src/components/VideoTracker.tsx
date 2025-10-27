'use client';

import { useEffect, useRef, useState, useCallback, memo } from 'react';
import { realObjectDetector, DetectedObject } from '@/utils/realObjectDetection';

interface VideoTrackerProps {
  videoSrc: string;
  onPersonClick: (person: DetectedObject) => void;
  className?: string;
  selectedPerson?: DetectedObject | null;
  followPerson?: boolean;
}

const VideoTracker = memo(function VideoTracker({ videoSrc, onPersonClick, className, selectedPerson, followPerson = false }: VideoTrackerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const [detectedObjects, setDetectedObjects] = useState<DetectedObject[]>([]);
  const [isDetecting, setIsDetecting] = useState(false);
  const [cameraOffset, setCameraOffset] = useState({ x: 0, y: 0 });

  // 실제 객체 감지 초기화
  useEffect(() => {
    const initializeRealObjectDetection = async () => {
      try {
        await realObjectDetector.initialize();
        setIsDetecting(true);
      } catch (error) {
        console.error('실제 객체 감지 초기화 실패:', error);
        setIsDetecting(true);
      }
    };

    initializeRealObjectDetection();

    // 컴포넌트 언마운트 시 메모리 정리
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      // 메모리 정리는 필요시에만 (페이지 이동 시)
      // realObjectDetector.dispose();
    };
  }, []);

  // 선택된 사람을 따라가는 카메라 무빙
  const updateCameraFollow = useCallback(() => {
    if (!followPerson || !selectedPerson || !videoRef.current || !canvasRef.current) {
      return;
    }

    const canvas = canvasRef.current;
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    // 선택된 사람의 현재 위치 계산
    const personCenterX = selectedPerson.x + selectedPerson.width / 2;
    const personCenterY = selectedPerson.y + selectedPerson.height / 2;

    // 화면 중앙으로 이동시키기 위한 오프셋 계산
    const targetOffsetX = (canvasWidth / 2) - personCenterX;
    const targetOffsetY = (canvasHeight / 2) - personCenterY;

    // 부드러운 카메라 무빙을 위한 보간
    setCameraOffset(prev => ({
      x: prev.x + (targetOffsetX - prev.x) * 0.1,
      y: prev.y + (targetOffsetY - prev.y) * 0.1
    }));

  }, [followPerson, selectedPerson]);

  // 실제 객체 감지 및 그리기 (성능 최적화)
  const detectAndDrawObjects = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;

    // 캔버스 크기를 비디오 크기에 맞춤 (한 번만 설정)
    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }

    try {
      // 실제 객체 감지
      const objects = await realObjectDetector.detectObjects(video);
      
      // 객체가 변경된 경우에만 상태 업데이트
      if (objects.length !== detectedObjects.length || 
          objects.some((obj, index) => !detectedObjects[index] || obj.id !== detectedObjects[index].id)) {
        setDetectedObjects(objects);
      }
      
      // 카메라 무빙 업데이트
      updateCameraFollow();
      
      // 캔버스 클리어 및 비디오 그리기 (카메라 오프셋 적용)
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.translate(cameraOffset.x, cameraOffset.y);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // 감지된 객체 그리기 (카메라 오프셋 적용)
      realObjectDetector.drawObjects(ctx, objects);
      ctx.restore();

    } catch (error) {
      // 성능 최적화: 에러 로깅 최소화
      if (Math.random() < 0.01) { // 1% 확률로만 로깅
        console.error('객체 감지 중 오류:', error);
      }
    }
  }, [detectedObjects, updateCameraFollow, cameraOffset.x, cameraOffset.y]);

  // 감지 루프 시작/중지 (성능 최적화)
  useEffect(() => {
    if (isDetecting) {
      const startDetection = () => {
        detectAndDrawObjects();
        animationRef.current = requestAnimationFrame(startDetection);
      };
      startDetection();
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isDetecting, detectAndDrawObjects]);

  // 비디오 로드 완료 시 감지 시작
  const handleVideoLoaded = useCallback(() => {
    setIsDetecting(true);
  }, []);

  // 캔버스 클릭 이벤트 처리 (성능 최적화)
  const handleCanvasClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) {
      return;
    }

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const clickPoint = {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };

    console.log('클릭 위치:', clickPoint);
    console.log('감지된 객체들:', detectedObjects);

    // 클릭된 객체 찾기
    const clickedObject = realObjectDetector.findClickedObject(clickPoint, detectedObjects);

    if (clickedObject) {
      console.log('클릭된 객체:', clickedObject);
      onPersonClick(clickedObject);
    } else {
      console.log('클릭된 객체 없음 - 페이지 이동하지 않음');
    }
    // 트래킹 영역이 아닌 곳을 클릭하면 아무것도 하지 않음
  }, [detectedObjects, onPersonClick]);

  return (
    <div className={`relative ${className}`}>
      {/* 비디오 */}
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        autoPlay
        loop
        muted
        playsInline
        controls={false}
        onLoadedData={handleVideoLoaded}
        onError={(e) => console.error('비디오 로드 에러:', e)}
      >
        <source src={videoSrc} type="video/mp4" />
      </video>

      {/* 객체 탐지 오버레이 캔버스 */}
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full cursor-pointer z-10"
        onClick={handleCanvasClick}
        style={{ 
          pointerEvents: 'auto',
          width: '100%',
          height: '100%',
          objectFit: 'cover'
        }}
      />


    </div>
  );
});

export default VideoTracker;
