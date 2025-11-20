'use client';

import { useEffect, useRef, useState, useCallback, memo } from 'react';
import { realObjectDetector, DetectedObject } from '@/utils/realObjectDetection';

interface VideoTrackerProps {
  videoSrc: string;
  onPersonClick: (person: DetectedObject, allObjects: DetectedObject[]) => void;
  className?: string;
  selectedPerson?: DetectedObject | null;
  followPerson?: boolean;
}

const VideoTracker = memo(function VideoTracker({ videoSrc, onPersonClick, className, selectedPerson, followPerson = false }: VideoTrackerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const intervalRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const [detectedObjects, setDetectedObjects] = useState<DetectedObject[]>([]);
  const [detectedObjectsWithTimestamp, setDetectedObjectsWithTimestamp] = useState<Array<DetectedObject & { detectedAt: number }>>([]);
  const [isDetecting, setIsDetecting] = useState(false);
  // 줌 기능 제거 (2번 화면에서 불필요)
  // const [zoomScale, setZoomScale] = useState(1);
  // const [zoomCenter, setZoomCenter] = useState({ x: 0, y: 0 });

  // 2개의 노랑색/빨간색 박스 감지 함수
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

    // 포스터 3인지 확인 (빨간색 감지)
    const isPoster3 = videoSrc.includes('/poster video 3/');
    
    // 포스터 3: 빨간색 (#ff0000 = RGB: 255, 0, 0), 그 외: 노랑색 (RGB: 245, 218, 49)
    const targetR = isPoster3 ? 255 : 245;
    const targetG = isPoster3 ? 0 : 218;
    const targetB = isPoster3 ? 0 : 49;
    // 빨간색 감지를 위해 더 넓은 범위 허용
    const colorThreshold = isPoster3 ? 100 : 80; // 빨간색은 더 넓은 범위
    const minBoxSize = 30; // 최소 박스 크기

    const colorName = isPoster3 ? '빨간색' : '노랑색';
    console.log(`🔍 2개의 ${colorName} 박스 감지 시작...`, { 
      canvasWidth: canvas.width, 
      canvasHeight: canvas.height,
      isPoster3,
      targetColor: { r: targetR, g: targetG, b: targetB },
      colorThreshold
    });

    // 색상 픽셀 찾기 (더 정밀한 스캔)
    for (let y = 0; y < canvas.height - minBoxSize; y += 2) {
      for (let x = 0; x < canvas.width - minBoxSize; x += 2) {
        const pixelIndex = (y * canvas.width + x) * 4;
        const r = data[pixelIndex];
        const g = data[pixelIndex + 1];
        const b = data[pixelIndex + 2];

        // 색상 감지 (노랑색 또는 빨간색)
        let isColorMatch = false;
        
        if (isPoster3) {
          // 빨간색 감지: R이 G와 B보다 훨씬 높아야 함
          // R >= 150 이상이고, R이 G보다 50 이상 크고, R이 B보다 50 이상 크고, G와 B가 150 이하
          const rHigh = r >= 150;
          const rDominant = (r - g) >= 50 && (r - b) >= 50;
          const gbLow = g <= 150 && b <= 150;
          isColorMatch = rHigh && rDominant && gbLow;
        } else {
          // 노랑색 감지: 기존 로직
          const rDiff = Math.abs(r - targetR);
          const gDiff = Math.abs(g - targetG);
          const bDiff = Math.abs(b - targetB);
          isColorMatch = rDiff < colorThreshold && gDiff < colorThreshold && bDiff < colorThreshold;
        }
        
        if (isColorMatch) {
          // 디버깅: 색상 픽셀 발견 시 로그
          if (boxes.length < 2) { // 처음 몇 개만 로그
            const emoji = isPoster3 ? '🔴' : '🟡';
            if (isPoster3) {
              console.log(`${emoji} ${colorName} 픽셀 발견:`, { x, y, r, g, b });
            } else {
              const rDiff = Math.abs(r - targetR);
              const gDiff = Math.abs(g - targetG);
              const bDiff = Math.abs(b - targetB);
              console.log(`${emoji} ${colorName} 픽셀 발견:`, { x, y, r, g, b, rDiff, gDiff, bDiff });
            }
          }
          
          // 박스 크기 측정
          let boxWidth = 0;
          let boxHeight = 0;
          
          // 가로 크기 측정 (범위 확대)
          for (let dx = x; dx < Math.min(x + 800, canvas.width); dx++) {
            const checkIndex = (y * canvas.width + dx) * 4;
            const checkR = data[checkIndex];
            const checkG = data[checkIndex + 1];
            const checkB = data[checkIndex + 2];
            
            let isColorMatch = false;
            if (isPoster3) {
              // 빨간색: R이 G와 B보다 훨씬 높아야 함
              const rHigh = checkR >= 150;
              const rDominant = (checkR - checkG) >= 50 && (checkR - checkB) >= 50;
              const gbLow = checkG <= 150 && checkB <= 150;
              isColorMatch = rHigh && rDominant && gbLow;
            } else {
              // 노랑색: 기존 로직
              const rDiff = Math.abs(checkR - targetR);
              const gDiff = Math.abs(checkG - targetG);
              const bDiff = Math.abs(checkB - targetB);
              isColorMatch = rDiff < colorThreshold && gDiff < colorThreshold && bDiff < colorThreshold;
            }
            
            if (isColorMatch) {
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
            
            let isColorMatch = false;
            if (isPoster3) {
              // 빨간색: R이 G와 B보다 훨씬 높아야 함
              const rHigh = checkR >= 150;
              const rDominant = (checkR - checkG) >= 50 && (checkR - checkB) >= 50;
              const gbLow = checkG <= 150 && checkB <= 150;
              isColorMatch = rHigh && rDominant && gbLow;
            } else {
              // 노랑색: 기존 로직
              const rDiff = Math.abs(checkR - targetR);
              const gDiff = Math.abs(checkG - targetG);
              const bDiff = Math.abs(checkB - targetB);
              isColorMatch = rDiff < colorThreshold && gDiff < colorThreshold && bDiff < colorThreshold;
            }
            
            if (isColorMatch) {
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
              const emoji = isPoster3 ? '🔴' : '🟡';
              console.log(`✅ ${colorName} 박스 ${boxes.length} 감지됨:`, newBox);
            } else {
              console.log('⚠️ 박스 겹침으로 인해 제외:', newBox);
            }
          }
        }
      }
    }

    console.log(`🎯 총 ${boxes.length}개의 ${colorName} 박스 감지 완료`);
    return boxes;
  }, [videoSrc]);

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

  // 줌 기능 제거 (2번 화면에서 불필요)
  // const updatePersonZoom = useCallback(() => {
  //   // 줌 관련 로직 제거
  // }, [followPerson, selectedPerson, detectedObjects]);


  // 객체 감지 함수 (초당 30회 실행)
  const detectObjects = useCallback(() => {
    if (!videoRef.current) {
      return;
    }

    const video = videoRef.current;
    const now = Date.now();

    try {
      // 2개의 노랑색 박스 감지
      const objects = detectYellowBoxes(video);
      
      // 감지된 객체에 타임스탬프 추가
      const objectsWithTimestamp = objects.map(obj => ({
        ...obj,
        detectedAt: now
      }));
      
      // 타임스탬프가 있는 객체 목록 업데이트
      setDetectedObjectsWithTimestamp(prev => {
        // 새로운 객체와 1초 이내의 기존 객체 유지
        const validObjects = prev.filter(obj => now - obj.detectedAt < 1000);
        // 새로운 객체 추가 (중복 제거)
        const newObjects = objectsWithTimestamp.filter(newObj => 
          !validObjects.some(existing => existing.id === newObj.id)
        );
        return [...validObjects, ...newObjects];
      });
      
      // 클릭 감지를 위한 객체 목록도 업데이트
      setDetectedObjects(objects);
      
    } catch (error) {
      console.error('객체 감지 중 오류:', error);
    }
  }, [detectYellowBoxes]);

  // 렌더링 함수 (requestAnimationFrame으로 부드럽게)
  const renderObjects = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;

    // 캔버스 크기를 비디오 크기에 맞춤
    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }

    const now = Date.now();
    
    // 1초 이내의 객체만 필터링
    const validObjects = detectedObjectsWithTimestamp
      .filter(obj => now - obj.detectedAt < 1000)
      .map(({ detectedAt, ...obj }) => obj); // 타임스탬프 제거
    
    // 캔버스 클리어
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 비디오 그리기
    ctx.save();
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // 포스터 3인지 확인 (빨간색 박스)
    const isPoster3 = videoSrc.includes('/poster video 3/');
    
    // 감지된 박스 그리기 (1초 이내의 객체만)
    if (validObjects.length > 0) {
      validObjects.forEach((obj) => {
        // 포스터 3: 빨간색, 그 외: 노란색
        const strokeColor = isPoster3 ? '#ff0000' : '#f5da31';
        const fillColor = isPoster3 ? 'rgba(255, 0, 0, 0.1)' : 'rgba(245, 218, 49, 0.1)';

        // 테두리 그리기
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 3;
        ctx.strokeRect(obj.x, obj.y, obj.width, obj.height);

        // 반투명 배경
        ctx.fillStyle = fillColor;
        ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
      });
    }
    
    ctx.restore();
  }, [detectedObjectsWithTimestamp, videoSrc]);

  // 감지 루프 시작/중지 (초당 30회 = 33ms마다)
  useEffect(() => {
    console.log('🔄 감지 루프 상태:', { isDetecting });
    
    if (isDetecting) {
      console.log('▶️ 감지 루프 시작 (초당 30회)');
      // 초당 30회 감지 (33ms마다)
      intervalRef.current = setInterval(() => {
        detectObjects();
      }, 33); // 1000ms / 30 = 33.33ms
    } else {
      console.log('⏹️ 감지 루프 중지');
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = undefined;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = undefined;
      }
    };
  }, [isDetecting, detectObjects]);

  // 렌더링 루프 (requestAnimationFrame으로 부드럽게)
  useEffect(() => {
    if (isDetecting) {
      const startRender = () => {
        renderObjects();
        animationRef.current = requestAnimationFrame(startRender);
      };
      startRender();
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = undefined;
      }
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = undefined;
      }
    };
  }, [isDetecting, renderObjects]);

  // 비디오 소스 변경 시 비디오 업데이트
  useEffect(() => {
    if (videoRef.current && videoSrc) {
      console.log('🔄 비디오 소스 변경:', videoSrc);
      const video = videoRef.current;
      const source = video.querySelector('source');
      if (source) {
        source.src = videoSrc;
        video.load(); // 비디오 재로드
      }
    }
  }, [videoSrc]);

  // 비디오 로드 완료 시 감지 시작
  const handleVideoLoaded = useCallback(() => {
    console.log('🎬 비디오 로드 완료, 감지 시작');
    console.log('📺 비디오 정보:', {
      videoWidth: videoRef.current?.videoWidth,
      videoHeight: videoRef.current?.videoHeight,
      duration: videoRef.current?.duration,
      readyState: videoRef.current?.readyState,
      src: videoRef.current?.querySelector('source')?.getAttribute('src')
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
        // 클릭된 객체와 함께 모든 감지된 객체들도 전달
        onPersonClick(clickedBox, detectedObjects);
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
        key={videoSrc} // videoSrc가 변경되면 video 요소 재생성
        ref={videoRef}
        className="w-full h-full object-cover"
        autoPlay
        loop
        playsInline
        controls={false}
        onLoadedData={handleVideoLoaded}
        onError={(e) => {
          console.error('비디오 로드 에러:', e);
          console.error('비디오 경로:', videoSrc);
          console.error('비디오 요소:', videoRef.current);
        }}
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
