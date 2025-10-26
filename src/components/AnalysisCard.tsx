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
                  <div className="text-base font-normal leading-relaxed pl-4 mb-4" style={{ fontFamily: 'var(--font-nexon)', color: '#6FA68B' }}>
                    This person appears to be a working professional in their mid-30s, taking a brief rest in front of a convenience store. Their slumped shoulders and weary expression suggest the exhaustion of a long day. The neat business attire and briefcase indicate they work in an office environment, likely experiencing work-related stress or personal concerns. The urban lifestyle&apos;s daily fatigue and sense of isolation are evident in their demeanor.
                  </div>
                  <p className="text-sm font-normal mb-2" style={{ fontFamily: 'var(--font-nexon)', color: '#6FA68B' }}>추적된 인물 분석</p>
                  <div className="text-base font-normal leading-relaxed pl-4" style={{ fontFamily: 'var(--font-nexon)', color: '#6FA68B' }}>
                    이 사람은 30대 중반의 직장인으로 보이며, 편의점 앞에서 잠시 휴식을 취하고 있습니다. 어깨가 축 늘어져 있는 자세와 한숨을 쉬는 듯한 모습에서 하루의 피로감이 느껴집니다. 깔끔한 정장 차림과 가방을 보면 사무직에 종사하는 것으로 추정되며, 현재 업무 스트레스나 개인적인 고민으로 인한 무기력감을 느끼고 있는 것 같습니다. 도시 생활의 일상적 피로와 고독감이 표정에 드러나 있습니다.
                  </div>
                </div>

                {/* 관람자 분석 */}
                <div className="mb-8">
                  <h4 className="text-xl font-normal mb-4" style={{ fontFamily: 'var(--font-coolvetica)', color: '#6FA68B' }}>
                    Viewer Analysis
                  </h4>
                  <div className="text-base font-normal leading-relaxed pl-4 mb-4" style={{ fontFamily: 'var(--font-nexon)', color: '#6FA68B' }}>
                    The viewer demonstrates deep empathy towards this person&apos;s situation and shows a sophisticated understanding of urban life&apos;s challenges. Their responses reveal a keen observational ability and emotional intelligence, suggesting they have experienced similar struggles or possess a high level of social awareness. They appear to be someone who values human connection and is critical of modern society&apos;s isolating tendencies.
                  </div>
                  <p className="text-sm font-normal mb-2" style={{ fontFamily: 'var(--font-nexon)', color: '#6FA68B' }}>관람자 분석</p>
                  <div className="text-base font-normal leading-relaxed pl-4" style={{ fontFamily: 'var(--font-nexon)', color: '#6FA68B' }}>
                    관람자는 이 사람의 상황에 깊은 공감을 보이며, 도시 생활의 현실적인 어려움을 이해하고 있습니다. 세심한 관찰력으로 인물의 미묘한 감정 변화까지 포착하는 능력이 뛰어나며, 타인의 고통에 대한 민감한 감수성을 가지고 있습니다. 사회적 약자나 힘든 상황에 있는 사람들에 대한 배려심이 깊고, 현대 사회의 개인주의적 경향에 대해 비판적 사고를 하는 것으로 보입니다.
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
