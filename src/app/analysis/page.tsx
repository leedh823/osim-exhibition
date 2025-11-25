'use client';

import { useState, useEffect } from 'react';
import CCTVLoading from '@/components/CCTVLoading';
import AnalysisCard from '@/components/AnalysisCard';

export default function Analysis() {
  const [analysisResults, setAnalysisResults] = useState<{
    trackedPersonAnalysis: string;
    viewerAnalysis: string;
  } | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<{
    id: string;
    label: string;
    x: number;
    y: number;
    confidence: number;
    isMoving: boolean;
    speed?: number;
  } | null>(null);
  const [selectedPoster, setSelectedPoster] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 분석 결과 로드
  useEffect(() => {
    // localStorage에서 분석 데이터 로드
    const storedAnalysis = localStorage.getItem('analysisData');
    const storedPerson = localStorage.getItem('selectedPerson');
    const storedPoster = localStorage.getItem('selectedPoster');
    
    if (storedAnalysis) {
      try {
        const analysisData = JSON.parse(storedAnalysis);
        console.log('분석 데이터 로드:', analysisData);
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

    if (storedPoster) {
      setSelectedPoster(storedPoster);
    }
  }, []);

  const handleLoadingComplete = () => {
    setIsLoading(false);
  };

  if (isLoading) {
    return <CCTVLoading onComplete={handleLoadingComplete} />;
  }

  if (!analysisResults) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-xl">분석 데이터를 불러오는 중...</div>
      </div>
    );
  }

  return (
    <AnalysisCard 
      analysisData={analysisResults} 
      selectedPerson={selectedPerson}
      selectedPoster={selectedPoster}
    />
  );
}