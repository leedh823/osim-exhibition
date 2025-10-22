export interface MotionRegion {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
  id: string;
}

export class MotionDetector {
  private previousFrame: ImageData | null = null;
  private motionThreshold = 30; // 모션 감지 임계값
  private minMotionArea = 500; // 최소 모션 영역 크기

  // 프레임 간 차이 계산
  private calculateFrameDifference(
    currentFrame: ImageData,
    previousFrame: ImageData
  ): number {
    if (currentFrame.data.length !== previousFrame.data.length) {
      return 0;
    }

    let totalDifference = 0;
    const pixelCount = currentFrame.data.length / 4; // RGBA

    for (let i = 0; i < currentFrame.data.length; i += 4) {
      const rDiff = Math.abs(currentFrame.data[i] - previousFrame.data[i]);
      const gDiff = Math.abs(currentFrame.data[i + 1] - previousFrame.data[i + 1]);
      const bDiff = Math.abs(currentFrame.data[i + 2] - previousFrame.data[i + 2]);
      
      totalDifference += (rDiff + gDiff + bDiff) / 3;
    }

    return totalDifference / pixelCount;
  }

  // 모션 영역 감지
  detectMotionRegions(
    currentFrame: ImageData,
    width: number,
    height: number
  ): MotionRegion[] {
    if (!this.previousFrame) {
      this.previousFrame = currentFrame;
      return [];
    }

    const motionRegions: MotionRegion[] = [];
    const blockSize = 16; // 16x16 블록 단위로 모션 감지
    const threshold = this.motionThreshold;

    // 블록별 모션 계산
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

        if (motion > threshold) {
          motionRegions.push({
            x,
            y,
            width: blockSize,
            height: blockSize,
            confidence: Math.min(motion / 100, 1),
            id: `motion_${x}_${y}_${Date.now()}`
          });
        }
      }
    }

    // 인접한 모션 영역들을 그룹화
    const groupedRegions = this.groupNearbyRegions(motionRegions);
    
    // 최소 크기 필터링
    const filteredRegions = groupedRegions.filter(
      region => region.width * region.height >= this.minMotionArea
    );

    this.previousFrame = currentFrame;
    return filteredRegions;
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
        
        if (pixelIndex < currentFrame.data.length && pixelIndex < previousFrame.data.length) {
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

  // 인접한 모션 영역들을 그룹화
  private groupNearbyRegions(regions: MotionRegion[]): MotionRegion[] {
    if (regions.length === 0) return [];

    const groups: MotionRegion[][] = [];
    const used = new Set<number>();

    for (let i = 0; i < regions.length; i++) {
      if (used.has(i)) continue;

      const group = [regions[i]];
      used.add(i);

      // 인접한 영역들을 찾아서 그룹에 추가
      for (let j = i + 1; j < regions.length; j++) {
        if (used.has(j)) continue;

        if (this.isNearby(regions[i], regions[j])) {
          group.push(regions[j]);
          used.add(j);
        }
      }

      groups.push(group);
    }

    // 각 그룹을 하나의 큰 영역으로 합치기
    return groups.map(group => this.mergeRegions(group));
  }

  // 두 영역이 인접한지 확인
  private isNearby(region1: MotionRegion, region2: MotionRegion): boolean {
    const distance = Math.sqrt(
      Math.pow(region1.x - region2.x, 2) + Math.pow(region1.y - region2.y, 2)
    );
    return distance < 50; // 50픽셀 이내면 인접
  }

  // 여러 영역을 하나로 합치기
  private mergeRegions(regions: MotionRegion[]): MotionRegion {
    if (regions.length === 1) return regions[0];

    const minX = Math.min(...regions.map(r => r.x));
    const minY = Math.min(...regions.map(r => r.y));
    const maxX = Math.max(...regions.map(r => r.x + r.width));
    const maxY = Math.max(...regions.map(r => r.y + r.height));

    const avgConfidence = regions.reduce((sum, r) => sum + r.confidence, 0) / regions.length;

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
      confidence: avgConfidence,
      id: `merged_${Date.now()}`
    };
  }

  // 모션 감지 임계값 설정
  setMotionThreshold(threshold: number): void {
    this.motionThreshold = threshold;
  }

  // 최소 모션 영역 크기 설정
  setMinMotionArea(area: number): void {
    this.minMotionArea = area;
  }
}
