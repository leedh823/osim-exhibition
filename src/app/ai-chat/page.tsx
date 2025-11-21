'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface ChatMessage {
  role: string;
  content: string;
}


export default function AIChat() {
  const router = useRouter();
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentTurn, setCurrentTurn] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<{
    id: string;
    label: string;
    x: number;
    y: number;
    confidence: number;
    isMoving: boolean;
    speed?: number;
  } | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedPoster, setSelectedPoster] = useState<string | null>(null);

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
          selectedPerson: selectedPerson,
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
        
        // 4번째 대답 후 (currentTurn === 4) 분석 시작 메시지가 표시되면 분석 페이지로 이동
        if (currentTurn === 4 && (data.isAnalysis || data.content.includes('분석을 시작하겠습니다'))) {
          // 분석 데이터가 없어도 분석 페이지로 이동 (API 키가 없을 수 있음)
          setTimeout(() => {
            router.push('/analysis');
          }, 2000); // 2초 후 이동
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
  }, [chatMessages, currentTurn, selectedPerson, selectedType, selectedPoster, router]);

  // 선택된 인물 정보 및 타입 로드
  useEffect(() => {
    const storedPerson = localStorage.getItem('selectedPerson');
    const storedType = localStorage.getItem('selectedType');
    const storedPoster = localStorage.getItem('selectedPoster');
    
    console.log('📥 localStorage에서 로드:', {
      storedPerson: !!storedPerson,
      storedType,
      storedPoster,
      storedTypeType: typeof storedType,
      storedPosterType: typeof storedPoster
    });
    
    if (storedPerson) {
      try {
        setSelectedPerson(JSON.parse(storedPerson));
      } catch (e) {
        console.error('selectedPerson 파싱 오류:', e);
      }
    }
    if (storedType) {
      const typeValue = storedType.trim();
      setSelectedType(typeValue);
      console.log('✅ selectedType 설정:', typeValue);
    } else {
      console.warn('⚠️ selectedType이 localStorage에 없음');
    }
    if (storedPoster) {
      const posterValue = storedPoster.trim();
      setSelectedPoster(posterValue);
      console.log('✅ selectedPoster 설정:', posterValue);
    } else {
      console.warn('⚠️ selectedPoster가 localStorage에 없음');
    }
  }, []);

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

  // 4개 질문 완료 시 (5턴) 분석 시작
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

  // 6턴 완료 시 분석 결과로 전환 (3초 후) - handleAIMessage에서 처리하므로 제거

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
      {/* 전체 화면: 2.mp4 영상 */}
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
      
      {/* 오른쪽 50%: AI 채팅 인터페이스 (불투명도 적용) */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-black/60 backdrop-blur-sm">
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

