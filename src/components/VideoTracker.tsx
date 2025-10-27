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
  const [previousFrame, setPreviousFrame] = useState<ImageData | null>(null);

  // 움직임 감지 함수
  const detectMovement = useCallback((video: HTMLVideoElement): DetectedObject[] => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return [];

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    const currentFrame = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const objects: DetectedObject[] = [];

    if (previousFrame) {
      const currentData = currentFrame.data;
      const previousData = previousFrame.data;
      
      // 움직임 감지 임계값
      const movementThreshold = 30;
      const minMovementArea = 1000; // 최소 움직임 영역 크기
      
      console.log('🔍 움직임 감지 시작...', { 
        canvasWidth: canvas.width, 
        canvasHeight: canvas.height 
      });

      // 프레임 차이 계산
      const diffData = new Uint8ClampedArray(currentData.length);
      let movementPixels = 0;
      
      for (let i = 0; i < currentData.length; i += 4) {
        const rDiff = Math.abs(currentData[i] - previousData[i]);
        const gDiff = Math.abs(currentData[i + 1] - previousData[i + 1]);
        const bDiff = Math.abs(currentData[i + 2] - previousData[i + 2]);
        
        const totalDiff = rDiff + gDiff + bDiff;
        
        if (totalDiff > movementThreshold) {
          diffData[i] = 255; // R
          diffData[i + 1] = 255; // G
          diffData[i + 2] = 255; // B
          diffData[i + 3] = 255; // A
          movementPixels++;
        } else {
          diffData[i] = 0;
          diffData[i + 1] = 0;
          diffData[i + 2] = 0;
          diffData[i + 3] = 255;
        }
      }

      console.log('📊 움직임 픽셀 수:', movementPixels);

      if (movementPixels > minMovementArea) {
        // 움직임이 감지되면 전체 화면을 하나의 객체로 처리
        const object: DetectedObject = {
          id: 'movement-detected',
          x: 0,
          y: 0,
          width: canvas.width,
          height: canvas.height,
          label: 'person',
          confidence: 0.8,
          isMoving: true
        };
        objects.push(object);
        console.log('✅ 움직임 감지됨:', object);
      }
    }

    // 현재 프레임을 이전 프레임으로 저장
    setPreviousFrame(currentFrame);
    
    console.log('🎯 움직임 감지 완료, 객체 수:', objects.length);
    return objects;
  }, [previousFrame]);

  // 움직임 감지 초기화 (AI 모델 불필요)
  useEffect(() => {
    console.log('🚀 움직임 감지 초기화 시작...');
    setIsDetecting(true);
    console.log('✅ 움직임 감지 시작됨');

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
      // 움직임 감지 (사람을 노랑색 박스로 인식)
      console.log('🔍 움직임 감지 시작...', { 
        videoWidth: video.videoWidth, 
        videoHeight: video.videoHeight,
        isDetecting 
      });
      
      const objects = detectMovement(video);
      console.log('📊 움직임 감지 결과 (사람을 노랑색 박스로 인식):', objects);
      console.log('📈 감지된 객체 개수:', objects.length);
      
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
      
      // 감지된 움직임을 노랑색 박스로 그리기
      console.log('움직임을 노랑색 박스로 그리기 시작, 객체 수:', objects.length);
      realObjectDetector.drawObjects(ctx, objects);
      console.log('움직임을 노랑색 박스로 그리기 완료');
      
      ctx.restore();

    } catch (error) {
      console.error('객체 감지 중 오류:', error);
    }
  }, [detectedObjects, updatePersonZoom, zoomScale, zoomCenter.x, zoomCenter.y, detectMovement]);

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

    console.log('클릭 위치:', clickPoint);
    console.log('감지된 객체들:', detectedObjects);
    console.log('객체 개수:', detectedObjects.length);

    if (detectedObjects.length > 0) {
      // 클릭된 객체 찾기
      const clickedObject = realObjectDetector.findClickedObject(clickPoint, detectedObjects);

      if (clickedObject) {
        console.log('✅ 클릭된 객체:', clickedObject);
        onPersonClick(clickedObject);
      } else {
        console.log('❌ 클릭된 객체 없음 - 페이지 이동하지 않음');
      }
    } else {
      console.log('❌ 감지된 객체가 없어서 클릭할 수 없음');
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
