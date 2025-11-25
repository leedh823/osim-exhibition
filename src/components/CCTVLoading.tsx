'use client';

import { useState, useEffect } from 'react';

interface CCTVLoadingProps {
  onComplete: () => void;
}

const CCTVLoading: React.FC<CCTVLoadingProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const loadingMessages = [
    '당신이 관찰한 장면과 그에 대한 답변을 정렬하고 있습니다',
    '각 답변에 숨겨진 선택의 기준을 추출하는 중입니다',
    '당신이 타인을 해석할 때 사용하는 관찰 패턴을 분석하고 있습니다',
    '그 패턴들을 서로 비교하여, 당신만의 인식 구조를 구성하는 중입니다',
    '곧, 수집된 데이터로부터 AI가 도출된 당신에 대한 분석 결과가 제시됩니다'
  ];

  useEffect(() => {
    if (currentStep >= loadingMessages.length) {
      onComplete();
      return;
    }

    // 텍스트가 나타남
    setIsVisible(true);

    let nextStepTimer: NodeJS.Timeout | null = null;

    // 2초 후 텍스트가 사라지고 다음 단계로
    const hideTimer = setTimeout(() => {
      setIsVisible(false);
      
      // 페이드 아웃 후 다음 텍스트로 이동
      nextStepTimer = setTimeout(() => {
        if (currentStep < loadingMessages.length - 1) {
          setCurrentStep(prev => prev + 1);
        } else {
          // 마지막 메시지 후 완료
          onComplete();
        }
      }, 500); // 페이드 아웃 시간
    }, 2000); // 텍스트 표시 시간 (2초)

    return () => {
      clearTimeout(hideTimer);
      if (nextStepTimer) {
        clearTimeout(nextStepTimer);
      }
    };
  }, [currentStep, loadingMessages.length, onComplete]);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
      {/* 배경 패턴 효과 */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
          backgroundSize: '40px 40px'
        }} />
      </div>

      {/* 메인 텍스트 */}
      <div className="relative z-10 text-center px-8">
        <div 
          className={`text-white transition-opacity duration-500 ${
            isVisible ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            fontSize: 'clamp(1.5rem, 3vw, 2rem)',
            lineHeight: '1.8',
            textShadow: '0 0 20px rgba(255, 255, 255, 0.3), 0 0 40px rgba(255, 255, 255, 0.1)',
            letterSpacing: '0.02em'
          }}
        >
          {loadingMessages[currentStep]}
        </div>

        {/* 진행 표시 바 */}
        <div className="mt-8 w-64 mx-auto h-1 bg-white/10 rounded-full overflow-hidden">
          <div 
            className="h-full bg-white/30 rounded-full transition-all duration-300 ease-out"
            style={{
              width: `${((currentStep + 1) / loadingMessages.length) * 100}%`,
              boxShadow: '0 0 10px rgba(255, 255, 255, 0.5)'
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default CCTVLoading;
