export interface FixedArea {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  confidence: number;
}

// 비디오에서 클릭 가능한 고정 영역들을 정의 (캔버스 크기에 맞게 조정)
export const FIXED_AREAS: FixedArea[] = [
  {
    id: 'main_person_area',
    x: 100,
    y: 100,
    width: 200,
    height: 250,
    label: '주요 인물',
    confidence: 1.0
  },
  {
    id: 'secondary_person_area',
    x: 400,
    y: 150,
    width: 180,
    height: 200,
    label: '보조 인물',
    confidence: 1.0
  }
];

export class FixedAreaDetector {
  private areas: FixedArea[] = FIXED_AREAS;
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    console.log('고정 영역 감지 초기화 시작...');
    this.isInitialized = true;
    console.log('고정 영역 감지 초기화 완료');
  }

  isReady(): boolean {
    return this.isInitialized;
  }

  getAreas(): FixedArea[] {
    return this.areas;
  }

  drawAreas(ctx: CanvasRenderingContext2D, selectedAreaId: string | null): void {
    this.areas.forEach(area => {
      const isSelected = area.id === selectedAreaId;
      
      // 선택된 영역은 초록색, 기본은 빨간색
      ctx.strokeStyle = isSelected ? '#00ff00' : '#ff0000';
      ctx.lineWidth = 4; // 더 두꺼운 선
      ctx.strokeRect(area.x, area.y, area.width, area.height);

      // 반투명 배경 추가
      ctx.fillStyle = isSelected ? 'rgba(0, 255, 0, 0.1)' : 'rgba(255, 0, 0, 0.1)';
      ctx.fillRect(area.x, area.y, area.width, area.height);

      // 라벨 표시
      const labelText = `${area.label} (클릭 가능)`;
      const labelWidth = ctx.measureText(labelText).width + 10;
      const labelHeight = 20;

      ctx.fillStyle = isSelected ? '#00ff00' : '#ff0000';
      ctx.fillRect(area.x, area.y - labelHeight, labelWidth, labelHeight);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px Arial';
      ctx.fillText(labelText, area.x + 5, area.y - 5);

      // 모서리에 작은 원 추가 (시각적 강조)
      ctx.fillStyle = isSelected ? '#00ff00' : '#ff0000';
      ctx.beginPath();
      ctx.arc(area.x, area.y, 5, 0, 2 * Math.PI);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(area.x + area.width, area.y, 5, 0, 2 * Math.PI);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(area.x, area.y + area.height, 5, 0, 2 * Math.PI);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(area.x + area.width, area.y + area.height, 5, 0, 2 * Math.PI);
      ctx.fill();
    });
  }

  findClickedArea(clickPoint: { x: number; y: number }): FixedArea | null {
    // 가장 최근에 그려진 영역부터 확인 (가장 위에 그려진 영역)
    for (let i = this.areas.length - 1; i >= 0; i--) {
      const area = this.areas[i];
      if (
        clickPoint.x >= area.x &&
        clickPoint.x <= area.x + area.width &&
        clickPoint.y >= area.y &&
        clickPoint.y <= area.y + area.height
      ) {
        return area;
      }
    }
    return null;
  }
}

export const fixedAreaDetector = new FixedAreaDetector();
