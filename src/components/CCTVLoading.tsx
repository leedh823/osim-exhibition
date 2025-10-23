'use client';

import { useState, useEffect } from 'react';

interface CCTVLoadingProps {
  onComplete: () => void;
}

const CCTVLoading: React.FC<CCTVLoadingProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [showCursor, setShowCursor] = useState(true);

  const loadingSteps = [
    'CCTV SYSTEM INITIALIZING...',
    'Loading AI Analysis Module...',
    'Processing Video Data...',
    'Analyzing Person Behavior...',
    'Analyzing Viewer Responses...',
    'Generating Results...',
    'SYSTEM READY'
  ];

  useEffect(() => {
    const stepInterval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev < loadingSteps.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(stepInterval);
  }, []);

  useEffect(() => {
    if (currentStep < loadingSteps.length) {
      const text = loadingSteps[currentStep];
      let index = 0;
      setDisplayText('');

      const typeInterval = setInterval(() => {
        setDisplayText(prev => {
          if (index < text.length) {
            index++;
            return text.substring(0, index);
          }
          clearInterval(typeInterval);
          return text;
        });
      }, 50);

      return () => clearInterval(typeInterval);
    }
  }, [currentStep]);

  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 500);

    return () => clearInterval(cursorInterval);
  }, []);

  useEffect(() => {
    if (currentStep === loadingSteps.length - 1) {
      const timer = setTimeout(() => {
        onComplete();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [currentStep, onComplete]);

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center overflow-hidden">
      {/* CRT 모니터 효과 */}
      <div className="absolute inset-0 bg-gradient-to-b from-green-900/20 to-transparent" />
      <div className="absolute inset-0 bg-black/50 animate-pulse" />
      
      {/* 스캔라인 효과 */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-green-500/5 to-transparent animate-pulse" />
      
      {/* 메인 콘텐츠 */}
      <div className="relative z-10 text-green-400 font-mono text-lg">
        <div className="bg-black/80 p-8 rounded-lg border border-green-500/30 shadow-2xl">
          <div className="flex items-center">
            <span className="text-green-400 font-bold">
              {displayText}
              {showCursor && <span className="animate-pulse">|</span>}
            </span>
          </div>
          
          {/* 진행 바 */}
          <div className="mt-4 w-full bg-green-900/30 rounded-full h-2">
            <div 
              className="bg-green-400 h-2 rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${((currentStep + 1) / loadingSteps.length) * 100}%` }}
            />
          </div>
          
          {/* 시스템 정보 */}
          <div className="mt-4 text-green-500/70 text-sm">
            <div>System: CCTV Analysis v2.1</div>
            <div>Status: {currentStep < loadingSteps.length - 1 ? 'Processing...' : 'Ready'}</div>
          </div>
        </div>
      </div>
      
      {/* 깜빡임 효과 */}
      <div className="absolute inset-0 bg-white/5 animate-pulse" />
    </div>
  );
};

export default CCTVLoading;
