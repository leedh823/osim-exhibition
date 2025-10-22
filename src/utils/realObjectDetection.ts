import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';

export interface DetectedObject {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  confidence: number;
  isMoving: boolean;
  speed?: number;
  direction?: { x: number; y: number };
}

export class RealObjectDetector {
  private model: cocoSsd.ObjectDetection | null = null;
  private isInitialized = false;
  private previousObjects: DetectedObject[] = [];
  private frameCount = 0;
  private readonly confidenceThreshold = 0.3;
  private readonly movingThreshold = 5; // 픽셀 이동 임계값
  
  // 표준 박스 크기 설정
  private readonly STANDARD_WIDTH = 200;
  private readonly STANDARD_HEIGHT = 300;
  
  // 트래킹 연결을 위한 이전 위치 저장
  private lastKnownPositions: Map<string, { x: number; y: number; frameCount: number }> = new Map();

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    console.log('TensorFlow.js COCO-SSD 모델 로딩 시작...');
    try {
      // TensorFlow.js 백엔드 설정
      await tf.ready();
      console.log('TensorFlow.js 백엔드 준비 완료');
      
      // COCO-SSD 모델 로드
      this.model = await cocoSsd.load();
      console.log('COCO-SSD 모델 로딩 완료');
      
      this.isInitialized = true;
      console.log('실제 객체 감지 시스템 초기화 완료');
    } catch (error) {
      console.error('실제 객체 감지 시스템 초기화 실패:', error);
      throw error;
    }
  }

  isReady(): boolean {
    return this.isInitialized && this.model !== null;
  }

  async detectObjects(videoElement: HTMLVideoElement): Promise<DetectedObject[]> {
    if (!this.model || !this.isReady()) {
      console.log('모델이 준비되지 않음');
      return [];
    }

    try {
      // 비디오에서 객체 감지
      const predictions = await this.model.detect(videoElement);
      
      // 사람만 필터링하고 DetectedObject 형태로 변환 (표준 크기 적용)
      const detectedObjects: DetectedObject[] = predictions
        .filter(prediction => 
          prediction.class === 'person' && 
          prediction.score >= this.confidenceThreshold
        )
        .map((prediction, index) => {
          // 원본 중심점 계산
          const centerX = prediction.bbox[0] + prediction.bbox[2] / 2;
          const centerY = prediction.bbox[1] + prediction.bbox[3] / 2;
          
          // 표준 크기로 조정 (중심점 기준)
          return {
            id: `person_${this.frameCount}_${index}`,
            x: centerX - this.STANDARD_WIDTH / 2,
            y: centerY - this.STANDARD_HEIGHT / 2,
            width: this.STANDARD_WIDTH,
            height: this.STANDARD_HEIGHT,
            label: '사람',
            confidence: prediction.score,
            isMoving: false,
            speed: 0,
            direction: { x: 0, y: 0 }
          };
        });

      // 움직임 감지 및 속도 계산
      const objectsWithMotion = this.detectMotion(detectedObjects);
      
      this.previousObjects = detectedObjects;
      this.frameCount++;
      
      console.log(`감지된 사람: ${objectsWithMotion.length}명, 움직이는 사람: ${objectsWithMotion.filter(obj => obj.isMoving).length}명`);
      
      return objectsWithMotion;
    } catch (error) {
      console.error('객체 감지 중 오류:', error);
      return [];
    }
  }

  private detectMotion(currentObjects: DetectedObject[]): DetectedObject[] {
    if (this.previousObjects.length === 0) {
      return currentObjects.map(obj => ({ ...obj, isMoving: false }));
    }

    return currentObjects.map(currentObj => {
      // 이전 프레임에서 가장 가까운 객체 찾기 (거리 임계값 증가)
      let closestPrevObj: DetectedObject | null = null;
      let minDistance = Infinity;

      this.previousObjects.forEach(prevObj => {
        const distance = Math.sqrt(
          Math.pow(currentObj.x - prevObj.x, 2) + 
          Math.pow(currentObj.y - prevObj.y, 2)
        );
        if (distance < minDistance) {
          minDistance = distance;
          closestPrevObj = prevObj;
        }
      });

      if (closestPrevObj && minDistance < 200) { // 200픽셀 이내면 같은 객체로 간주 (표준 크기 고려)
        const speed = minDistance;
        const direction = {
          x: currentObj.x - (closestPrevObj as DetectedObject).x,
          y: currentObj.y - (closestPrevObj as DetectedObject).y
        };
        
        // 위치 정보 업데이트
        this.lastKnownPositions.set(currentObj.id, {
          x: currentObj.x,
          y: currentObj.y,
          frameCount: this.frameCount
        });
        
        return {
          ...currentObj,
          isMoving: speed > this.movingThreshold,
          speed: speed,
          direction: direction
        };
      }

      // 트래킹이 끊어진 경우, 이전 위치를 기반으로 예측
      const lastKnown = this.lastKnownPositions.get(currentObj.id);
      if (lastKnown && this.frameCount - lastKnown.frameCount < 5) {
        // 최근 5프레임 이내라면 위치 보간
        const interpolatedX = lastKnown.x + (currentObj.x - lastKnown.x) * 0.3;
        const interpolatedY = lastKnown.y + (currentObj.y - lastKnown.y) * 0.3;
        
        return {
          ...currentObj,
          x: interpolatedX,
          y: interpolatedY,
          isMoving: true,
          speed: Math.sqrt(Math.pow(currentObj.x - lastKnown.x, 2) + Math.pow(currentObj.y - lastKnown.y, 2)),
          direction: { x: currentObj.x - lastKnown.x, y: currentObj.y - lastKnown.y }
        };
      }

      return { ...currentObj, isMoving: false };
    });
  }

  drawObjects(ctx: CanvasRenderingContext2D, objects: DetectedObject[], selectedObjectId: string | null): void {
    objects.forEach(obj => {
      const isSelected = obj.id === selectedObjectId;
      
      // 고정 색상: f5da31 (노란색 계열)
      let strokeColor = '#f5da31'; // 고정 색상
      if (isSelected) {
        strokeColor = '#00ff00'; // 선택됨 - 초록색
      }

      // 테두리 그리기
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 3;
      ctx.strokeRect(obj.x, obj.y, obj.width, obj.height);

      // 반투명 배경 (고정 색상)
      ctx.fillStyle = 'rgba(245, 218, 49, 0.1)'; // f5da31 색상의 반투명
      ctx.fillRect(obj.x, obj.y, obj.width, obj.height);

      // 라벨 제거 (깔끔한 UI)

      // 움직임 방향 벡터 제거 (깔끔한 UI)
    });
  }

  findClickedObject(clickPoint: { x: number; y: number }, objects: DetectedObject[]): DetectedObject | null {
    // 가장 최근에 그려진 객체부터 확인 (가장 위에 그려진 객체)
    for (let i = objects.length - 1; i >= 0; i--) {
      const obj = objects[i];
      if (
        clickPoint.x >= obj.x &&
        clickPoint.x <= obj.x + obj.width &&
        clickPoint.y >= obj.y &&
        clickPoint.y <= obj.y + obj.height
      ) {
        return obj;
      }
    }
    return null;
  }
}

export const realObjectDetector = new RealObjectDetector();
