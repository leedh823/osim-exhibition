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

// RGB를 HSV로 변환하는 헬퍼 함수
const rgbToHsv = (r: number, g: number, b: number): { h: number; s: number; v: number } => {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const diff = max - min;
    
    let h = 0;
    if (diff !== 0) {
      if (max === r) {
        h = ((g - b) / diff + (g < b ? 6 : 0)) % 6;
      } else if (max === g) {
        h = (b - r) / diff + 2;
      } else {
        h = (r - g) / diff + 4;
      }
    }
    h /= 6;
    
    const s = max === 0 ? 0 : diff / max;
    const v = max;
    
  return { h: h * 360, s: s * 100, v: v * 100 };
};

// 노란색인지 판단하는 함수 (HSV 기반 + RGB 기반 복합 검사)
const isYellowColor = (r: number, g: number, b: number): boolean => {
    // RGB 기반 검사: ECAE30 (236, 174, 48)와 유사한 색상 범위
    const targetR = 236;
    const targetG = 174;
    const targetB = 48;
    
    // RGB 거리 계산 (유클리드 거리)
    const rgbDistance = Math.sqrt(
      Math.pow(r - targetR, 2) + 
      Math.pow(g - targetG, 2) + 
      Math.pow(b - targetB, 2)
    );
    
    // RGB 거리 임계값 (더 넓은 범위)
    const rgbThreshold = 120;
    
    // HSV 기반 검사
    const hsv = rgbToHsv(r, g, b);
    // 노란색 Hue 범위: 35~75도 (ECAE30은 약 40도 근처)
    const yellowHueMin = 30;
    const yellowHueMax = 80;
    // 채도와 명도 조건 (노란색은 높은 채도와 명도를 가짐)
    const minSaturation = 35;
    const minValue = 45;
    
    // RGB 거리 기반 검사
    const rgbMatch = rgbDistance < rgbThreshold;
    
    // HSV 기반 검사
    const hsvMatch = (
      (hsv.h >= yellowHueMin && hsv.h <= yellowHueMax) ||
      (hsv.h >= 0 && hsv.h <= 25) || // 빨강-노랑 경계
      (hsv.h >= 335 && hsv.h <= 360) // 보라-빨강-노랑 경계
    ) && hsv.s >= minSaturation && hsv.v >= minValue;
    
    // 추가 RGB 범위 검사 (ECAE30과 비슷한 노란색 계열)
    const additionalRanges = [
      { r: [220, 255], g: [160, 200], b: [25, 75] },   // ECAE30 근처 (어두운 노란색)
      { r: [230, 255], g: [170, 210], b: [35, 85] },   // 밝은 ECAE30 계열
      { r: [210, 250], g: [150, 190], b: [20, 70] },  // 넓은 ECAE30 범위
      { r: [225, 255], g: [165, 205], b: [30, 80] },  // 중간 밝기 노란색
    ];
    
    const rangeMatch = additionalRanges.some(range => 
      r >= range.r[0] && r <= range.r[1] &&
      g >= range.g[0] && g <= range.g[1] &&
      b >= range.b[0] && b <= range.b[1]
    );
    
  // 세 가지 조건 중 하나라도 만족하면 노란색으로 판단
  return rgbMatch || hsvMatch || rangeMatch;
};

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
    const visited = new Set<string>(); // 이미 처리한 픽셀 추적

    const minBoxSize = 20; // 최소 박스 크기

    console.log('🔍 2개의 노랑색 박스 감지 시작 (정밀 모드)...', { 
      canvasWidth: canvas.width, 
      canvasHeight: canvas.height 
    });

    // 노랑색 픽셀 찾기 (1픽셀 간격으로 정밀 스캔)
    for (let y = 0; y < canvas.height - minBoxSize; y += 1) {
      for (let x = 0; x < canvas.width - minBoxSize; x += 1) {
        const pixelKey = `${x},${y}`;
        if (visited.has(pixelKey)) continue;
        
        const pixelIndex = (y * canvas.width + x) * 4;
        const r = data[pixelIndex];
        const g = data[pixelIndex + 1];
        const b = data[pixelIndex + 2];

        // 노랑색 감지 (개선된 함수 사용)
        if (isYellowColor(r, g, b)) {
          // 디버깅: 노랑색 픽셀 발견 시 로그
          if (boxes.length < 2) {
            const hsv = rgbToHsv(r, g, b);
            console.log('🟡 노랑색 픽셀 발견:', { x, y, r, g, b, hsv });
          }
          
          // 노랑색 박스 크기 측정 (더 정밀하게)
          let boxWidth = 0;
          let boxHeight = 0;
          
          // 가로 크기 측정 (왼쪽부터 오른쪽까지)
          for (let dx = x; dx < Math.min(x + 1000, canvas.width); dx++) {
            const checkIndex = (y * canvas.width + dx) * 4;
            const checkR = data[checkIndex];
            const checkG = data[checkIndex + 1];
            const checkB = data[checkIndex + 2];
            
            if (isYellowColor(checkR, checkG, checkB)) {
              boxWidth = dx - x + 1;
              visited.add(`${dx},${y}`);
            } else {
              // 연속성이 끊기면 중단
              break;
            }
          }
          
          // 세로 크기 측정 (위에서 아래까지)
          for (let dy = y; dy < Math.min(y + 1000, canvas.height); dy++) {
            const checkIndex = (dy * canvas.width + x) * 4;
            const checkR = data[checkIndex];
            const checkG = data[checkIndex + 1];
            const checkB = data[checkIndex + 2];
            
            if (isYellowColor(checkR, checkG, checkB)) {
              boxHeight = dy - y + 1;
              visited.add(`${x},${dy}`);
            } else {
              // 연속성이 끊기면 중단
              break;
            }
          }

          // 박스 크기가 충분하고, 기존 박스와 겹치지 않으면 추가
          if (boxWidth > minBoxSize && boxHeight > minBoxSize) {
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
              
              // 박스 영역의 모든 픽셀을 방문 처리
              for (let by = y; by < y + boxHeight; by++) {
                for (let bx = x; bx < x + boxWidth; bx++) {
                  visited.add(`${bx},${by}`);
                }
              }
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
        // 새로운 객체와 0.5초 이내의 기존 객체 유지
        const validObjects = prev.filter(obj => now - obj.detectedAt < 500);
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
    
    // 0.5초 이내의 객체만 필터링
    const validObjects = detectedObjectsWithTimestamp
      .filter(obj => now - obj.detectedAt < 500)
      .map(({ detectedAt, ...obj }) => obj); // 타임스탬프 제거
    
    // 캔버스 클리어
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 비디오 그리기
    ctx.save();
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // 감지된 노랑색 박스 그리기 (1초 이내의 객체만)
    if (validObjects.length > 0) {
      realObjectDetector.drawObjects(ctx, validObjects);
    }
    
    ctx.restore();
  }, [detectedObjectsWithTimestamp]);

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
        muted
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
