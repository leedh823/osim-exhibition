export interface ClickableArea {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  confidence: number;
}

export interface DetectedPerson {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
  label: string;
}

// 영상에서 사람이 나타나는 영역들을 미리 정의 (더 큰 영역으로 설정)
export const PREDEFINED_AREAS: ClickableArea[] = [
  {
    id: 'person_area_1',
    x: 200,
    y: 200,
    width: 300,
    height: 400,
    label: '사람 1',
    confidence: 1.0
  },
  {
    id: 'person_area_2',
    x: 600,
    y: 250,
    width: 280,
    height: 380,
    label: '사람 2',
    confidence: 1.0
  },
  {
    id: 'person_area_3',
    x: 1000,
    y: 300,
    width: 260,
    height: 350,
    label: '사람 3',
    confidence: 1.0
  }
];

export class AreaBasedDetector {
  private areas: ClickableArea[] = PREDEFINED_AREAS;
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    console.log('영역 기반 감지 초기화 시작...');
    
    // 영역들을 동적으로 조정할 수 있음 (비디오 크기에 맞춰)
    this.adjustAreasToVideoSize(1920, 1080); // 기본 16:9 비율
    
    this.isInitialized = true;
    console.log('영역 기반 감지 초기화 완료');
  }

  // 비디오 크기에 맞춰 영역 조정
  private adjustAreasToVideoSize(videoWidth: number, videoHeight: number): void {
    const scaleX = videoWidth / 1920;
    const scaleY = videoHeight / 1080;
    
    this.areas = PREDEFINED_AREAS.map(area => ({
      ...area,
      x: Math.round(area.x * scaleX),
      y: Math.round(area.y * scaleY),
      width: Math.round(area.width * scaleX),
      height: Math.round(area.height * scaleY)
    }));
  }

  // 감지된 사람들 반환 (실제로는 미리 정의된 영역들)
  async detectPeople(): Promise<DetectedPerson[]> {
    if (!this.isInitialized) {
      console.log('영역 기반 감지가 초기화되지 않음');
      return [];
    }

    const detectedPeople: DetectedPerson[] = this.areas.map(area => ({
      id: area.id,
      x: area.x,
      y: area.y,
      width: area.width,
      height: area.height,
      confidence: area.confidence,
      label: area.label
    }));

    console.log(`영역 기반 감지: ${detectedPeople.length}개 영역`);
    return detectedPeople;
  }

  // 클릭된 영역 찾기
  findClickedArea(clickPoint: { x: number; y: number }): DetectedPerson | null {
    const clickedArea = this.areas.find(area => 
      clickPoint.x >= area.x &&
      clickPoint.x <= area.x + area.width &&
      clickPoint.y >= area.y &&
      clickPoint.y <= area.y + area.height
    );

    if (clickedArea) {
      return {
        id: clickedArea.id,
        x: clickedArea.x,
        y: clickedArea.y,
        width: clickedArea.width,
        height: clickedArea.height,
        confidence: clickedArea.confidence,
        label: clickedArea.label
      };
    }

    return null;
  }

  isReady(): boolean {
    return this.isInitialized;
  }

  // 영역 그리기
  drawAreas(
    ctx: CanvasRenderingContext2D,
    selectedPersonId?: string
  ): void {
    this.areas.forEach(area => {
      const isSelected = selectedPersonId === area.id;
      
      // 바운딩 박스 색상
      const strokeColor = isSelected ? '#00ff00' : '#ff0000';
      
      // 바운딩 박스 그리기
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 3;
      ctx.strokeRect(area.x, area.y, area.width, area.height);
      
      // 라벨 배경
      const labelText = `${area.label} (클릭 가능)`;
      const labelWidth = ctx.measureText(labelText).width + 10;
      const labelHeight = 20;
      
      ctx.fillStyle = strokeColor;
      ctx.fillRect(area.x, area.y - labelHeight, labelWidth, labelHeight);
      
      // 라벨 텍스트
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px Arial';
      ctx.fillText(labelText, area.x + 5, area.y - 5);
    });
  }
}

// 싱글톤 인스턴스
export const areaDetector = new AreaBasedDetector();
