'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';

export default function AIChat() {
  const router = useRouter();
  const [chatMessages, setChatMessages] = useState<Array<{role: string, content: string}>>([]);
  const [currentTurn, setCurrentTurn] = useState(0);
  const [userInput, setUserInput] = useState('');

  // AI 질문 더미 데이터 - useMemo로 최적화
  const aiQuestions = useMemo(() => [
    "이 사람은 무엇을 하고 있나요?",
    "어떤 행동을 하고 있나요?",
    "이 사람의 감정 상태는 어떠한가요?"
  ], []);

  // AI 질문 자동 표시
  useEffect(() => {
    if (currentTurn < 3) {
      const timer = setTimeout(() => {
        const newMessage = {
          role: 'assistant',
          content: aiQuestions[currentTurn]
        };
        setChatMessages(prev => [...prev, newMessage]);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [currentTurn, aiQuestions]);

  // 3턴 완료 시 분석 결과로 전환
  useEffect(() => {
    if (currentTurn >= 3) {
      const timer = setTimeout(() => {
        router.push('/analysis');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [currentTurn, router]);

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
        <div className="absolute top-4 left-4 text-white font-mono text-sm z-20">
          <div>현재 페이지: ai-chat</div>
          <div>AI 채팅 화면</div>
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
    </div>
  );
}
