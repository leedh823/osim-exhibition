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

  // 2개의 노랑색 박스 감지 함수
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

    // 노랑색 박스 색상 (RGB: 245, 218, 49)
    const targetR = 245;
    const targetG = 218;
    const targetB = 49;
    const colorThreshold = 80; // 색상 허용 오차 증가 (50 → 80)
    const minBoxSize = 30; // 최소 박스 크기 감소 (50 → 30)

    console.log('🔍 2개의 노랑색 박스 감지 시작...', { 
      canvasWidth: canvas.width, 
      canvasHeight: canvas.height 
    });

    // 노랑색 픽셀 찾기 (더 정밀한 스캔)
    for (let y = 0; y < canvas.height - minBoxSize; y += 2) {
      for (let x = 0; x < canvas.width - minBoxSize; x += 2) {
        const pixelIndex = (y * canvas.width + x) * 4;
        const r = data[pixelIndex];
        const g = data[pixelIndex + 1];
        const b = data[pixelIndex + 2];

        // 노랑색 감지
        const rDiff = Math.abs(r - targetR);
        const gDiff = Math.abs(g - targetG);
        const bDiff = Math.abs(b - targetB);
        
        if (rDiff < colorThreshold && gDiff < colorThreshold && bDiff < colorThreshold) {
          // 디버깅: 노랑색 픽셀 발견 시 로그
          if (boxes.length < 2) { // 처음 몇 개만 로그
            console.log('🟡 노랑색 픽셀 발견:', { x, y, r, g, b, rDiff, gDiff, bDiff });
          }
          
          // 노랑색 박스 크기 측정
          let boxWidth = 0;
          let boxHeight = 0;
          
          // 가로 크기 측정 (범위 확대)
          for (let dx = x; dx < Math.min(x + 800, canvas.width); dx++) {
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
          
          // 세로 크기 측정 (범위 확대)
          for (let dy = y; dy < Math.min(y + 800, canvas.height); dy++) {
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

          // 박스 크기가 충분하고, 기존 박스와 겹치지 않으면 추가
          if (boxWidth > minBoxSize && boxHeight > minBoxSize) {
            console.log('📦 박스 크기 측정 완료:', { boxWidth, boxHeight, x, y });
            const newBox = {
              id: `yellow-box-${boxes.length + 1}`,
              x: x,
              y: y,
              width: boxWidth,
              height: boxHeight,
              label: 'person',
              confidence: 0.95,
              isMoving: true
            };

            // 기존 박스와 겹치는지 확인 (완화된 조건)
            const isOverlapping = boxes.some(existingBox => {
              const overlapX = !(newBox.x > existingBox.x + existingBox.width || 
                                newBox.x + newBox.width < existingBox.x);
              const overlapY = !(newBox.y > existingBox.y + existingBox.height || 
                                newBox.y + newBox.height < existingBox.y);
              return overlapX && overlapY;
            });

            if (!isOverlapping) {
              boxes.push(newBox);
              console.log(`✅ 노랑색 박스 ${boxes.length} 감지됨:`, newBox);
            } else {
              console.log('⚠️ 박스 겹침으로 인해 제외:', newBox);
            }
          }
        }
      }
    }

    console.log(`🎯 총 ${boxes.length}개의 노랑색 박스 감지 완료`);
    return boxes;
  }, []);

  // 노랑색 박스 감지 초기화 (AI 모델 불필요)
  useEffect(() => {
    console.log('🚀 노랑색 박스 감지 초기화 시작...');
    setIsDetecting(true);
    console.log('✅ 노랑색 박스 감지 시작됨');

    // 컴포넌트 언마운트 시 메모리 정리
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
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
      // 2개의 노랑색 박스 감지
      console.log('🔍 2개의 노랑색 박스 감지 시작...', { 
        videoWidth: video.videoWidth, 
        videoHeight: video.videoHeight,
        isDetecting 
      });
      
      const objects = detectYellowBoxes(video);
      console.log('📊 노랑색 박스 감지 결과:', objects);
      console.log('📈 감지된 박스 개수:', objects.length);
      
      // 객체가 변경된 경우에만 상태 업데이트
      if (objects.length !== detectedObjects.length || 
          objects.some((obj, index) => !detectedObjects[index] || obj.id !== detectedObjects[index].id)) {
        console.log('🔄 객체 상태 업데이트:', objects);
        setDetectedObjects(objects);
      } else {
        console.log('⏸️ 객체 상태 변경 없음');
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
      
      // 감지된 노랑색 박스 그리기
      console.log('노랑색 박스 그리기 시작, 박스 수:', objects.length);
      realObjectDetector.drawObjects(ctx, objects);
      console.log('노랑색 박스 그리기 완료');
      
      ctx.restore();

    } catch (error) {
      console.error('객체 감지 중 오류:', error);
    }
  }, [detectedObjects, updatePersonZoom, zoomScale, zoomCenter.x, zoomCenter.y, detectYellowBoxes]);

  // 감지 루프 시작/중지 (성능 최적화)
  useEffect(() => {
    console.log('🔄 감지 루프 상태:', { isDetecting });
    
    if (isDetecting) {
      console.log('▶️ 감지 루프 시작');
      const startDetection = () => {
        detectAndDrawObjects();
        animationRef.current = requestAnimationFrame(startDetection);
      };
      startDetection();
    } else {
      console.log('⏹️ 감지 루프 중지');
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
    console.log('🎬 비디오 로드 완료, 감지 시작');
    console.log('📺 비디오 정보:', {
      videoWidth: videoRef.current?.videoWidth,
      videoHeight: videoRef.current?.videoHeight,
      duration: videoRef.current?.duration,
      readyState: videoRef.current?.readyState
    });
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

    console.log('🖱️ 클릭 위치:', clickPoint);
    console.log('📦 감지된 노랑색 박스들:', detectedObjects);
    console.log('📊 박스 개수:', detectedObjects.length);

    if (detectedObjects.length > 0) {
      // 클릭된 노랑색 박스 찾기
      const clickedBox = detectedObjects.find(obj => 
        clickPoint.x >= obj.x && 
        clickPoint.x <= obj.x + obj.width &&
        clickPoint.y >= obj.y && 
        clickPoint.y <= obj.y + obj.height
      );

      if (clickedBox) {
        console.log('✅ 클릭된 노랑색 박스:', clickedBox);
        console.log('🚀 다음 페이지로 이동합니다!');
        onPersonClick(clickedBox);
      } else {
        console.log('❌ 노랑색 박스 영역 외부 클릭 - 무시');
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
