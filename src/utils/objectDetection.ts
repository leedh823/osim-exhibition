import * as cocoSsd from '@tensorflow-models/coco-ssd';
import '@tensorflow/tfjs';

export interface DetectedObject {
  bbox: [number, number, number, number];
  class: string;
  score: number;
  id: string;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
  class: string;
  score: number;
  id: string;
}

class ObjectDetector {
  private model: cocoSsd.ObjectDetection | null = null;
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      console.log('COCO-SSD 모델 로딩 시작...');
      this.model = await cocoSsd.load();
      this.isInitialized = true;
      console.log('COCO-SSD 모델 로딩 완료');
    } catch (error) {
      console.error('모델 로딩 실패:', error);
      throw error;
    }
  }

  async detectObjects(videoElement: HTMLVideoElement): Promise<BoundingBox[]> {
    if (!this.model) {
      console.log('모델이 초기화되지 않음');
      return [];
    }

    try {
      // 비디오가 로드되지 않았으면 빈 배열 반환
      if (videoElement.videoWidth === 0 || videoElement.videoHeight === 0) {
        console.log('비디오가 아직 로드되지 않음');
        return [];
      }

      console.log(`비디오 크기: ${videoElement.videoWidth}x${videoElement.videoHeight}`);

      // 비디오 프레임을 캔버스로 캡처
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        console.log('Canvas context를 가져올 수 없음');
        return [];
      }

      // 비디오 크기에 맞춰 캔버스 크기 설정
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;

      // 현재 프레임 그리기
      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

      console.log('객체 탐지 실행 중...');
      // 객체 탐지 실행
      const predictions = await this.model.detect(canvas);
      console.log(`원본 탐지 결과: ${predictions.length}개`);
      
      // 모든 객체 출력 (디버깅용)
      predictions.forEach((pred, index) => {
        console.log(`객체 ${index}: ${pred.class} (${(pred.score * 100).toFixed(1)}%)`);
      });
      
      // 사람만 필터링하고 바운딩 박스 형식으로 변환
      const personDetections = predictions
        .filter(pred => pred.class === 'person' && pred.score > 0.2) // 임계값 더 낮춤
        .map((pred, index) => ({
          x: pred.bbox[0],
          y: pred.bbox[1],
          width: pred.bbox[2],
          height: pred.bbox[3],
          class: pred.class,
          score: pred.score,
          id: `person_${index}_${Date.now()}`
        }));

      console.log(`필터링된 사람 수: ${personDetections.length}`);
      return personDetections;
    } catch (error) {
      console.error('객체 탐지 실패:', error);
      return [];
    }
  }

  isReady(): boolean {
    return this.isInitialized && this.model !== null;
  }
}

// 싱글톤 인스턴스
export const objectDetector = new ObjectDetector();

// 유틸리티 함수들
export const drawBoundingBox = (
  ctx: CanvasRenderingContext2D,
  box: BoundingBox,
  isSelected: boolean = false,
  isMotionDetected: boolean = false
): void => {
  const { x, y, width, height, class: className, score } = box;
  
  // 바운딩 박스 색상 결정
  let strokeColor = '#ff0000'; // 기본 빨간색
  if (isSelected) {
    strokeColor = '#00ff00'; // 선택됨 - 초록색
  } else if (isMotionDetected) {
    strokeColor = '#ff8800'; // 모션 감지 - 주황색
  }
  
  // 바운딩 박스 그리기
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, width, height);
  
  // 라벨 배경
  const labelText = isMotionDetected 
    ? `움직임 (${(score * 100).toFixed(1)}%)`
    : `${className} (${(score * 100).toFixed(1)}%)`;
  const labelWidth = ctx.measureText(labelText).width + 10;
  const labelHeight = 20;
  
  ctx.fillStyle = strokeColor;
  ctx.fillRect(x, y - labelHeight, labelWidth, labelHeight);
  
  // 라벨 텍스트
  ctx.fillStyle = '#ffffff';
  ctx.font = '12px Arial';
  ctx.fillText(labelText, x + 5, y - 5);
};

export const isPointInBox = (
  point: { x: number; y: number },
  box: BoundingBox
): boolean => {
  return (
    point.x >= box.x &&
    point.x <= box.x + box.width &&
    point.y >= box.y &&
    point.y <= box.y + box.height
  );
};
