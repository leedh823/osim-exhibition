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
      // 이전 프레임에서 가장 가까운 객체 찾기
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

      if (closestPrevObj && minDistance < 100) { // 100픽셀 이내면 같은 객체로 간주
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

  drawObjects(ctx: CanvasRenderingContext2D, objects: DetectedObject[], selectedObjectId: string | null): void {
    objects.forEach(obj => {
      const isSelected = obj.id === selectedObjectId;
      
      // 움직이는 객체는 빨간색, 정지된 객체는 노란색, 선택된 객체는 초록색
      let strokeColor = '#ffff00'; // 기본 노란색
      if (isSelected) {
        strokeColor = '#00ff00'; // 선택됨 - 초록색
      } else if (obj.isMoving) {
        strokeColor = '#ff0000'; // 움직임 - 빨간색
      }

      // 테두리 그리기
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 3;
      ctx.strokeRect(obj.x, obj.y, obj.width, obj.height);

      // 반투명 배경
      ctx.fillStyle = obj.isMoving ? 'rgba(255, 0, 0, 0.1)' : 'rgba(255, 255, 0, 0.1)';
      ctx.fillRect(obj.x, obj.y, obj.width, obj.height);

      // 라벨 표시
      const labelText = `${obj.label} ${obj.isMoving ? '(움직임)' : '(정지)'} (${(obj.confidence * 100).toFixed(0)}%)`;
      const labelWidth = ctx.measureText(labelText).width + 10;
      const labelHeight = 20;

      ctx.fillStyle = strokeColor;
      ctx.fillRect(obj.x, obj.y - labelHeight, labelWidth, labelHeight);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px Arial';
      ctx.fillText(labelText, obj.x + 5, obj.y - 5);

      // 움직임 방향 벡터 그리기
      if (obj.isMoving && obj.speed && obj.speed > 0) {
        const centerX = obj.x + obj.width / 2;
        const centerY = obj.y + obj.height / 2;
        const endX = centerX + (obj.direction?.x || 0) * 2;
        const endY = centerY + (obj.direction?.y || 0) * 2;

        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
      }
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
