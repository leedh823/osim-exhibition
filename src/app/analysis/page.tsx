'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Analysis() {
  const router = useRouter();
  const [analysisResults, setAnalysisResults] = useState<{
    personAnalysis: string;
    viewerAnalysis: string;
  } | null>(null);

  // 분석 결과 생성 (더미 데이터)
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnalysisResults({
        personAnalysis: "이 사람은 편의점 앞에서 휴식을 취하고 있는 것으로 보입니다. 혼자 앉아 있는 모습에서 고독감이나 피로감을 느끼고 있을 수 있습니다. 주변 환경을 둘러보는 행동으로 보아 잠시 휴식을 취한 후 다시 일상으로 돌아갈 준비를 하고 있는 것 같습니다.",
        viewerAnalysis: "관람자는 이 사람의 상황에 공감하고 있으며, 도시 생활의 피로와 고독감에 대해 깊이 생각하고 있습니다. 타인의 상황을 세심하게 관찰하고 분석하는 능력이 뛰어나며, 사회적 상황에 대한 이해도가 높습니다."
      });
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // 인쇄 기능
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="w-full h-screen bg-black aspect-[16/9] mx-auto relative">
      {/* 디버깅 정보 */}
      <div className="absolute top-4 left-4 text-white font-mono text-sm z-20 bg-black/80 p-3 rounded-lg border border-white/20">
        <div className="mb-1">현재 페이지: analysis</div>
        <div className="mb-1">분석 결과 화면</div>
      </div>

      {/* 분석 결과 카드들 */}
      <div className="flex justify-center items-center h-full p-8 space-x-8">
        {/* 카드 1: 추적된 사람 분석 */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 w-80 h-96 border border-white/20">
          <h3 className="text-white text-lg font-bold mb-4">추적된 사람 분석</h3>
          <div className="text-white/80 text-sm leading-relaxed">
            {analysisResults ? analysisResults.personAnalysis : "분석 중..."}
          </div>
        </div>

        {/* 카드 2: 관람자 분석 */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 w-80 h-96 border border-white/20">
          <h3 className="text-white text-lg font-bold mb-4">관람자 분석</h3>
          <div className="text-white/80 text-sm leading-relaxed">
            {analysisResults ? analysisResults.viewerAnalysis : "분석 중..."}
          </div>
        </div>
      </div>

      {/* 인쇄 버튼 */}
      {analysisResults && (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <button
            onClick={handlePrint}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            인쇄하기
          </button>
        </div>
      )}
    </div>
  );
}