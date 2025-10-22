export interface MotionRegion {
  x: number;
  y: number;
  width: number;
  height: number;
  motionIntensity: number; // 움직임 강도
  label: string;
}

export class SimpleMotionDetector {
  private previousFrame: ImageData | null = null;
  private isInitialized = false;
  private motionThreshold = 15; // 움직임 감지 임계값
  private minMotionArea = 2000; // 최소 움직임 영역 (픽셀)

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    console.log('간단한 움직임 감지 초기화 시작...');
    this.isInitialized = true;
    console.log('간단한 움직임 감지 초기화 완료');
  }

  isReady(): boolean {
    return this.isInitialized;
  }

  detectLargestMotion(currentFrame: ImageData, width: number, height: number): MotionRegion | null {
    if (!this.previousFrame) {
      this.previousFrame = currentFrame;
      return null;
    }

    const motionRegions: MotionRegion[] = [];
    const blockSize = 16; // 16x16 픽셀 블록 단위로 분석

    // 전체 화면을 블록 단위로 분석
    for (let y = 0; y < height; y += blockSize) {
      for (let x = 0; x < width; x += blockSize) {
        let blockMotion = 0;
        let pixelCount = 0;

        // 현재 블록의 움직임 계산
        for (let by = y; by < Math.min(y + blockSize, height); by++) {
          for (let bx = x; bx < Math.min(x + blockSize, width); bx++) {
            const i = (by * width + bx) * 4;
            if (i + 3 < currentFrame.data.length && i + 3 < this.previousFrame.data.length) {
              const rDiff = Math.abs(currentFrame.data[i] - this.previousFrame.data[i]);
              const gDiff = Math.abs(currentFrame.data[i + 1] - this.previousFrame.data[i + 1]);
              const bDiff = Math.abs(currentFrame.data[i + 2] - this.previousFrame.data[i + 2]);
              blockMotion += (rDiff + gDiff + bDiff) / 3;
              pixelCount++;
            }
          }
        }

        if (pixelCount > 0) {
          const avgMotion = blockMotion / pixelCount;
          if (avgMotion > this.motionThreshold) {
            motionRegions.push({
              x: x,
              y: y,
              width: Math.min(blockSize, width - x),
              height: Math.min(blockSize, height - y),
              motionIntensity: avgMotion,
              label: `움직임 ${motionRegions.length + 1}`
            });
          }
        }
      }
    }

    // 움직임 영역들을 그룹화
    const groupedRegions = this.groupMotionRegions(motionRegions);
    
    // 가장 큰 움직임을 가진 영역 찾기
    let largestMotion: MotionRegion | null = null;
    let maxMotionIntensity = 0;

    groupedRegions.forEach(region => {
      if (region.motionIntensity > maxMotionIntensity) {
        maxMotionIntensity = region.motionIntensity;
        largestMotion = region;
      }
    });

    this.previousFrame = currentFrame;
    return largestMotion;
  }

  private groupMotionRegions(regions: MotionRegion[]): MotionRegion[] {
    if (regions.length === 0) return [];

    const grouped: MotionRegion[] = [];
    const visited = new Set<MotionRegion>();

    regions.forEach(region => {
      if (visited.has(region)) return;

      const queue: MotionRegion[] = [region];
      visited.add(region);
      let minX = region.x;
      let minY = region.y;
      let maxX = region.x + region.width;
      let maxY = region.y + region.height;
      let totalMotion = region.motionIntensity;
      let count = 1;

      while (queue.length > 0) {
        const current = queue.shift()!;
        minX = Math.min(minX, current.x);
        minY = Math.min(minY, current.y);
        maxX = Math.max(maxX, current.x + current.width);
        maxY = Math.max(maxY, current.y + current.height);
        totalMotion += current.motionIntensity;
        count++;

        regions.forEach(other => {
          if (!visited.has(other) && this.areRegionsOverlapping(current, other)) {
            visited.add(other);
            queue.push(other);
          }
        });
      }

      const area = (maxX - minX) * (maxY - minY);
      if (area > this.minMotionArea) {
        grouped.push({
          x: minX,
          y: minY,
          width: maxX - minX,
          height: maxY - minY,
          motionIntensity: totalMotion / count,
          label: `가장 큰 움직임 (${Math.round(totalMotion / count)})`
        });
      }
    });

    return grouped;
  }

  private areRegionsOverlapping(r1: MotionRegion, r2: MotionRegion): boolean {
    return (
      r1.x < r2.x + r2.width &&
      r1.x + r1.width > r2.x &&
      r1.y < r2.y + r2.height &&
      r1.y + r1.height > r2.y
    );
  }

  drawMotionRegion(ctx: CanvasRenderingContext2D, region: MotionRegion | null): void {
    if (!region) return;

    // 가장 큰 움직임 영역을 빨간색으로 표시
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 3;
    ctx.strokeRect(region.x, region.y, region.width, region.height);

    // 라벨 표시
    const labelText = `${region.label} (${Math.round(region.motionIntensity)})`;
    const labelWidth = ctx.measureText(labelText).width + 10;
    const labelHeight = 20;

    ctx.fillStyle = '#ff0000';
    ctx.fillRect(region.x, region.y - labelHeight, labelWidth, labelHeight);

    ctx.fillStyle = '#ffffff';
    ctx.font = '12px Arial';
    ctx.fillText(labelText, region.x + 5, region.y - 5);
  }

  findClickedMotion(clickPoint: { x: number; y: number }, region: MotionRegion | null): boolean {
    if (!region) return false;
    
    return (
      clickPoint.x >= region.x &&
      clickPoint.x <= region.x + region.width &&
      clickPoint.y >= region.y &&
      clickPoint.y <= region.y + region.height
    );
  }
}

export const simpleMotionDetector = new SimpleMotionDetector();
