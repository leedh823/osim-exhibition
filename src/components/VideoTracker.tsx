'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { realObjectDetector, DetectedObject } from '@/utils/realObjectDetection';

interface VideoTrackerProps {
  videoSrc: string;
  onPersonClick: (person: DetectedObject) => void;
  className?: string;
}

export default function VideoTracker({ videoSrc, onPersonClick, className }: VideoTrackerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const [detectedObjects, setDetectedObjects] = useState<DetectedObject[]>([]);
  const [isDetecting, setIsDetecting] = useState(false);

  // 실제 객체 감지 초기화
  useEffect(() => {
    const initializeRealObjectDetection = async () => {
      try {
        await realObjectDetector.initialize();
        // 즉시 감지 활성화
        setIsDetecting(true);
        console.log('실제 객체 감지 초기화 완료 및 즉시 활성화');
      } catch (error) {
        console.error('실제 객체 감지 초기화 실패:', error);
        // 초기화 실패해도 강제로 감지 활성화
        setIsDetecting(true);
        console.log('초기화 실패했지만 강제로 감지 활성화');
      }
    };

    initializeRealObjectDetection();
  }, []);

  // 실제 객체 감지 및 그리기
  const detectAndDrawObjects = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;

    // 캔버스 크기를 비디오 크기에 맞춤
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    try {
      // 현재 프레임을 캔버스에 그리기
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // 실제 객체 감지 (무조건 실행)
      try {
        const objects = await realObjectDetector.detectObjects(video);
        setDetectedObjects(objects);
        
        // 캔버스 클리어
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // 비디오 다시 그리기
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // 감지된 객체 그리기
        realObjectDetector.drawObjects(ctx, objects);
        
        console.log(`실제 객체 감지 완료: ${objects.length}개, 움직이는 객체: ${objects.filter(obj => obj.isMoving).length}개`);
      } catch (error) {
        console.log('객체 감지 중 오류, 계속 시도:', error);
        // 오류가 발생해도 계속 실행
      }

    } catch (error) {
      console.error('실제 객체 감지 중 오류:', error);
    }
  }, []);

  // 감지 루프 시작/중지
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
  const handleVideoLoaded = () => {
    console.log('비디오 로드 완료, 실제 객체 감지 시작');
    // 무조건 감지 활성화
    setIsDetecting(true);
    console.log('실제 객체 감지 무조건 활성화됨');
  };

  // 캔버스 클릭 이벤트 처리
  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    console.log('🎯 캔버스 클릭 이벤트 발생!');
    
    if (!canvasRef.current) {
      console.log('❌ canvasRef가 없음');
      return;
    }

    const canvas = canvasRef.current;
    console.log('✅ canvasRef 확인됨');
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const clickPoint = {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };

    console.log(`클릭 위치: (${clickPoint.x}, ${clickPoint.y})`);
    console.log(`감지된 객체 수: ${detectedObjects.length}`);
    console.log(`캔버스 크기: ${canvas.width}x${canvas.height}`);
    console.log(`캔버스 rect: ${rect.width}x${rect.height}`);

    // 모든 객체의 위치 출력 (디버깅용)
    detectedObjects.forEach((obj, index) => {
      console.log(`객체 ${index}: (${obj.x}, ${obj.y}) 크기: ${obj.width}x${obj.height}, 움직임: ${obj.isMoving}`);
      console.log(`객체 ${index} 범위: x=${obj.x}~${obj.x + obj.width}, y=${obj.y}~${obj.y + obj.height}`);
      console.log(`클릭이 범위 안에 있는가: x=${clickPoint.x >= obj.x && clickPoint.x <= obj.x + obj.width}, y=${clickPoint.y >= obj.y && clickPoint.y <= obj.y + obj.height}`);
    });

    // 클릭된 객체 찾기
    const clickedObject = realObjectDetector.findClickedObject(clickPoint, detectedObjects);
    console.log(`클릭된 객체: ${clickedObject ? clickedObject.label : '없음'}`);

    if (clickedObject) {
      console.log('✅ 실제 객체 클릭됨:', clickedObject);
      // 어떤 트래킹 영역이든 클릭하면 즉시 페이지 이동
      onPersonClick(clickedObject);
    } else {
      console.log('❌ 객체가 아닌 곳 클릭됨');
    }
  };

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
        onMouseDown={() => console.log('🖱️ 캔버스 마우스 다운')}
        onMouseUp={() => console.log('🖱️ 캔버스 마우스 업')}
        style={{ 
          pointerEvents: 'auto',
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          backgroundColor: 'rgba(255, 0, 0, 0.1)' // 디버깅용 빨간색 배경
        }}
      />


    </div>
  );
}
