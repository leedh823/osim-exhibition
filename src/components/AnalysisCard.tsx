'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';

interface AnalysisData {
  analysis?: string; // 7가지 지표 종합 분석 결과
  // 하위 호환성을 위한 필드
  meaningMaking?: string;
  empathicResonance?: string;
  imaginativeCompletion?: string;
  valueOrientation?: string;
  situationalReasoning?: string;
  interpersonalLens?: string;
  selfProjection?: string;
  trackedPersonAnalysis?: string;
  viewerAnalysis?: string;
}

interface SelectedPerson {
  id: string;
  label: string;
  x: number;
  y: number;
  confidence: number;
  isMoving: boolean;
  speed?: number;
}

interface AnalysisCardProps {
  analysisData: AnalysisData;
  selectedPerson: SelectedPerson | null;
  selectedPoster?: string | null;
}

const AnalysisCard: React.FC<AnalysisCardProps> = ({ analysisData, selectedPoster }) => {
  const router = useRouter();
  const [isFlipped, setIsFlipped] = useState(false);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showQRCode, setShowQRCode] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  
  // 앞면 이미지 랜덤 선택 (한 번만)
  const [frontImage] = useState(() => {
    const frontImages = ['/analysis/카드 앞 2.png', '/analysis/카드 앞 3.png', '/analysis/카드 앞 4.png'];
    const randomIndex = Math.floor(Math.random() * frontImages.length);
    return frontImages[randomIndex];
  });
  
  // 뒷면 이미지 선택 (포스터에 따라)
  const backImage = selectedPoster === '1' 
    ? '/analysis/poster1 back.png'
    : selectedPoster === '2'
    ? '/analysis/poster2 back.png'
    : selectedPoster === '3'
    ? '/analysis/poster3 back.png'
    : '/analysis/back.png'; // 기본값

  // 드래그 시작
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  // 드래그 중
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    
    setRotation({
      x: Math.max(-30, Math.min(30, deltaY * 0.5)),
      y: Math.max(-30, Math.min(30, deltaX * 0.5))
    });
  };

  // 드래그 종료
  const handleMouseUp = () => {
    setIsDragging(false);
    // 부드럽게 원래 위치로 복귀
    setTimeout(() => {
      setRotation({ x: 0, y: 0 });
    }, 200);
  };

  // 카드 클릭으로 뒤집기
  const handleCardClick = () => {
    setIsFlipped(!isFlipped);
  };

  // 카드 이미지를 캡처하고 다운로드 링크 생성 (앞뒷면 모두, 겹치고 각도 있게)
  const captureCardImage = async () => {
    if (!cardRef.current) return;

    try {
      const cardElement = cardRef.current;
      const cardContainer = cardElement.closest('.perspective-1000') as HTMLElement;
      
      if (!cardContainer) {
        console.error('카드 컨테이너를 찾을 수 없습니다.');
        return;
      }

      // 앞면 이미지 파일 직접 로드
      const frontImg = document.createElement('img') as HTMLImageElement;
      frontImg.crossOrigin = 'anonymous';
      
      await new Promise<void>((resolve, reject) => {
        frontImg.onload = () => resolve();
        frontImg.onerror = () => {
          console.error('앞면 이미지 로드 실패:', frontImage);
          reject(new Error('앞면 이미지를 불러올 수 없습니다.'));
        };
        frontImg.src = frontImage;
      });

      // 원래 상태 저장
      const originalTransform = cardElement.style.transform;
      const originalIsFlipped = isFlipped;
      const originalRotation = { ...rotation };

      // 회전 제거 (평면으로 만들기)
      setRotation({ x: 0, y: 0 });
      await new Promise(resolve => setTimeout(resolve, 100));

      // 뒷면 캡처 (카드를 뒤집은 상태에서)
      cardElement.style.transform = 'rotateX(0deg) rotateY(180deg)';
      setIsFlipped(true);
      await new Promise(resolve => setTimeout(resolve, 300)); // 렌더링 대기

      const backCanvas = await html2canvas(cardContainer, {
        backgroundColor: '#000000',
        scale: 2,
        useCORS: true,
        logging: false,
        allowTaint: true,
        windowWidth: cardContainer.offsetWidth,
        windowHeight: cardContainer.offsetHeight
      });

      // 원래 상태로 복원
      cardElement.style.transform = originalTransform;
      setIsFlipped(originalIsFlipped);
      setRotation(originalRotation);
      await new Promise(resolve => setTimeout(resolve, 100));

      // 합성 캔버스 생성 (세로로 겹치고 각도 있게)
      const cardWidth = frontImg.width;
      const cardHeight = Math.max(frontImg.height, backCanvas.height);
      const overlap = 100; // 겹치는 부분
      const angle = -8; // 각도 (도)
      const offsetX = 80; // 뒷면이 오른쪽으로 이동하는 정도
      const padding = 100; // 여유 공간
      
      // 캔버스 크기 계산 (세로 배치, 각도와 겹침 고려)
      const totalWidth = cardWidth + offsetX + padding * 2;
      const totalHeight = cardHeight + cardHeight - overlap + padding * 2;
      
      const combinedCanvas = document.createElement('canvas');
      combinedCanvas.width = totalWidth;
      combinedCanvas.height = totalHeight;

      const ctx = combinedCanvas.getContext('2d');
      if (!ctx) {
        console.error('합성 Canvas context를 생성할 수 없습니다.');
        return;
      }

      // 배경색 (어두운 회색)
      ctx.fillStyle = '#2a2a2a';
      ctx.fillRect(0, 0, totalWidth, totalHeight);

      // 그림자 설정
      ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
      ctx.shadowBlur = 20;
      ctx.shadowOffsetX = 5;
      ctx.shadowOffsetY = 5;

      // 앞면 그리기 (위쪽, 약간 회전)
      const frontX = padding;
      const frontY = padding;
      ctx.save();
      ctx.translate(frontX + cardWidth / 2, frontY + cardHeight / 2);
      ctx.rotate(angle * Math.PI / 180);
      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
      ctx.shadowBlur = 15;
      ctx.shadowOffsetX = 3;
      ctx.shadowOffsetY = 3;
      ctx.drawImage(frontImg, -cardWidth / 2, -cardHeight / 2);
      ctx.restore();

      // 뒷면 그리기 (아래쪽, 약간 오른쪽, 겹치게, 반대 방향 회전)
      const backX = frontX + offsetX;
      const backY = frontY + cardHeight - overlap;
      ctx.save();
      ctx.translate(backX + cardWidth / 2, backY + cardHeight / 2);
      ctx.rotate(-angle * Math.PI / 180);
      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
      ctx.shadowBlur = 15;
      ctx.shadowOffsetX = 3;
      ctx.shadowOffsetY = 3;
      ctx.drawImage(backCanvas, -cardWidth / 2, -cardHeight / 2);
      ctx.restore();

      // 합성된 이미지 업로드
      await uploadCanvas(combinedCanvas);
    } catch (error) {
      console.error('이미지 캡처 오류:', error);
      alert(`이미지 캡처 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  };

  // Canvas를 업로드하는 헬퍼 함수
  const uploadCanvas = async (canvas: HTMLCanvasElement) => {
    canvas.toBlob(async (blob) => {
      if (!blob) return;

      // FormData 생성
      const formData = new FormData();
      formData.append('image', blob, 'analysis-card.png');

      try {
        // 서버에 이미지 업로드 (Supabase Storage)
        const response = await fetch('/api/upload-image', {
          method: 'POST',
          body: formData
        });

        if (response.ok) {
          const data = await response.json();
          // Supabase 공개 URL을 다운로드 페이지로 전달
          const downloadLink = `${window.location.origin}/download?url=${encodeURIComponent(data.url)}`;
          setDownloadUrl(downloadLink);
          setShowQRCode(true);
        } else {
          const errorData = await response.json();
          console.error('업로드 실패:', errorData);
          alert('이미지 업로드에 실패했습니다. 다시 시도해주세요.');
        }
      } catch (error) {
        console.error('이미지 업로드 오류:', error);
        alert('이미지 업로드 중 오류가 발생했습니다.');
      }
    }, 'image/png');
  };

  // 인쇄 버튼 클릭 시 QR 코드 표시
  const handlePrint = () => {
    captureCardImage();
  };

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center overflow-hidden">
      {/* QR 코드 모달 */}
      {showQRCode && downloadUrl && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          onClick={() => {
            setShowQRCode(false);
            router.push('/');
          }}
        >
          <div 
            className="bg-white rounded-lg p-8 flex flex-col items-center gap-4 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* X 버튼 */}
            <button
              onClick={() => {
                setShowQRCode(false);
                router.push('/');
              }}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl font-bold w-8 h-8 flex items-center justify-center"
            >
              ×
            </button>
            <h2 className="text-2xl font-bold text-black">QR 코드를 스캔하여 이미지 다운로드</h2>
            <div className="bg-white p-4 rounded-lg">
              <QRCodeSVG value={downloadUrl} size={256} />
            </div>
            <p className="text-sm text-gray-600 text-center max-w-xs">
              QR 코드를 스캔하면 분석 카드 이미지를 다운로드할 수 있습니다.
            </p>
          </div>
        </div>
      )}
      {/* CCTV 배경 효과 */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-800" />
      <div className="absolute inset-0 bg-black/50" />
      
      {/* 스캔라인 효과 */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-green-500/5 to-transparent animate-pulse" />
      
      {/* 3D 카드 컨테이너 */}
      <div className="relative z-10 perspective-1000 -mt-16">
        <div
          ref={cardRef}
          className={`relative w-[80vw] h-[45vw] cursor-pointer transition-transform duration-500 ease-out ${
            isDragging ? 'cursor-grabbing' : 'cursor-grab'
          }`}
          style={{
            transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) ${
              isFlipped ? 'rotateY(180deg)' : ''
            }`,
            transformStyle: 'preserve-3d'
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onClick={handleCardClick}
        >
          {/* 카드 앞면 - 랜덤 이미지 (카드 앞 2, 3, 4) */}
          <div 
            className="absolute inset-0 w-full h-full rounded-xl shadow-2xl overflow-hidden"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <Image
              src={frontImage}
              alt="Interpretive Focus Projective Viewer"
              fill
              className="object-cover"
            />
          </div>

          {/* 카드 뒷면 - back.png 이미지 + 분석 결과 텍스트 오버레이 */}
          <div 
            className="absolute inset-0 w-full h-full rounded-xl shadow-2xl overflow-hidden"
            style={{ 
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)'
            }}
          >
            {/* 배경 이미지 - 포스터에 따라 선택 */}
            <Image
              src={backImage}
              alt="AI Reading Notes"
              fill
              className="object-cover"
            />
            
            {/* 텍스트 오버레이 - 오른쪽 패널 영역 (이미지 위에 텍스트만) */}
            <div className="absolute inset-0 flex">
              {/* 왼쪽 영역 */}
              <div className="flex-1"></div>
              
              {/* 오른쪽 패널 - 텍스트만 오버레이 (이미지의 AI Reading Notes 아래) */}
              <div className="w-[40%] h-full flex flex-col">
                {/* 상단 영역 (Interpretive Focus, Projective Viewer, Name, Recordings Date, AI Reading Notes 제목) */}
                <div style={{ height: '60%' }}></div>
                
                {/* AI Reading Notes 제목 바로 아래 텍스트 영역 - 왼쪽 정렬 */}
                <div className="pr-8 pt-2" style={{ marginLeft: '-290px' }}>
                  {/* 한글 분석 텍스트 - 7가지 지표 종합 분석 */}
                  <div>
                    <p 
                      className="text-lg leading-relaxed text-white whitespace-pre-line"
                      style={{ fontFamily: 'var(--font-nevermind)', fontSize: 'clamp(14px, 1.1vw, 24px)' }}
                    >
                      {(() => {
                        // 새로운 통합 분석 결과가 있으면 사용
                        if (analysisData?.analysis) {
                          return analysisData.analysis;
                        }
                        // 7가지 개별 지표가 있으면 종합하여 표시
                        if (analysisData?.meaningMaking || analysisData?.empathicResonance || 
                            analysisData?.imaginativeCompletion || analysisData?.valueOrientation ||
                            analysisData?.situationalReasoning || analysisData?.interpersonalLens ||
                            analysisData?.selfProjection) {
                          const parts = [];
                          if (analysisData.meaningMaking) parts.push(analysisData.meaningMaking);
                          if (analysisData.empathicResonance) parts.push(analysisData.empathicResonance);
                          if (analysisData.imaginativeCompletion) parts.push(analysisData.imaginativeCompletion);
                          if (analysisData.valueOrientation) parts.push(analysisData.valueOrientation);
                          if (analysisData.situationalReasoning) parts.push(analysisData.situationalReasoning);
                          if (analysisData.interpersonalLens) parts.push(analysisData.interpersonalLens);
                          if (analysisData.selfProjection) parts.push(analysisData.selfProjection);
                          return parts.join(' ');
                        }
                        // 하위 호환성: 기존 viewerAnalysis 사용
                        return analysisData?.viewerAnalysis || "당신의 시선은 감정의 파동을 먼저 읽어내는 방식입니다. 타인의 행동보다 분위기와 미묘한 감정을 먼저 포착하며, 그 흐름 속에서 의미를 찾으려는 경향이 뚜렷합니다.";
                      })()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 이미지 다운받기 버튼 */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
        <button
          onClick={handlePrint}
          className="bg-[#6FA68B] hover:bg-[#5a8a73] text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center"
          style={{ fontFamily: 'var(--font-coolvetica)', fontSize: 'clamp(14px, 1.2vw, 28px)' }}
        >
          이미지 다운받기
        </button>
      </div>
    </div>
  );
};

export default AnalysisCard;
