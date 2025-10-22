'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface ChatMessage {
  role: string;
  content: string;
}

interface AnalysisData {
  trackedPersonAnalysis: string;
  viewerAnalysis: string;
}

export default function AIChat() {
  const router = useRouter();
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentTurn, setCurrentTurn] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<any>(null);
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);

  // 선택된 인물 정보 로드
  useEffect(() => {
    const storedPerson = localStorage.getItem('selectedPerson');
    if (storedPerson) {
      setSelectedPerson(JSON.parse(storedPerson));
    }
  }, []);

  // AI 질문 자동 표시
  useEffect(() => {
    if (currentTurn < 3) {
      const timer = setTimeout(() => {
        handleAIMessage();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [currentTurn]);

  // 5턴 완료 시 분석 결과로 전환
  useEffect(() => {
    if (currentTurn >= 5) {
      const timer = setTimeout(() => {
        router.push('/analysis');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [currentTurn, router]);

  // AI 메시지 처리
  const handleAIMessage = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: chatMessages,
          turnCount: currentTurn,
          selectedPerson: selectedPerson
        }),
      });

      const data = await response.json();
      
      if (data.error) {
        console.error('API 오류:', data.error);
        // 오류 시 더미 메시지 사용
        const dummyQuestions = [
          "이 사람은 무엇을 하고 있나요?",
          "어떤 행동을 하고 있나요?",
          "이 사람의 감정 상태는 어떠한가요?"
        ];
        
        const newMessage = {
          role: 'assistant',
          content: dummyQuestions[currentTurn] || "분석을 시작하겠습니다..."
        };
        setChatMessages(prev => [...prev, newMessage]);
      } else {
        const newMessage = {
          role: 'assistant',
          content: data.content
        };
        setChatMessages(prev => [...prev, newMessage]);
        
        // 분석 데이터가 있으면 저장
        if (data.analysis) {
          setAnalysisData(data.analysis);
          localStorage.setItem('analysisData', JSON.stringify(data.analysis));
        }
      }
    } catch (error) {
      console.error('AI 메시지 처리 오류:', error);
      // 오류 시 더미 메시지 사용
      const dummyQuestions = [
        "이 사람은 무엇을 하고 있나요?",
        "어떤 행동을 하고 있나요?",
        "이 사람의 감정 상태는 어떠한가요?"
      ];
      
      const newMessage = {
        role: 'assistant',
        content: dummyQuestions[currentTurn] || "분석을 시작하겠습니다..."
      };
      setChatMessages(prev => [...prev, newMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // 채팅 메시지 전송
  const handleSendMessage = async () => {
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

  return (
    <div className="w-full h-screen bg-black aspect-[16/9] mx-auto relative">
      {/* 왼쪽 50%: 2.mp4 영상 */}
      <div className="absolute top-0 left-0 w-1/2 h-full">
        <video 
          className="w-full h-full object-cover"
          autoPlay 
          loop 
          muted
          playsInline
          controls={false}
        >
          <source src="/2.mp4" type="video/mp4" />
        </video>
        
        {/* 디버깅 정보 */}
        <div className="absolute top-4 left-4 text-white font-mono text-sm z-20 bg-black/80 p-3 rounded-lg border border-white/20">
          <div className="mb-1">현재 페이지: ai-chat</div>
          <div className="mb-1">CCTV 화면 분석</div>
          {selectedPerson && (
            <>
              <div className="mb-1">선택된 인물: {selectedPerson.label}</div>
              <div className="mb-1">위치: ({Math.round(selectedPerson.x)}, {Math.round(selectedPerson.y)})</div>
              <div className="mb-1">움직임: {selectedPerson.isMoving ? '움직임 감지됨' : '정지 상태'}</div>
              <div>신뢰도: {(selectedPerson.confidence * 100).toFixed(1)}%</div>
            </>
          )}
        </div>
      </div>
      
      {/* 오른쪽 50%: AI 채팅 인터페이스 */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-black/30 backdrop-blur-sm">
        {/* 채팅 메시지 영역 */}
        <div className="h-3/4 overflow-y-auto p-4 space-y-3">
          {chatMessages.map((msg, index) => (
            <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs p-3 rounded-lg ${
                msg.role === 'user' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white/20 text-white backdrop-blur-sm'
              }`}>
                {msg.content}
              </div>
            </div>
          ))}
        </div>
        
        {/* 입력 영역 */}
        <div className="h-1/4 p-4 border-t border-white/20">
          <div className="flex gap-2">
            <input 
              type="text" 
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1 p-3 bg-white/20 text-white rounded-lg border border-white/30 focus:border-blue-400 focus:outline-none backdrop-blur-sm placeholder-white/60"
              placeholder="답변을 입력하세요..."
              disabled={currentTurn >= 5 || isLoading}
            />
            <button 
              onClick={handleSendMessage}
              disabled={!userInput.trim() || currentTurn >= 5 || isLoading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'AI 응답 중...' : '전송'}
            </button>
          </div>
          
          {currentTurn >= 5 && (
            <div className="text-center text-green-400 font-mono text-sm mt-2 animate-pulse">
              분석 결과를 생성하고 있습니다...
            </div>
          )}
          
          {isLoading && (
            <div className="text-center text-blue-400 font-mono text-sm mt-2 animate-pulse">
              AI가 생각하고 있습니다...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
