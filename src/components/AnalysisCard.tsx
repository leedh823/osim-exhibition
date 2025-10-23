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
            className="absolute inset-0 w-full h-full bg-white rounded-xl shadow-2xl"
            style={{ 
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)'
            }}
          >
            <div className="p-8 h-full overflow-y-auto">
              <div className="text-[#6FA68B]" style={{ fontFamily: 'var(--font-nexon)' }}>
                {/* 상단 제목 */}
                <div className="mb-8">
                  <h3 className="text-3xl font-normal mb-3" style={{ fontFamily: 'var(--font-coolvetica)', color: '#6FA68B' }}>
                    AI Analysis Result
                  </h3>
                  <p className="text-xl font-normal mb-6" style={{ color: '#6FA68B' }}>분석 결과</p>
                  <div className="border-b-2 mb-8" style={{ borderColor: '#6FA68B' }}></div>
                </div>
                
                {/* 추적된 인물 분석 */}
                <div className="mb-8">
                  <h4 className="text-xl font-normal mb-4" style={{ fontFamily: 'var(--font-coolvetica)', color: '#6FA68B' }}>
                    Tracked Person Analysis
                  </h4>
                  <div className="text-base font-normal leading-relaxed pl-4" style={{ fontFamily: 'var(--font-nexon)', color: '#6FA68B' }}>
                    This person appears to be taking a break in front of a convenience store. The solitary posture suggests feelings of loneliness or fatigue. The urban lifestyle&apos;s exhaustion and daily monotony are evident in their demeanor.
                  </div>
                </div>

                {/* 관람자 분석 */}
                <div className="mb-8">
                  <h4 className="text-xl font-normal mb-4" style={{ fontFamily: 'var(--font-coolvetica)', color: '#6FA68B' }}>
                    Viewer Analysis
                  </h4>
                  <div className="text-base font-normal leading-relaxed pl-4" style={{ fontFamily: 'var(--font-nexon)', color: '#6FA68B' }}>
                    The viewer shows empathy towards this person&apos;s situation and is deeply contemplating the fatigue and loneliness of urban life. They demonstrate excellent empathy and caring abilities towards others.
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
