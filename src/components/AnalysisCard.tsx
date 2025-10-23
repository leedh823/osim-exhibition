'use client';

import { useState, useRef, useEffect } from 'react';

interface AnalysisData {
  trackedPersonAnalysis: string;
  viewerAnalysis: string;
}

interface AnalysisCardProps {
  analysisData: AnalysisData;
  selectedPerson: any;
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
          className={`relative w-96 h-54 cursor-pointer transition-transform duration-500 ease-out ${
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
          {/* 카드 앞면 - 일러스트 */}
          <div 
            className="absolute inset-0 w-full h-full bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-xl shadow-2xl"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <div className="p-8 h-full flex flex-col items-center justify-center text-white">
              {/* AI 분석 아이콘 */}
              <div className="text-6xl mb-4">🤖</div>
              <h2 className="text-2xl font-bold mb-2">AI 분석 결과</h2>
              <p className="text-center text-lg opacity-90">
                CCTV 화면 속 인물과 관람자의 상호작용 분석
              </p>
              
              {/* 분석 대상 정보 */}
              <div className="mt-6 p-4 bg-white/10 rounded-lg backdrop-blur-sm">
                <div className="text-sm opacity-80">분석 대상</div>
                <div className="font-semibold">
                  {selectedPerson?.label || '감지된 인물'}
                </div>
                <div className="text-xs opacity-70">
                  신뢰도: {Math.round((selectedPerson?.confidence || 0) * 100)}%
                </div>
              </div>
              
              {/* 클릭 안내 */}
              <div className="mt-6 text-sm opacity-70 animate-pulse">
                클릭하여 분석 결과 보기
              </div>
            </div>
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
