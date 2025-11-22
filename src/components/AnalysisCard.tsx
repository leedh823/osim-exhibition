'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';

interface AnalysisData {
  trackedPersonAnalysis: string;
  viewerAnalysis: string;
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
}

const AnalysisCard: React.FC<AnalysisCardProps> = ({ analysisData }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

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

  // 인쇄 기능
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center overflow-hidden">
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
          {/* 카드 앞면 - front.png 이미지 */}
          <div 
            className="absolute inset-0 w-full h-full rounded-xl shadow-2xl overflow-hidden"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <Image
              src="/analysis/front.png"
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
            {/* 배경 이미지 */}
            <Image
              src="/analysis/back.png"
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
                  {/* 한글 분석 텍스트 */}
                  <div className="mb-5">
                    <p 
                      className="text-base leading-relaxed text-white"
                      style={{ fontFamily: 'var(--font-nevermind)' }}
                    >
                      {analysisData?.viewerAnalysis || "당신의 시선은 감정의 파동을 먼저 읽어내는 방식입니다. 타인의 행동보다 분위기와 미묘한 감정을 먼저 포착하며, 그 흐름 속에서 의미를 찾으려는 경향이 뚜렷합니다."}
                    </p>
                  </div>

                  {/* 영어 분석 텍스트 */}
                  <div>
                    <p 
                      className="text-base leading-relaxed text-white"
                      style={{ fontFamily: 'var(--font-nevermind)' }}
                    >
                      {analysisData?.viewerAnalysis ? 
                        "Your gaze captures emotional waves before observable actions. You focus more on atmosphere and subtle feelings than on behavior." :
                        "Your gaze captures emotional waves before observable actions. You focus more on atmosphere and subtle feelings than on behavior."
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 인쇄 버튼 */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
        <button
          onClick={handlePrint}
          className="bg-[#6FA68B] hover:bg-[#5a8a73] text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center text-lg"
          style={{ fontFamily: 'var(--font-coolvetica)' }}
        >
          Print Analysis Results
        </button>
      </div>
    </div>
  );
};

export default AnalysisCard;
