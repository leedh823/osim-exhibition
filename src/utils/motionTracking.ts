export interface MotionObject {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
  label: string;
  velocity: { x: number; y: number };
  lastSeen: number;
}

export class MotionTracker {
  private previousFrame: ImageData | null = null;
  private trackedObjects: MotionObject[] = [];
  private nextId = 1;
  private motionThreshold = 30;
  private minObjectSize = 1000;
  private maxObjects = 5;

  async initialize(): Promise<void> {
    console.log('모션 추적 초기화 시작...');
    this.trackedObjects = [];
    this.previousFrame = null;
    console.log('모션 추적 초기화 완료');
  }

  // 프레임 간 차이를 계산하여 움직이는 객체 감지
  detectMotionObjects(
    currentFrame: ImageData,
    width: number,
    height: number
  ): MotionObject[] {
    if (!this.previousFrame) {
      this.previousFrame = currentFrame;
      return [];
    }

    const motionObjects: MotionObject[] = [];
    const blockSize = 20; // 20x20 픽셀 블록으로 분석

    // 전체 프레임을 블록 단위로 분석
    for (let y = 0; y < height - blockSize; y += blockSize) {
      for (let x = 0; x < width - blockSize; x += blockSize) {
        const motion = this.calculateBlockMotion(
          currentFrame,
          this.previousFrame,
          x,
          y,
          blockSize,
          width
        );

        if (motion > this.motionThreshold) {
          // 움직임이 감지된 블록들을 그룹화
          const motionRegion = this.findMotionRegion(
            currentFrame,
            this.previousFrame,
            x,
            y,
            blockSize,
            width,
            height
          );

          if (motionRegion.width * motionRegion.height >= this.minObjectSize) {
            const objectId = `motion_${this.nextId++}`;
            const motionObject: MotionObject = {
              id: objectId,
              x: motionRegion.x,
              y: motionRegion.y,
              width: motionRegion.width,
              height: motionRegion.height,
              confidence: Math.min(motion / 100, 1),
              label: `움직이는 객체 ${this.nextId - 1}`,
              velocity: { x: 0, y: 0 },
              lastSeen: Date.now()
            };

            motionObjects.push(motionObject);
          }
        }
      }
    }

    // 기존 추적 객체들과 새로 감지된 객체들을 매칭
    this.updateTrackedObjects(motionObjects);
    this.previousFrame = currentFrame;

    return this.trackedObjects.filter(obj => 
      Date.now() - obj.lastSeen < 1000 // 1초 이내에 감지된 객체만 유지
    );
  }

  // 블록 단위 모션 계산
  private calculateBlockMotion(
    currentFrame: ImageData,
    previousFrame: ImageData,
    x: number,
    y: number,
    blockSize: number,
    width: number
  ): number {
    let totalDiff = 0;
    let pixelCount = 0;

    for (let dy = 0; dy < blockSize; dy++) {
      for (let dx = 0; dx < blockSize; dx++) {
        const pixelIndex = ((y + dy) * width + (x + dx)) * 4;
        
        if (pixelIndex + 3 < currentFrame.data.length && 
            pixelIndex + 3 < previousFrame.data.length) {
          const rDiff = Math.abs(currentFrame.data[pixelIndex] - previousFrame.data[pixelIndex]);
          const gDiff = Math.abs(currentFrame.data[pixelIndex + 1] - previousFrame.data[pixelIndex + 1]);
          const bDiff = Math.abs(currentFrame.data[pixelIndex + 2] - previousFrame.data[pixelIndex + 2]);
          
          totalDiff += (rDiff + gDiff + bDiff) / 3;
          pixelCount++;
        }
      }
    }

    return pixelCount > 0 ? totalDiff / pixelCount : 0;
  }

  // 모션 영역 찾기
  private findMotionRegion(
    currentFrame: ImageData,
    previousFrame: ImageData,
    startX: number,
    startY: number,
    blockSize: number,
    width: number,
    height: number
  ): { x: number; y: number; width: number; height: number } {
    // 간단한 영역 확장 (실제로는 더 복잡한 알고리즘 필요)
    const padding = 20;
    return {
      x: Math.max(0, startX - padding),
      y: Math.max(0, startY - padding),
      width: Math.min(width - startX + padding, blockSize + padding * 2),
      height: Math.min(height - startY + padding, blockSize + padding * 2)
    };
  }

  // 추적 객체 업데이트
  private updateTrackedObjects(newObjects: MotionObject[]): void {
    // 기존 객체들의 위치 업데이트
    this.trackedObjects.forEach(existingObj => {
      const closestNew = newObjects.find(newObj => 
        this.calculateDistance(existingObj, newObj) < 100
      );

      if (closestNew) {
        // 속도 계산
        existingObj.velocity.x = closestNew.x - existingObj.x;
        existingObj.velocity.y = closestNew.y - existingObj.y;
        
        // 위치 업데이트
        existingObj.x = closestNew.x;
        existingObj.y = closestNew.y;
        existingObj.width = closestNew.width;
        existingObj.height = closestNew.height;
        existingObj.confidence = closestNew.confidence;
        existingObj.lastSeen = Date.now();
      }
    });

    // 새로운 객체 추가
    newObjects.forEach(newObj => {
      const isExisting = this.trackedObjects.some(existing => 
        this.calculateDistance(existing, newObj) < 100
      );

      if (!isExisting && this.trackedObjects.length < this.maxObjects) {
        this.trackedObjects.push(newObj);
      }
    });

    // 오래된 객체 제거
    this.trackedObjects = this.trackedObjects.filter(obj => 
      Date.now() - obj.lastSeen < 2000 // 2초 이상 보이지 않으면 제거
    );
  }

  // 두 객체 간 거리 계산
  private calculateDistance(obj1: MotionObject, obj2: MotionObject): number {
    const dx = obj1.x - obj2.x;
    const dy = obj1.y - obj2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // 객체 그리기
  drawObjects(
    ctx: CanvasRenderingContext2D,
    selectedObjectId?: string
  ): void {
    this.trackedObjects.forEach(obj => {
      const isSelected = selectedObjectId === obj.id;
      
      // 바운딩 박스 색상 (움직임에 따라 색상 변화)
      const speed = Math.sqrt(obj.velocity.x * obj.velocity.x + obj.velocity.y * obj.velocity.y);
      let strokeColor = '#ff0000'; // 기본 빨간색
      
      if (isSelected) {
        strokeColor = '#00ff00'; // 선택됨 - 초록색
      } else if (speed > 5) {
        strokeColor = '#ff8800'; // 빠르게 움직임 - 주황색
      } else if (speed > 2) {
        strokeColor = '#ffff00'; // 천천히 움직임 - 노란색
      }
      
      // 바운딩 박스 그리기
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 3;
      ctx.strokeRect(obj.x, obj.y, obj.width, obj.height);
      
      // 라벨 배경
      const labelText = `${obj.label} (${(obj.confidence * 100).toFixed(0)}%)`;
      const labelWidth = ctx.measureText(labelText).width + 10;
      const labelHeight = 20;
      
      ctx.fillStyle = strokeColor;
      ctx.fillRect(obj.x, obj.y - labelHeight, labelWidth, labelHeight);
      
      // 라벨 텍스트
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px Arial';
      ctx.fillText(labelText, obj.x + 5, obj.y - 5);

      // 속도 벡터 그리기 (디버깅용)
      if (speed > 1) {
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(obj.x + obj.width/2, obj.y + obj.height/2);
        ctx.lineTo(
          obj.x + obj.width/2 + obj.velocity.x * 2,
          obj.y + obj.height/2 + obj.velocity.y * 2
        );
        ctx.stroke();
      }
    });
  }

  // 클릭된 객체 찾기
  findClickedObject(clickPoint: { x: number; y: number }): MotionObject | null {
    return this.trackedObjects.find(obj => 
      clickPoint.x >= obj.x &&
      clickPoint.x <= obj.x + obj.width &&
      clickPoint.y >= obj.y &&
      clickPoint.y <= obj.y + obj.height
    ) || null;
  }

  isReady(): boolean {
    return true; // 모션 추적은 항상 준비됨
  }
}

// 싱글톤 인스턴스
export const motionTracker = new MotionTracker();
