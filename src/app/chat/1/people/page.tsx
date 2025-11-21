'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface ChatMessage {
  role: string;
  content: string;
}

export default function ChatPoster1People() {
  const router = useRouter();
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentTurn, setCurrentTurn] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const selectedPoster = '1';
  const selectedType = 'people';

  const handleAIMessage = useCallback(async () => {
    if (chatMessages.length > 0) {
      const lastMessage = chatMessages[chatMessages.length - 1];
      if (lastMessage.role === 'assistant') return;
    }
    
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
          selectedPerson: null,
          selectedType: selectedType,
          selectedPoster: selectedPoster
        }),
      });

      const data = await response.json();
      
      // 에러 메시지 필터링
      const errorMessages = [
        "죄송합니다. 잠시 후 다시 시도해주세요.",
        "AI 서비스에 일시적인 문제가 있습니다. 잠시만 기다려주세요.",
        "네트워크 연결을 확인해주세요.",
        "죄송합니다. AI 서비스에 일시적인 문제가 있습니다. 잠시 후 다시 시도해주세요."
      ];
      
      // 에러가 있거나 에러 메시지인 경우 콘솔에만 표시하고 사용자에게는 표시하지 않음
      if (data.error) {
        console.error('API 에러:', data.error);
        // 에러 메시지를 사용자에게 표시하지 않음
      } else if (data.content && !errorMessages.includes(data.content) && currentTurn < 4) {
        // 4턴 미만일 때만 메시지 표시 (4턴은 백그라운드 처리)
        const newMessage = {
          role: 'assistant',
          content: data.content
        };
        setChatMessages(prev => [...prev, newMessage]);
      }
      
      // 분석 데이터가 있으면 저장 (4턴에서 백그라운드로 처리)
      if (data.analysis) {
        localStorage.setItem('analysisData', JSON.stringify(data.analysis));
        console.log('✅ 분석 데이터 저장됨');
      }
    } catch (error) {
      console.error('AI 메시지 처리 오류:', error);
      // 에러는 콘솔에만 표시, 사용자에게는 표시하지 않음
    } finally {
      setIsLoading(false);
    }
  }, [chatMessages, currentTurn, selectedType, selectedPoster, router]);

  useEffect(() => {
    if (currentTurn === 0 && chatMessages.length === 0) {
      const timer = setTimeout(() => {
        handleAIMessage();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [currentTurn, handleAIMessage, chatMessages.length]);

  useEffect(() => {
    if (currentTurn > 0 && currentTurn < 4 && chatMessages.length > 0) {
      const lastMessage = chatMessages[chatMessages.length - 1];
      if (lastMessage.role === 'user') {
        const timer = setTimeout(() => {
          handleAIMessage();
        }, 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [currentTurn, chatMessages, handleAIMessage]);

  const handleSendMessage = async () => {
    if (!userInput.trim()) return;
    
    const newMessage = {
      role: 'user',
      content: userInput
    };
    
    // 메시지 추가
    setChatMessages(prev => [...prev, newMessage]);
    setUserInput('');
    
    // currentTurn 증가
    const newTurn = currentTurn + 1;
    setCurrentTurn(newTurn);
    
    console.log('🔍 답변 전송:', { 
      이전턴: currentTurn, 
      다음턴: newTurn,
      답변내용: newMessage.content.substring(0, 30)
    });
    
    // 4번째 답변인지 확인 (newTurn === 4)
    if (newTurn === 4) {
      console.log('✅✅✅ 4번째 답변 확인! 분석 시작!');
      
      // 즉시 "분석이 완료되었습니다" 메시지 추가
      setChatMessages(prev => {
        console.log('📝 메시지 추가 중...');
        return [...prev, {
          role: 'assistant',
          content: '분석이 완료되었습니다'
        }];
      });
      
      // 3초 후 이동
      console.log('⏰ 타이머 시작: 3초 후 이동');
      setTimeout(() => {
        console.log('🚀🚀🚀 이동 시작!');
        window.location.href = '/analysis';
      }, 3000);
      
      // API는 별도로
      fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...chatMessages, newMessage],
          turnCount: 4,
          selectedPerson: null,
          selectedType: selectedType,
          selectedPoster: selectedPoster
        }),
      })
      .then(res => res.json())
      .then(data => {
        if (data.analysis) {
          localStorage.setItem('analysisData', JSON.stringify(data.analysis));
          console.log('✅ 분석 데이터 저장');
        }
      })
      .catch(err => console.error('API 실패:', err));
    }
  };

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
        >
          <source src="/2.mp4" type="video/mp4" />
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
              }`}>
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

