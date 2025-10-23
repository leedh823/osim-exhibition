import { Pose } from '@mediapipe/pose';
import { SelfieSegmentation } from '@mediapipe/selfie_segmentation';

// 포즈 연결선 정의 (MediaPipe 표준)
const POSE_CONNECTIONS = [
  [11, 12], [11, 13], [13, 15], [15, 17], [15, 19], [15, 21], [17, 19],
  [12, 14], [14, 16], [16, 18], [16, 20], [16, 22], [18, 20],
  [11, 23], [12, 24], [23, 24],
  [23, 25], [24, 26], [25, 27], [26, 28], [27, 29], [28, 30],
  [29, 31], [30, 32], [27, 31], [28, 32],
  [11, 12], [23, 24]
];

export interface MediaPipePerson {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
  poseLandmarks: any[];
  segmentationMask?: ImageData;
}

export class MediaPipeDetector {
  private pose: Pose | null = null;
  private selfieSegmentation: SelfieSegmentation | null = null;
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('MediaPipe 초기화 시작...');

      // Pose Detection 초기화
      this.pose = new Pose({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
        }
      });

      await this.pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: true,
        smoothSegmentation: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });

      // Selfie Segmentation 초기화
      this.selfieSegmentation = new SelfieSegmentation({
        locateFile: (file) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`;
        }
      });

      await this.selfieSegmentation.setOptions({
        modelSelection: 1,
        selfieMode: true
      });

      this.isInitialized = true;
      console.log('MediaPipe 초기화 완료');
    } catch (error) {
      console.error('MediaPipe 초기화 실패:', error);
      throw error;
    }
  }

  async detectPeople(videoElement: HTMLVideoElement): Promise<MediaPipePerson[]> {
    if (!this.pose) {
      console.log('MediaPipe Pose가 초기화되지 않음');
      return [];
    }

    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return [];

      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

      // Pose Detection 실행
      const poseResults = await new Promise<any>((resolve) => {
        this.pose!.onResults((results) => {
          resolve(results);
        });
        this.pose!.send({ image: canvas });
      });

      const detectedPeople: MediaPipePerson[] = [];

      if (poseResults.poseLandmarks && poseResults.poseLandmarks.length > 0) {
        // 포즈 랜드마크가 있으면 사람으로 인식
        const landmarks = poseResults.poseLandmarks;
        
        // 랜드마크를 기반으로 바운딩 박스 계산
        const xs = landmarks.map((lm: any) => lm.x * canvas.width);
        const ys = landmarks.map((lm: any) => lm.y * canvas.height);
        
        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const minY = Math.min(...ys);
        const maxY = Math.max(...ys);

        const person: MediaPipePerson = {
          id: `mediapipe_person_${Date.now()}`,
          x: minX,
          y: minY,
          width: maxX - minX,
          height: maxY - minY,
          confidence: Math.max(...landmarks.map((lm: any) => lm.visibility)),
          poseLandmarks: landmarks
        };

        detectedPeople.push(person);
        console.log(`MediaPipe 사람 감지: 1명 (신뢰도: ${(person.confidence * 100).toFixed(1)}%)`);
      }

      return detectedPeople;
    } catch (error) {
      console.error('MediaPipe 사람 감지 실패:', error);
      return [];
    }
  }

  isReady(): boolean {
    return this.isInitialized && this.pose !== null;
  }

  // 포즈 랜드마크 그리기 (디버깅용)
  drawPoseLandmarks(
    ctx: CanvasRenderingContext2D,
    landmarks: any[],
    width: number,
    height: number
  ): void {
    if (!landmarks || landmarks.length === 0) return;

    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 2;
    ctx.fillStyle = '#00ff00';

    // 랜드마크 점 그리기
    landmarks.forEach((landmark, index) => {
      const x = landmark.x * width;
      const y = landmark.y * height;
      
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, 2 * Math.PI);
      ctx.fill();
    });

    // 포즈 연결선 그리기
    POSE_CONNECTIONS.forEach(([startIdx, endIdx]) => {
      const start = landmarks[startIdx];
      const end = landmarks[endIdx];
      
      if (start && end) {
        ctx.beginPath();
        ctx.moveTo(start.x * width, start.y * height);
        ctx.lineTo(end.x * width, end.y * height);
        ctx.stroke();
      }
    });
  }

  // 세그멘테이션 마스크 그리기 (디버깅용)
  drawSegmentationMask(
    ctx: CanvasRenderingContext2D,
    mask: ImageData,
    width: number,
    height: number
  ): void {
    if (!mask) return;

    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    tempCanvas.width = width;
    tempCanvas.height = height;
    tempCtx.putImageData(mask, 0, 0);

    ctx.globalAlpha = 0.3;
    ctx.drawImage(tempCanvas, 0, 0);
    ctx.globalAlpha = 1.0;
  }
}

// 싱글톤 인스턴스
export const mediaPipeDetector = new MediaPipeDetector();

// 유틸리티 함수들
export const drawPersonBox = (
  ctx: CanvasRenderingContext2D,
  person: MediaPipePerson,
  isSelected: boolean = false
): void => {
  const { x, y, width, height, confidence } = person;
  
  // 바운딩 박스 색상 결정
  const strokeColor = isSelected ? '#00ff00' : '#ff0000';
  
  // 바운딩 박스 그리기
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 3;
  ctx.strokeRect(x, y, width, height);
  
  // 라벨 배경
  const labelText = `사람 (${(confidence * 100).toFixed(1)}%)`;
  const labelWidth = ctx.measureText(labelText).width + 10;
  const labelHeight = 20;
  
  ctx.fillStyle = strokeColor;
  ctx.fillRect(x, y - labelHeight, labelWidth, labelHeight);
  
  // 라벨 텍스트
  ctx.fillStyle = '#ffffff';
  ctx.font = '12px Arial';
  ctx.fillText(labelText, x + 5, y - 5);
};

export const isPointInPerson = (
  point: { x: number; y: number },
  person: MediaPipePerson
): boolean => {
  return (
    point.x >= person.x &&
    point.x <= person.x + person.width &&
    point.y >= person.y &&
    point.y <= person.y + person.height
  );
};
