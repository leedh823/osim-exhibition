'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Analysis() {
  const router = useRouter();
  const [analysisResults] = useState([
    {
      subjectType: 'tracked_person',
      analysisText: '이 사람은 공원에서 혼자 걷고 있는 것으로 보입니다. 천천히 걸으며 주변을 둘러보는 행동을 보여주고 있습니다. 혼자만의 시간을 즐기고 있는 것 같습니다.'
    },
    {
      subjectType: 'viewer',
      analysisText: '관람자는 매우 집중적으로 영상을 관찰하고 있습니다. 세부사항에 주의를 기울이며, 분석적 사고를 보여주고 있습니다.'
    }
  ]);

  const handlePrint = () => {
    alert('인쇄 요청이 전송되었습니다.\n카드가 프린터로 전송됩니다.');
  };

  const handleRestart = () => {
    router.push('/');
  };

  return (
    <div className="w-full h-screen bg-gray-100 aspect-[16/9] mx-auto p-4">
      <div className="h-full flex flex-col">
        {/* 제목 */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">분석 결과</h1>
          <p className="text-gray-600 text-sm">카드를 클릭하여 자세한 분석을 확인하세요</p>
        </div>
        
        {/* 카드 그리드 */}
        <div className="grid grid-cols-2 gap-4 flex-1">
          {/* 카드 1: 추적된 사람 */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden cursor-pointer hover:shadow-xl transition-shadow">
            <div className="h-1/2 bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
              <div className="text-white text-center">
                <div className="text-4xl mb-2">👤</div>
                <div className="text-sm font-mono">추적된 사람</div>
              </div>
            </div>
            <div className="h-1/2 p-4 text-xs">
              <h3 className="font-bold mb-2 text-gray-800">행동 분석</h3>
              <p className="text-gray-600 leading-relaxed">
                {analysisResults[0]?.analysisText}
              </p>
            </div>
          </div>
          
          {/* 카드 2: 관람자 */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden cursor-pointer hover:shadow-xl transition-shadow">
            <div className="h-1/2 bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center">
              <div className="text-white text-center">
                <div className="text-4xl mb-2">🎭</div>
                <div className="text-sm font-mono">관람자</div>
              </div>
            </div>
            <div className="h-1/2 p-4 text-xs">
              <h3 className="font-bold mb-2 text-gray-800">관찰 패턴</h3>
              <p className="text-gray-600 leading-relaxed">
                {analysisResults[1]?.analysisText}
              </p>
            </div>
          </div>
        </div>
        
        {/* 버튼 영역 */}
        <div className="mt-6 flex gap-4 justify-center">
          <button 
            className="px-8 py-4 bg-yellow-400 text-black rounded-lg font-bold text-lg hover:bg-yellow-500 transition-colors shadow-lg"
            onClick={handlePrint}
          >
            🖨️ 인쇄하기
          </button>
          <button 
            className="px-8 py-4 bg-blue-600 text-white rounded-lg font-bold text-lg hover:bg-blue-700 transition-colors shadow-lg"
            onClick={handleRestart}
          >
            🔄 다시 시작
          </button>
        </div>
      </div>
    </div>
  );
}
