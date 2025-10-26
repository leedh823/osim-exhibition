'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface ChatMessage {
  role: string;
  content: string;
}

export default function EnlargedVideo() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showChat, setShowChat] = useState(false);
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

  // 2번 영상 재생 (화면 로딩 완료 후에만 재생, 끝나면 다시 재생)
  useEffect(() => {
    if (videoRef.current) {
      const video = videoRef.current;
      
      const handleCanPlayThrough = () => {
        console.log('2번 영상 로딩 완료 - 재생 시작');
        video.play().catch(console.error);
      };
      
      const handleEnded = () => {
        console.log('2번 영상 재생 완료 - 다시 재생');
        video.currentTime = 0;
        video.play().catch(console.error);
      };
      
      const handlePlay = () => {
        console.log('2번 영상 재생 중...');
      };
      
      const handleLoadStart = () => {
        console.log('2번 영상 로딩 시작...');
      };
      
      const handleLoadedData = () => {
        console.log('2번 영상 데이터 로딩 완료');
      };
      
      video.addEventListener('loadstart', handleLoadStart);
      video.addEventListener('loadeddata', handleLoadedData);
      video.addEventListener('canplaythrough', handleCanPlayThrough);
      video.addEventListener('ended', handleEnded);
      video.addEventListener('play', handlePlay);
      
      return () => {
        video.removeEventListener('loadstart', handleLoadStart);
        video.removeEventListener('loadeddata', handleLoadedData);
        video.removeEventListener('canplaythrough', handleCanPlayThrough);
        video.removeEventListener('ended', handleEnded);
        video.removeEventListener('play', handlePlay);
      };
    }
  }, []);

  // AI 메시지 처리
  const handleAIMessage = useCallback(async () => {
    // 이미 AI 메시지가 마지막이면 중복 실행 방지
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
          selectedPerson: selectedPerson
        }),
      });

      const data = await response.json();
      
      if (data.error) {
        console.error('API 오류:', data.error);
        // API 오류 시 사용자에게 알림
        const errorMessage = {
          role: 'assistant',
          content: "죄송합니다. AI 서비스에 일시적인 문제가 있습니다. 잠시 후 다시 시도해주세요."
        };
        setChatMessages(prev => [...prev, errorMessage]);
      } else {
        const newMessage = {
          role: 'assistant',
          content: data.content
        };
        setChatMessages(prev => [...prev, newMessage]);
        
        // 분석 데이터가 있으면 저장
        if (data.analysis) {
          localStorage.setItem('analysisData', JSON.stringify(data.analysis));
          // 분석이 완료되면 currentTurn을 6으로 설정하여 페이지 전환 트리거
          setCurrentTurn(6);
        }
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
  }, [chatMessages, currentTurn, selectedPerson]);

  // 선택된 인물 정보 로드
  useEffect(() => {
    const storedPerson = localStorage.getItem('selectedPerson');
    if (storedPerson) {
      setSelectedPerson(JSON.parse(storedPerson));
    }
  }, []);

  // AI 질문 자동 표시 (첫 번째 질문만)
  useEffect(() => {
    if (showChat && currentTurn === 0 && chatMessages.length === 0) {
      const timer = setTimeout(() => {
        handleAIMessage();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [showChat, currentTurn, handleAIMessage, chatMessages.length]);

  // 사용자 답변 후 AI 다음 질문 생성 (1-5턴)
  useEffect(() => {
    if (showChat && currentTurn > 0 && currentTurn < 5 && chatMessages.length > 0) {
      // 사용자 메시지가 마지막인지 확인
      const lastMessage = chatMessages[chatMessages.length - 1];
      if (lastMessage.role === 'user') {
        const timer = setTimeout(() => {
          handleAIMessage();
        }, 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [showChat, currentTurn, chatMessages, handleAIMessage]);

  // 5턴 완료 시 6번째에서 분석 시작
  useEffect(() => {
    if (showChat && currentTurn === 5 && chatMessages.length > 0) {
      const lastMessage = chatMessages[chatMessages.length - 1];
      if (lastMessage.role === 'user') {
        const timer = setTimeout(() => {
          handleAIMessage();
        }, 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [showChat, currentTurn, chatMessages, handleAIMessage]);

  // 6턴 완료 시 분석 결과로 전환 (3초 후)
  useEffect(() => {
    if (showChat && currentTurn >= 6) {
      // 6턴에서 분석 시작 메시지를 보낸 후 3초 뒤에 페이지 전환
      const timer = setTimeout(() => {
        router.push('/analysis');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showChat, currentTurn, router]);

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

  const handleVideoClick = () => {
    console.log('2번 영상 클릭됨! 채팅 오버레이 표시');
    setShowChat(true);
  };

  return (
    <div className="w-full h-screen bg-black aspect-[16/9] mx-auto relative overflow-hidden">
      {/* 영상 */}
      <video 
        ref={videoRef}
        className="w-full h-full object-cover cursor-pointer"
        muted
        playsInline
        controls={false}
        onClick={handleVideoClick}
        onError={(e) => console.log('2.mp4 로딩 에러:', e)}
      >
        <source src="/2.mp4" type="video/mp4" />
      </video>
      
      
      {/* 클릭 안내 */}
      {!showChat && (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white font-mono text-lg animate-pulse z-10">
          CLICK TO START AI CHAT
        </div>
      )}

      {/* 채팅 오버레이 */}
      {showChat && (
        <div className="absolute top-0 right-0 w-1/2 h-full bg-black/60 backdrop-blur-sm z-20">
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
                 disabled={currentTurn >= 6 || isLoading}
               />
               <button 
                 onClick={handleSendMessage}
                 disabled={!userInput.trim() || currentTurn >= 6 || isLoading}
                 className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
               >
                 {isLoading ? 'AI 응답 중...' : '전송'}
               </button>
            </div>
            
            {currentTurn >= 6 && (
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
      )}
    </div>
  );
}
