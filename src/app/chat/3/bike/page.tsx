'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface ChatMessage {
  role: string;
  content: string;
}

export default function ChatPoster3Bike() {
  const router = useRouter();
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentTurn, setCurrentTurn] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const selectedPoster = '3';
  const selectedType = 'bike';

  // AI 메시지 처리
  const handleAIMessage = useCallback(async () => {
    // 이미 AI 메시지가 마지막이면 중복 실행 방지
    if (chatMessages.length > 0) {
      const lastMessage = chatMessages[chatMessages.length - 1];
      if (lastMessage.role === 'assistant') return;
    }
    
    setIsLoading(true);
    
    // 디버깅: 전송되는 값 확인
    console.log('📤 API 요청 데이터:', {
      turnCount: currentTurn,
      selectedType,
      selectedPoster,
      selectedTypeType: typeof selectedType,
      selectedPosterType: typeof selectedPoster,
      chatMessagesLength: chatMessages.length
    });
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: chatMessages,
          turnCount: currentTurn,
          selectedPerson: null,
          selectedType: selectedType,
          selectedPoster: selectedPoster
        }),
      });

      const data = await response.json();
      
      // content가 있으면 항상 사용 (API 키가 없어도 질문은 반환됨)
      if (data.content) {
        const newMessage = {
          role: 'assistant',
          content: data.content
        };
        setChatMessages(prev => [...prev, newMessage]);
        
        // 분석 데이터가 있으면 저장
        if (data.analysis) {
          console.log('분석 데이터 저장:', data.analysis);
          localStorage.setItem('analysisData', JSON.stringify(data.analysis));
        }
        
        // 4번째 대답 후 (currentTurn === 4) 분석 시작 메시지가 표시되면 즉시 3초 타이머 시작
        if (currentTurn === 4 && (data.isAnalysis || data.content.includes('분석을 시작하겠습니다'))) {
          // 분석 데이터가 없어도 분석 페이지로 이동 (API 키가 없을 수 있음)
          // 메시지가 표시되면 즉시 3초 타이머 시작
          setTimeout(() => {
            window.location.href = '/analysis';
          }, 3000); // 3초 후 이동
        }
      } else if (data.error) {
        // content가 없고 error만 있는 경우 (드물지만 방어적 처리)
        console.error('API 오류:', data.error);
        const errorMessage = {
          role: 'assistant',
          content: data.error || "죄송합니다. AI 서비스에 일시적인 문제가 있습니다. 잠시 후 다시 시도해주세요."
        };
        setChatMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('AI 메시지 처리 오류:', error);
      
      // API 오류 시 사용자에게 알림
      const errorMessage = {
        role: 'assistant',
        content: "죄송합니다. AI 서비스에 일시적인 문제가 있습니다. 잠시 후 다시 시도해주세요."
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [chatMessages, currentTurn, selectedType, selectedPoster, router]);

  // AI 질문 자동 표시 (첫 번째 질문만)
  useEffect(() => {
    if (currentTurn === 0 && chatMessages.length === 0) {
      const timer = setTimeout(() => {
        handleAIMessage();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [currentTurn, handleAIMessage, chatMessages.length]);

  // 사용자 답변 후 AI 다음 질문 생성 (1-4턴: 4개 질문)
  useEffect(() => {
    if (currentTurn > 0 && currentTurn < 4 && chatMessages.length > 0) {
      // 사용자 메시지가 마지막인지 확인
      const lastMessage = chatMessages[chatMessages.length - 1];
      if (lastMessage.role === 'user') {
        const timer = setTimeout(() => {
          handleAIMessage();
        }, 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [currentTurn, chatMessages, handleAIMessage]);

  // 4개 질문 완료 시 (currentTurn === 4) 분석 시작
  useEffect(() => {
    if (currentTurn === 4 && chatMessages.length > 0) {
      const lastMessage = chatMessages[chatMessages.length - 1];
      if (lastMessage.role === 'user') {
        const timer = setTimeout(() => {
          handleAIMessage();
        }, 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [currentTurn, chatMessages, handleAIMessage]);

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
      
      // AI 응답을 위한 추가 로직은 useEffect에서 처리됨
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
      <div className="absolute top-0 left-0 w-full h-full">
        <video 
          className="w-full h-full object-cover"
          autoPlay 
          loop 
          playsInline
          controls={false}
          preload="auto"
        >
          <source src="/3.mp4" type="video/mp4" />
        </video>
      </div>
      
      <div className="absolute top-0 right-0 w-1/2 h-full bg-black/60 backdrop-blur-sm">
        <div className="h-3/4 overflow-y-auto p-4 space-y-3">
          {chatMessages.map((msg, index) => (
            <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs p-3 rounded-lg ${
                msg.role === 'user' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white/20 text-white backdrop-blur-sm'
              }`}
              style={{ fontSize: 'clamp(14px, 1.2vw, 24px)' }}
              >
                {msg.content}
              </div>
            </div>
          ))}
        </div>
        
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
              style={{ fontSize: 'clamp(14px, 1.2vw, 24px)' }}
            />
            <button 
              onClick={handleSendMessage}
              disabled={!userInput.trim() || currentTurn >= 5 || isLoading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
              style={{ fontSize: 'clamp(14px, 1.2vw, 24px)' }}
            >
              {isLoading ? 'AI 응답 중...' : '전송'}
            </button>
          </div>
          
          {currentTurn >= 5 && (
            <div className="text-center text-green-400 font-mono mt-2 animate-pulse" style={{ fontSize: 'clamp(12px, 1vw, 20px)' }}>
              분석 결과를 생성하고 있습니다...
            </div>
          )}
          
          {isLoading && (
            <div className="text-center text-blue-400 font-mono mt-2 animate-pulse" style={{ fontSize: 'clamp(12px, 1vw, 20px)' }}>
              AI가 생각하고 있습니다...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
