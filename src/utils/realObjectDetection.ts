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
  private lastDetectionTime = 0;
  private readonly detectionInterval = 100; // 100ms 간격

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

    // 성능 최적화: 너무 자주 감지하지 않음
    const now = Date.now();
    if (now - this.lastDetectionTime < this.detectionInterval) {
      return this.previousObjects; // 이전 결과 반환
    }
    this.lastDetectionTime = now;

    try {
      // 비디오에서 객체 감지
      const predictions = await this.model.detect(videoElement);
      
      // 사람만 필터링하고 DetectedObject 형태로 변환
      const detectedObjects: DetectedObject[] = predictions
        .filter(prediction => 
          prediction.class === 'person' && 
          prediction.score >= this.confidenceThreshold
        )
        .map((prediction, index) => ({
          id: `person_${this.frameCount}_${index}`,
          x: prediction.bbox[0],
          y: prediction.bbox[1],
          width: prediction.bbox[2],
          height: prediction.bbox[3],
          label: '사람',
          confidence: prediction.score,
          isMoving: false,
          speed: 0,
          direction: { x: 0, y: 0 }
        }));

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

      if (closestPrevObj && minDistance < 150) { // 150픽셀 이내면 같은 객체로 간주 (임계값 증가)
        const speed = minDistance;
        const direction = {
          x: currentObj.x - (closestPrevObj as DetectedObject).x,
          y: currentObj.y - (closestPrevObj as DetectedObject).y
        };
        
        return {
          ...currentObj,
          isMoving: speed > this.movingThreshold,
          speed: speed,
          direction: direction
        };
      }

      return { ...currentObj, isMoving: false };
    });
  }

  drawObjects(ctx: CanvasRenderingContext2D, objects: DetectedObject[]): void {
    objects.forEach((obj) => {
      // 모든 객체를 동일한 색상으로 표시
      const strokeColor = '#f5da31'; // 기본 색상 (노란색)
      const fillColor = 'rgba(245, 218, 49, 0.1)'; // 기본 반투명 배경

      // 테두리 그리기
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 3;
      ctx.strokeRect(obj.x, obj.y, obj.width, obj.height);

      // 반투명 배경
      ctx.fillStyle = fillColor;
      ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
    });
  }

  findClickedObject(clickPoint: { x: number; y: number }, objects: DetectedObject[]): DetectedObject | null {
    console.log(`findClickedObject 호출: 클릭 위치 (${clickPoint.x}, ${clickPoint.y}), 객체 수: ${objects.length}`);
    
    // 가장 최근에 그려진 객체부터 확인 (가장 위에 그려진 객체)
    for (let i = objects.length - 1; i >= 0; i--) {
      const obj = objects[i];
      const isInXRange = clickPoint.x >= obj.x && clickPoint.x <= obj.x + obj.width;
      const isInYRange = clickPoint.y >= obj.y && clickPoint.y <= obj.y + obj.height;
      
      console.log(`객체 ${i} 체크: x=${isInXRange}, y=${isInYRange}, 전체=${isInXRange && isInYRange}`);
      
      if (isInXRange && isInYRange) {
        console.log(`✅ 객체 ${i} 클릭됨!`);
        return obj;
      }
    }
    
    // 정확한 클릭이 안 되면 가장 가까운 객체 찾기
    if (objects.length > 0) {
      let closestObj = objects[0];
      let minDistance = Infinity;
      
      objects.forEach((obj, index) => {
        const centerX = obj.x + obj.width / 2;
        const centerY = obj.y + obj.height / 2;
        const distance = Math.sqrt(
          Math.pow(clickPoint.x - centerX, 2) + 
          Math.pow(clickPoint.y - centerY, 2)
        );
        
        if (distance < minDistance) {
          minDistance = distance;
          closestObj = obj;
        }
        
        console.log(`객체 ${index} 거리: ${distance.toFixed(2)}px`);
      });
      
      console.log(`🔍 가장 가까운 객체: 거리 ${minDistance.toFixed(2)}px`);
      return closestObj;
    }
    
    console.log(`❌ 클릭된 객체 없음`);
    return null;
  }
}

export const realObjectDetector = new RealObjectDetector();
