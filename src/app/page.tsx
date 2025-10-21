'use client';

import { useState, useEffect } from 'react';

export default function TrackingExhibition() {
  const [currentStep, setCurrentStep] = useState('tracking_video');
  const [chatMessages, setChatMessages] = useState<Array<{role: string, content: string}>>([]);
  const [currentTurn, setCurrentTurn] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [analysisResults, setAnalysisResults] = useState([
    {
      subjectType: 'tracked_person',
      analysisText: '이 사람은 공원에서 혼자 걷고 있는 것으로 보입니다. 천천히 걸으며 주변을 둘러보는 행동을 보여주고 있습니다. 혼자만의 시간을 즐기고 있는 것 같습니다.'
    },
    {
      subjectType: 'viewer',
      analysisText: '관람자는 매우 집중적으로 영상을 관찰하고 있습니다. 세부사항에 주의를 기울이며, 분석적 사고를 보여주고 있습니다.'
    }
  ]);

  // AI 질문 더미 데이터
  const aiQuestions = [
    "이 사람은 무엇을 하고 있나요?",
    "어떤 행동을 하고 있나요?",
    "이 사람의 감정 상태는 어떠한가요?"
  ];

  // AI 질문 자동 표시
  useEffect(() => {
    if (currentStep === 'ai_chat' && currentTurn < 3) {
      const timer = setTimeout(() => {
        const newMessage = {
          role: 'assistant',
          content: aiQuestions[currentTurn]
        };
        setChatMessages(prev => [...prev, newMessage]);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [currentStep, currentTurn]);

  // 3턴 완료 시 분석 결과로 전환
  useEffect(() => {
    if (currentStep === 'ai_chat' && currentTurn >= 3) {
      const timer = setTimeout(() => {
        setCurrentStep('analysis_results');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [currentTurn, currentStep]);

  // 채팅 메시지 전송
  const handleSendMessage = () => {
    if (userInput.trim()) {
      const newMessage = {
        role: 'user',
        content: userInput
      };
      setChatMessages(prev => [...prev, newMessage]);
      setUserInput('');
      setCurrentTurn(prev => prev + 1);
    }
  };

  // Enter 키로 메시지 전송
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  // 1. 트래킹 영상 화면
  if (currentStep === 'tracking_video') {
    return (
      <div className="w-full h-screen bg-black aspect-[9/16] mx-auto relative overflow-hidden">
        {/* 영상 */}
        <video 
          className="w-full h-full object-cover"
          autoPlay 
          loop 
          muted
        >
          <source src="/1.mp4" type="video/mp4" />
        </video>
        
        {/* 디지털 오버레이 */}
        <div className="absolute top-4 left-4 text-white font-mono text-sm z-10">
          <div className="animate-pulse">CAM_01 | 01/01/24 14:30:15</div>
          <div className="animate-pulse delay-100">TRACKING: ACTIVE</div>
        </div>
        
        <div className="absolute top-4 right-4 text-white font-mono text-sm z-10">
          <div className="animate-pulse">SUBJECT_DETECTED</div>
          <div className="animate-pulse delay-200">CONFIDENCE: 0.95</div>
        </div>
        
        {/* 바운딩 박스 */}
        <div className="absolute top-1/3 left-1/4 w-32 h-40 border-2 border-red-500 animate-pulse-box z-20">
          <div className="absolute -top-6 left-0 text-red-500 text-xs font-mono">
            SUBJECT_01
          </div>
          <div className="absolute -bottom-6 right-0 text-red-500 text-xs font-mono">
            CONF: 0.95
          </div>
        </div>
        
        {/* 스캔라인 */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent animate-scan-line opacity-60"></div>
        </div>
        
        {/* 자전거 타는 사람 클릭 영역 */}
        <div 
          className="absolute bottom-1/3 left-1/2 transform -translate-x-1/2 w-24 h-32 border-2 border-red-500 animate-pulse-box z-30 cursor-pointer hover:bg-red-500/20 transition-colors"
          onClick={() => setCurrentStep('enlarged_video')}
        >
          <div className="absolute -top-6 left-0 text-red-500 text-xs font-mono">
            CYCLIST_01
          </div>
          <div className="absolute -bottom-6 right-0 text-red-500 text-xs font-mono">
            CONF: 0.95
          </div>
          {/* 클릭 안내 */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-white text-xs font-mono animate-pulse">
              CLICK CYCLIST
            </div>
          </div>
        </div>
        
        {/* 클릭 안내 */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white font-mono text-lg animate-pulse z-10">
          CLICK ON THE CYCLIST TO ANALYZE
        </div>
      </div>
    );
  }

  // 2. 확대된 영상 화면
  if (currentStep === 'enlarged_video') {
    return (
      <div className="w-full h-screen bg-black aspect-[9/16] mx-auto relative overflow-hidden">
        {/* 영상 */}
        <video 
          className="w-full h-full object-cover cursor-pointer"
          autoPlay 
          loop 
          muted
          onClick={() => setCurrentStep('ai_chat')}
        >
          <source src="/1.mp4" type="video/mp4" />
        </video>
        
        {/* 디지털 분석 오버레이 */}
        <div className="absolute top-4 left-4 text-white font-mono text-sm z-10">
          <div className="animate-pulse">ANALYSIS_MODE</div>
          <div className="animate-pulse delay-100">ZOOM: 2.5x</div>
        </div>
        
        <div className="absolute top-4 right-4 text-white font-mono text-sm z-10">
          <div className="animate-pulse">DETAILED_SCAN</div>
          <div className="animate-pulse delay-200">PROCESSING...</div>
        </div>
        
        {/* 녹색 타겟 크로스헤어 */}
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <div className="w-24 h-24 border-4 border-green-500 rounded-full animate-ping">
            <div className="w-full h-full border-2 border-green-400 rounded-full animate-pulse"></div>
          </div>
        </div>
        
        {/* 분석 데이터 */}
        <div className="absolute bottom-20 left-4 text-green-400 font-mono text-xs z-10">
          <div>MOTION_DETECTED: YES</div>
          <div>BEHAVIOR_PATTERN: WALKING</div>
          <div>EMOTION_LEVEL: NEUTRAL</div>
        </div>
        
        {/* 클릭 안내 */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white font-mono text-lg animate-pulse z-10">
          CLICK TO START AI CHAT
        </div>
      </div>
    );
  }

  // 3. AI 채팅 화면
  if (currentStep === 'ai_chat') {
    return (
      <div className="w-full h-screen bg-black aspect-[9/16] mx-auto flex flex-col">
        {/* 상단: 확대 영상 */}
        <div className="flex-1 relative">
          <video 
            className="w-full h-full object-cover"
            autoPlay 
            loop 
            muted
          >
            <source src="/1.mp4" type="video/mp4" />
          </video>
          
          {/* 영상 오버레이 */}
          <div className="absolute top-4 left-4 text-white font-mono text-sm z-10">
            <div className="animate-pulse">AI_ANALYSIS_MODE</div>
            <div className="animate-pulse delay-100">TURN: {currentTurn + 1}/3</div>
          </div>
        </div>
        
        {/* 하단: AI 채팅 */}
        <div className="h-1/2 bg-gray-900 p-4 flex flex-col">
          <div className="flex-1 overflow-y-auto mb-4 space-y-2">
            {chatMessages.map((msg, index) => (
              <div key={index} className={`${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                <div className={`inline-block p-3 rounded-lg max-w-xs ${
                  msg.role === 'user' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-700 text-gray-100'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex gap-2">
            <input 
              type="text" 
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1 p-3 bg-gray-800 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
              placeholder="답변을 입력하세요..."
              disabled={currentTurn >= 3}
            />
            <button 
              onClick={handleSendMessage}
              disabled={!userInput.trim() || currentTurn >= 3}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
            >
              전송
            </button>
          </div>
          
          {currentTurn >= 3 && (
            <div className="text-center text-green-400 font-mono text-sm mt-2 animate-pulse">
              분석 결과를 생성하고 있습니다...
            </div>
          )}
        </div>
      </div>
    );
  }

  // 4. 분석 결과 화면 (카드)
  if (currentStep === 'analysis_results') {
    return (
      <div className="w-full h-screen bg-gray-100 aspect-[9/16] mx-auto p-4">
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
          
          {/* 인쇄 버튼 */}
          <div className="mt-6 text-center">
            <button 
              className="px-8 py-4 bg-yellow-400 text-black rounded-lg font-bold text-lg hover:bg-yellow-500 transition-colors shadow-lg"
              onClick={() => {
                alert('인쇄 요청이 전송되었습니다.\n카드가 프린터로 전송됩니다.');
              }}
            >
              🖨️ 인쇄하기
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}