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
  const [zoomScale, setZoomScale] = useState(1);
  const [zoomCenter, setZoomCenter] = useState({ x: 0, y: 0 });

  // #F5DA31 색상의 노랑색 박스 감지 함수
  const detectYellowBoxes = useCallback((video: HTMLVideoElement): DetectedObject[] => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return [];

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const boxes: DetectedObject[] = [];

    // #F5DA31 색상 (RGB: 245, 218, 49)
    const targetR = 245;
    const targetG = 218;
    const targetB = 49;
    const colorThreshold = 30; // 색상 허용 오차
    const minBoxSize = 30;
    const maxBoxSize = 500;

    console.log('노랑색 박스 감지 시작...', { canvasWidth: canvas.width, canvasHeight: canvas.height });

    // 스캔 간격을 줄여서 더 정확하게 감지
    for (let y = 0; y < canvas.height - minBoxSize; y += 5) {
      for (let x = 0; x < canvas.width - minBoxSize; x += 5) {
        const pixelIndex = (y * canvas.width + x) * 4;
        const r = data[pixelIndex];
        const g = data[pixelIndex + 1];
        const b = data[pixelIndex + 2];

        // #F5DA31 색상 감지
        if (Math.abs(r - targetR) < colorThreshold && 
            Math.abs(g - targetG) < colorThreshold && 
            Math.abs(b - targetB) < colorThreshold) {
          
          // 박스 크기 측정
          let boxWidth = 0;
          let boxHeight = 0;
          
          // 가로 크기 측정
          for (let dx = x; dx < Math.min(x + maxBoxSize, canvas.width); dx++) {
            const checkIndex = (y * canvas.width + dx) * 4;
            const checkR = data[checkIndex];
            const checkG = data[checkIndex + 1];
            const checkB = data[checkIndex + 2];
            
            if (Math.abs(checkR - targetR) < colorThreshold && 
                Math.abs(checkG - targetG) < colorThreshold && 
                Math.abs(checkB - targetB) < colorThreshold) {
              boxWidth = dx - x + 1;
            } else {
              break;
            }
          }
          
          // 세로 크기 측정
          for (let dy = y; dy < Math.min(y + maxBoxSize, canvas.height); dy++) {
            const checkIndex = (dy * canvas.width + x) * 4;
            const checkR = data[checkIndex];
            const checkG = data[checkIndex + 1];
            const checkB = data[checkIndex + 2];
            
            if (Math.abs(checkR - targetR) < colorThreshold && 
                Math.abs(checkG - targetG) < colorThreshold && 
                Math.abs(checkB - targetB) < colorThreshold) {
              boxHeight = dy - y + 1;
            } else {
              break;
            }
          }

          // 최소 크기 이상인 경우에만 박스로 인식
          if (boxWidth >= minBoxSize && boxHeight >= minBoxSize) {
            const box = {
              id: `yellow-box-${boxes.length}`,
              x: x,
              y: y,
              width: boxWidth,
              height: boxHeight,
              label: 'person',
              confidence: 0.95,
              isMoving: false
            };
            boxes.push(box);
            console.log('노랑색 박스 감지됨:', box);
          }
        }
      }
    }

    console.log('노랑색 박스 감지 완료, 총 개수:', boxes.length);
    return boxes;
  }, []);

  // 실제 객체 감지 초기화
  useEffect(() => {
    const initializeRealObjectDetection = async () => {
      try {
        console.log('AI 객체 탐지 모델 초기화 시작...');
        await realObjectDetector.initialize();
        console.log('AI 객체 탐지 모델 초기화 완료');
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

  // 선택된 사람을 줌으로 확대 (실시간 트래킹)
  const updatePersonZoom = useCallback(() => {
    if (!followPerson || !selectedPerson || !videoRef.current || !canvasRef.current) {
      // 줌 해제
      setZoomScale(1);
      setZoomCenter({ x: 0, y: 0 });
      return;
    }

    // 현재 감지된 객체들에서 선택된 사람 찾기 (실시간 트래킹)
    const currentPerson = detectedObjects.find(obj => obj.id === selectedPerson.id);
    
    if (currentPerson) {
      // 실시간 위치로 줌 중심점 업데이트
      const personCenterX = currentPerson.x + currentPerson.width / 2;
      const personCenterY = currentPerson.y + currentPerson.height / 2;

      // 줌 스케일 설정 (2배 확대)
      const targetZoomScale = 2;
      
      // 부드러운 줌 전환을 위한 보간
      setZoomScale(prev => prev + (targetZoomScale - prev) * 0.1);
      setZoomCenter(prev => ({
        x: prev.x + (personCenterX - prev.x) * 0.1,
        y: prev.y + (personCenterY - prev.y) * 0.1
      }));
    } else {
      // 선택된 사람이 감지되지 않으면 줌 해제
      setZoomScale(1);
      setZoomCenter({ x: 0, y: 0 });
    }

  }, [followPerson, selectedPerson, detectedObjects]);


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
      // #F5DA31 색상의 노랑색 박스 감지
      console.log('노랑색 박스 감지 시작...');
      const objects = detectYellowBoxes(video);
      console.log('노랑색 박스 감지 결과:', objects);
      
      // 객체가 변경된 경우에만 상태 업데이트
      if (objects.length !== detectedObjects.length || 
          objects.some((obj, index) => !detectedObjects[index] || obj.id !== detectedObjects[index].id)) {
        console.log('객체 상태 업데이트:', objects);
        setDetectedObjects(objects);
      }
      
      // 줌 업데이트
      updatePersonZoom();
      
      // 캔버스 클리어
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // 줌 적용
      ctx.save();
      
      // 줌 중심점으로 이동
      ctx.translate(zoomCenter.x, zoomCenter.y);
      
      // 줌 스케일 적용
      ctx.scale(zoomScale, zoomScale);
      
      // 줌 중심점에서 원점으로 이동하여 비디오 그리기
      ctx.translate(-zoomCenter.x, -zoomCenter.y);
      
      // 비디오 그리기
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // 감지된 객체 그리기 (노랑색 박스로 표시)
      console.log('노랑색 박스 그리기 시작, 객체 수:', objects.length);
      realObjectDetector.drawObjects(ctx, objects);
      console.log('노랑색 박스 그리기 완료');
      
      ctx.restore();

    } catch (error) {
      console.error('객체 감지 중 오류:', error);
    }
  }, [detectedObjects, updatePersonZoom, zoomScale, zoomCenter.x, zoomCenter.y, detectYellowBoxes]);

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
    console.log('비디오 로드 완료, 감지 시작');
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
    console.log('감지된 노랑색 박스들:', detectedObjects);
    console.log('박스 개수:', detectedObjects.length);

    if (detectedObjects.length > 0) {
      // 클릭된 노랑색 박스 찾기
      const clickedObject = realObjectDetector.findClickedObject(clickPoint, detectedObjects);

      if (clickedObject) {
        console.log('✅ 클릭된 노랑색 박스:', clickedObject);
        onPersonClick(clickedObject);
      } else {
        console.log('❌ 클릭된 노랑색 박스 없음 - 페이지 이동하지 않음');
      }
    } else {
      console.log('❌ 감지된 노랑색 박스가 없어서 클릭할 수 없음');
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
