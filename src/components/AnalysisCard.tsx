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

const AnalysisCard: React.FC<AnalysisCardProps> = ({ analysisData, selectedPerson }) => {
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
      <div className="relative z-10 perspective-1000">
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
          {/* 카드 앞면 - thinking 이미지 */}
          <div 
            className="absolute inset-0 w-full h-full rounded-xl shadow-2xl overflow-hidden"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <Image
              src="/thinking-person.png"
              alt="당신의 시선은 당신에 대해 무엇을 말해줄까요?"
              fill
              className="object-cover"
            />
          </div>

          {/* 카드 뒷면 - 분석 결과 */}
          <div 
            className="absolute inset-0 w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-2xl"
            style={{ 
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)'
            }}
          >
            <div className="p-6 h-full overflow-y-auto">
              <div className="text-white">
                <h3 className="text-xl font-bold mb-4 text-green-400">📊 분석 결과</h3>
                
                {/* 추적된 인물 분석 */}
                <div className="mb-6">
                  <h4 className="text-lg font-semibold mb-2 text-blue-400">
                    🎭 추적된 인물 분석
                  </h4>
                  <div className="bg-black/30 p-4 rounded-lg text-sm leading-relaxed">
                    {analysisData.trackedPersonAnalysis}
                  </div>
                </div>

                {/* 관람자 분석 */}
                <div className="mb-4">
                  <h4 className="text-lg font-semibold mb-2 text-purple-400">
                    👤 관람자 성향 분석
                  </h4>
                  <div className="bg-black/30 p-4 rounded-lg text-sm leading-relaxed">
                    {analysisData.viewerAnalysis}
                  </div>
                </div>

                {/* 인쇄 버튼 */}
                <button
                  onClick={handlePrint}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  🖨️ 분석 결과 인쇄
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 조작 안내 */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-green-400/70 text-sm font-mono">
        드래그하여 카드 회전 • 클릭하여 뒤집기
      </div>
    </div>
  );
};

export default AnalysisCard;
