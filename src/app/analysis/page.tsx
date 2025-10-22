'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Analysis() {
  const router = useRouter();
  const [analysisResults, setAnalysisResults] = useState<{
    trackedPersonAnalysis: string;
    viewerAnalysis: string;
  } | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<any>(null);

  // 분석 결과 로드
  useEffect(() => {
    // localStorage에서 분석 데이터 로드
    const storedAnalysis = localStorage.getItem('analysisData');
    const storedPerson = localStorage.getItem('selectedPerson');
    
    if (storedAnalysis) {
      try {
        const analysisData = JSON.parse(storedAnalysis);
        setAnalysisResults(analysisData);
      } catch (error) {
        console.error('분석 데이터 파싱 오류:', error);
        // 오류 시 더미 데이터 사용
        setAnalysisResults({
          trackedPersonAnalysis: "이 사람은 편의점 앞에서 휴식을 취하고 있는 것으로 보입니다. 혼자 앉아 있는 모습에서 고독감이나 피로감을 느끼고 있을 수 있습니다.",
          viewerAnalysis: "관람자는 이 사람의 상황에 공감하고 있으며, 도시 생활의 피로와 고독감에 대해 깊이 생각하고 있습니다."
        });
      }
    } else {
      // 분석 데이터가 없으면 더미 데이터 사용
      setAnalysisResults({
        trackedPersonAnalysis: "이 사람은 편의점 앞에서 휴식을 취하고 있는 것으로 보입니다. 혼자 앉아 있는 모습에서 고독감이나 피로감을 느끼고 있을 수 있습니다.",
        viewerAnalysis: "관람자는 이 사람의 상황에 공감하고 있으며, 도시 생활의 피로와 고독감에 대해 깊이 생각하고 있습니다."
      });
    }

    if (storedPerson) {
      try {
        setSelectedPerson(JSON.parse(storedPerson));
      } catch (error) {
        console.error('선택된 인물 데이터 파싱 오류:', error);
      }
    }
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
          {selectedPerson && (
            <div className="text-white/60 text-xs mb-3">
              <div>객체 ID: {selectedPerson.id}</div>
              <div>위치: ({Math.round(selectedPerson.x)}, {Math.round(selectedPerson.y)})</div>
              <div>움직임: {selectedPerson.isMoving ? '움직임 감지됨' : '정지 상태'}</div>
            </div>
          )}
          <div className="text-white/80 text-sm leading-relaxed">
            {analysisResults ? analysisResults.trackedPersonAnalysis : "분석 중..."}
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