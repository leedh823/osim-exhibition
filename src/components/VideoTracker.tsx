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
  const [selectedObjects, setSelectedObjects] = useState<DetectedObject[]>([]);

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
        
        // 감지된 객체 그리기 (다중 선택 지원)
        const selectedIds = selectedObjects.map(obj => obj.id);
        realObjectDetector.drawObjects(ctx, objects, selectedIds);
        
        console.log(`실제 객체 감지 완료: ${objects.length}개, 움직이는 객체: ${objects.filter(obj => obj.isMoving).length}개`);
      } catch (error) {
        console.log('객체 감지 중 오류, 계속 시도:', error);
        // 오류가 발생해도 계속 실행
      }

    } catch (error) {
      console.error('실제 객체 감지 중 오류:', error);
    }
  }, [selectedObjects]);

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
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const clickPoint = {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };

    console.log(`클릭 위치: (${clickPoint.x}, ${clickPoint.y})`);
    console.log(`감지된 객체 수: ${detectedObjects.length}`);

    // 모든 객체의 위치 출력 (디버깅용)
    detectedObjects.forEach((obj, index) => {
      console.log(`객체 ${index}: (${obj.x}, ${obj.y}) 크기: ${obj.width}x${obj.height}, 움직임: ${obj.isMoving}`);
    });

    // 클릭된 객체 찾기
    const clickedObject = realObjectDetector.findClickedObject(clickPoint, detectedObjects);
    console.log(`클릭된 객체: ${clickedObject ? clickedObject.label : '없음'}`);

    if (clickedObject) {
      console.log('✅ 실제 객체 클릭됨:', clickedObject);
      
      // 다중 선택 로직 (최대 2개)
      setSelectedObjects(prev => {
        const exists = prev.find(obj => obj.id === clickedObject.id);
        if (exists) {
          // 이미 선택된 객체면 제거
          const newSelection = prev.filter(obj => obj.id !== clickedObject.id);
          console.log('객체 선택 해제:', clickedObject.id);
          return newSelection;
        } else {
          // 새로운 객체 선택 (최대 2개)
          const newSelection = [...prev, clickedObject].slice(-2);
          console.log('객체 선택됨:', clickedObject.id, '총 선택된 객체:', newSelection.length);
          return newSelection;
        }
      });
      
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
        style={{ 
          pointerEvents: 'auto',
          width: '100%',
          height: '100%',
          objectFit: 'cover'
        }}
      />

      {/* 다중 선택 상태 표시 */}
      {selectedObjects.length > 0 && (
        <div className="absolute top-4 left-4 bg-black/80 p-3 rounded-lg border border-white/20 text-white font-mono text-sm z-20">
          <div className="mb-2">선택된 객체: {selectedObjects.length}/2</div>
          {selectedObjects.map((obj, index) => (
            <div key={obj.id} className="text-xs opacity-80">
              {index + 1}. {obj.label} (신뢰도: {Math.round(obj.confidence * 100)}%)
            </div>
          ))}
          <div className="text-xs text-green-400 mt-2">
            클릭하여 선택/해제
          </div>
        </div>
      )}

    </div>
  );
}
