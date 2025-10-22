<!-- e955a33e-0c8e-4772-ac2b-4ac89a5c49fa a2c06cb2-2959-4ae4-a246-34262dfcf27e -->
# Advanced Tracking Exhibition Development Plan

## 프로젝트 개요
- **목표**: "Exhausting a Crowd" 스타일의 고도화된 인터랙티브 트래킹 전시
- **기간**: 2024년 10월 28일까지 MVP, 11월 24일 졸업 전시
- **개발자**: 1인 (프론트엔드 + 백엔드)
- **화면**: 가로형 16:9 비율

## 기술 스택

### Frontend
- Next.js 15.5.4 (React 19)
- TypeScript
- Tailwind CSS 4
- TensorFlow.js / ONNX.js (AI 객체 탐지)

### Backend
- Next.js API Routes
- OpenAI API (GPT-4)
- 세션 기반 상태 관리 (localStorage)

### AI/ML
- YOLOv8 또는 MediaPipe (객체 탐지)
- ONNX Runtime Web (브라우저 내 추론)

## 주요 기능 플로우

### 1단계: 트래킹 영상 (AI 객체 탐지)
- 1.mp4 영상 재생
- Canvas overlay로 실시간 객체 탐지
- 움직이는 사람들에게 바운딩 박스 표시
- 바운딩 박스 클릭 시 해당 인물 ID 저장 및 2단계 전환

### 2단계: 확대 영상
- 선택된 인물의 확대 영상(2.mp4) 재생
- 화면 클릭 시 3단계 전환

### 3단계: AI 대화 화면
- **왼쪽 50%**: 2.mp4 영상 계속 재생
- **오른쪽 50%**: AI 채팅 인터페이스
- OpenAI API로 실시간 대화 (5턴)
- 대화 내용 실시간 분석

### 4단계: 분석 결과 카드
- 2개 카드 표시 (추적된 사람 분석 + 관람자 분석)
- 카드 앞면: 디자인 일러스트
- 카드 뒷면: AI 생성 분석 텍스트
- CSS 3D flip 애니메이션
- window.print() 인쇄 기능

## 개발 단계별 계획

### Phase 1: 레이아웃 변경 (10/22 - 10/23)
**작업 내용:**
- 세로형(9:16) → 가로형(16:9) 변경
- `src/app/page.tsx`: aspect ratio 수정
- `src/app/globals.css`: 미디어 쿼리 및 반응형 조정
- 3단계 레이아웃: 좌우 50% 분할

**예상 시간:** 2-3시간

### Phase 2: AI 객체 탐지 구현 (10/23 - 10/26)
**작업 내용:**
- TensorFlow.js 또는 ONNX.js 설치
- YOLOv8 또는 COCO-SSD 모델 로드
- Canvas overlay 구현 (video 위에 투명 캔버스)
- 실시간 프레임 추출 및 객체 탐지
- 바운딩 박스 렌더링 (클릭 가능)
- 클릭 이벤트로 인물 선택

**핵심 파일:**
- `src/components/VideoTracker.tsx` (새 파일)
- `src/utils/objectDetection.ts` (새 파일)
- `public/models/` (ONNX 모델 파일)

**예상 시간:** 3-4일

**참고 기술:**
```typescript
// objectDetection.ts 예시 구조
import * as ort from 'onnxruntime-web';

export async function detectObjects(videoElement: HTMLVideoElement) {
  // 1. 프레임 추출
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx.drawImage(videoElement, 0, 0, 640, 640);
  
  // 2. 전처리
  const imageData = ctx.getImageData(0, 0, 640, 640);
  const input = preprocessImage(imageData);
  
  // 3. 모델 추론
  const session = await ort.InferenceSession.create('/models/yolov8n.onnx');
  const results = await session.run({ images: input });
  
  // 4. 후처리 (바운딩 박스 추출)
  return postprocessResults(results);
}
```

### Phase 3: OpenAI API 연동 (10/26 - 10/27)
**작업 내용:**
- OpenAI API key 환경 변수 설정 (`.env.local`)
- API Route 생성: `/api/chat`
- 5턴 대화 관리 로직
- 실시간 분석 프롬프트 엔지니어링
- 관람자 분석 로직 (대화 패턴 분석)

**핵심 파일:**
- `src/app/api/chat/route.ts` (새 파일)
- `src/app/page.tsx` (AI 채팅 UI 수정)

**예상 시간:** 1-2일

**API Route 구조:**
```typescript
// src/app/api/chat/route.ts
import OpenAI from 'openai';

export async function POST(req: Request) {
  const { messages, turnCount } = await req.json();
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  
  const systemPrompt = turnCount < 5 
    ? "영상 속 인물의 행동을 질문하세요."
    : "5턴 대화를 분석하여 2개의 분석 결과를 생성하세요.";
  
  const completion = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      { role: "system", content: systemPrompt },
      ...messages
    ]
  });
  
  return Response.json(completion.choices[0].message);
}
```

### Phase 4: 분석 결과 카드 (10/27 - 10/28)
**작업 내용:**
- 3D 카드 flip 애니메이션 구현
- 앞면: SVG/이미지 디자인
- 뒷면: AI 생성 분석 텍스트 렌더링
- window.print() API 통합
- 인쇄용 CSS (@media print)

**핵심 파일:**
- `src/components/AnalysisCard.tsx` (새 파일)
- `src/app/globals.css` (카드 애니메이션 추가)

**예상 시간:** 1일

**카드 구조:**
```typescript
// AnalysisCard.tsx
export function AnalysisCard({ type, analysis, onFlip }) {
  const [isFlipped, setIsFlipped] = useState(false);
  
  return (
    <div 
      className="card-container perspective-1000"
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <div className={`card ${isFlipped ? 'flipped' : ''}`}>
        <div className="card-front">{/* 일러스트 */}</div>
        <div className="card-back">{analysis}</div>
      </div>
    </div>
  );
}
```

### Phase 5: 통합 및 최적화 (10/28 - 11/10)
**작업 내용:**
- 전체 플로우 테스트
- 성능 최적화 (모델 추론 속도, 메모리)
- 에러 핸들링 및 fallback
- 브라우저 호환성 테스트
- Vercel 배포 설정

**예상 시간:** 2주 (버그 수정 및 개선)

### Phase 6: 전시 준비 (11/10 - 11/24)
**작업 내용:**
- 키오스크 모드 설정
- 전체화면 자동 실행
- 세션 타임아웃 및 자동 리셋
- 인쇄 큐 관리
- 현장 테스트

**예상 시간:** 2주

## 파일 구조

```
/Users/idohyeong/Desktop/osim-record/
├── src/
│   ├── app/
│   │   ├── page.tsx (메인 애플리케이션, 16:9 레이아웃)
│   │   ├── globals.css (가로형 스타일, 카드 애니메이션)
│   │   ├── api/
│   │   │   └── chat/
│   │   │       └── route.ts (OpenAI API)
│   ├── components/
│   │   ├── VideoTracker.tsx (AI 객체 탐지 + 바운딩 박스)
│   │   ├── AnalysisCard.tsx (3D 카드)
│   │   └── ChatInterface.tsx (AI 채팅 UI)
│   ├── utils/
│   │   ├── objectDetection.ts (ONNX/TF.js 래퍼)
│   │   └── analysisPrompts.ts (프롬프트 템플릿)
├── public/
│   ├── 1.mp4 (트래킹 영상)
│   ├── 2.mp4 (확대 영상)
│   └── models/
│       └── yolov8n.onnx (객체 탐지 모델)
├── .env.local (OPENAI_API_KEY)
└── package.json
```

## 기술적 고려사항

### 1. 객체 탐지 성능
- **실시간 처리**: 30fps → 10fps로 샘플링 (CPU 부하 감소)
- **경량 모델 사용**: YOLOv8n (nano) 또는 MobileNet
- **Web Worker**: 메인 스레드와 분리하여 추론

### 2. OpenAI API 최적화
- **스트리밍**: `stream: true`로 실시간 응답 표시
- **토큰 제한**: 대화당 최대 토큰 설정
- **에러 핸들링**: Rate limit, timeout 처리

### 3. 세션 관리
- localStorage로 대화 기록 저장
- 세션 만료 시 자동 초기화 (전시 환경)

### 4. 인쇄 기능
- `@media print` CSS로 카드만 인쇄
- `window.print()` 호출 전 레이아웃 조정

## 우선순위

**Critical (10/28까지 필수):**
1. 레이아웃 변경 (16:9)
2. OpenAI API 연동 (기본 대화)
3. 분석 결과 카드 (정적 데이터)
4. 인쇄 기능 (window.print)

**High (11/10까지):**
5. AI 객체 탐지 (바운딩 박스)
6. 클릭 가능한 영역 동적 생성

**Medium (11/24까지):**
7. 성능 최적화
8. 전시 환경 설정

## 개발 환경 설정

### 필수 패키지 설치
```bash
npm install openai
npm install onnxruntime-web
npm install @tensorflow/tfjs @tensorflow-models/coco-ssd
```

### 환경 변수
`.env.local` 파일:
```
OPENAI_API_KEY=sk-...
```

## 리스크 및 대응

**리스크 1**: AI 객체 탐지 성능 부족
- **대응**: 정적 바운딩 박스 좌표로 fallback (현재 구현 유지)

**리스크 2**: OpenAI API 비용
- **대응**: 로컬 테스트 시 mock 데이터 사용, 전시 기간만 실제 API 사용

**리스크 3**: 브라우저 호환성
- **대응**: Chrome 브라우저 전용 최적화, polyfill 추가

**리스크 4**: 일정 지연
- **대응**: Phase 2 (AI 객체 탐지) 생략 가능, 정적 영역으로 대체

### To-dos

- [ ] 레이아웃을 세로형(9:16)에서 가로형(16:9)으로 변경, 3단계 좌우 50% 분할 구조 구현
- [ ] ONNX.js/TensorFlow.js로 YOLOv8 객체 탐지 구현, Canvas overlay로 바운딩 박스 렌더링
- [ ] OpenAI API 연동, /api/chat 라우트 생성, 5턴 대화 및 실시간 분석 구현
- [ ] 3D 카드 flip 애니메이션, 앞면 디자인 + 뒷면 분석 텍스트, window.print() 인쇄 기능
- [ ] 전체 플로우 통합, 성능 최적화, 에러 핸들링, Vercel 배포
- [ ] 키오스크 모드, 전체화면 자동 실행, 세션 관리, 현장 테스트