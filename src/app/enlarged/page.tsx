'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import VideoTracker from '@/components/VideoTracker';
import { DetectedObject } from '@/utils/realObjectDetection';

interface ChatMessage {
  role: string;
  content: string;
}

export default function EnlargedVideo() {
  const router = useRouter();
  const [showChat, setShowChat] = useState(true); // 페이지 로드 시 바로 채팅 표시
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentTurn, setCurrentTurn] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<DetectedObject | null>(null);
  const [videoSrc, setVideoSrc] = useState('/2.mp4'); // 기본 영상
  const [isPoster3, setIsPoster3] = useState(false); // 포스터 3 여부

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
          // 분석이 완료되면 3초 후 페이지 전환
          setTimeout(() => {
            router.push('/analysis');
          }, 3000);
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
  }, [chatMessages, currentTurn, selectedPerson, router]);

  // 선택된 인물 정보 및 포스터 정보 로드
  useEffect(() => {
    const storedPerson = localStorage.getItem('selectedPerson');
    if (storedPerson) {
      setSelectedPerson(JSON.parse(storedPerson));
    }
    
    // 포스터 번호 확인하여 영상 경로 설정
    const selectedPoster = localStorage.getItem('selectedPoster');
    console.log('📋 선택된 포스터:', selectedPoster);
    if (selectedPoster === '1') {
      setVideoSrc('/poster video 1/2.mp4');
      setIsPoster3(false);
    } else if (selectedPoster === '2') {
      setVideoSrc('/poster video 2/2.mp4');
      setIsPoster3(false);
    } else if (selectedPoster === '3') {
      const poster3VideoSrc = '/poster video 3/4.mp4';
      console.log('🎬 포스터 3 영상 경로 설정:', poster3VideoSrc);
      setVideoSrc(poster3VideoSrc);
      setIsPoster3(true); // 포스터 3은 전체화면 레이아웃
    } else {
      setVideoSrc('/2.mp4'); // 기본 영상 (fallback)
      setIsPoster3(false);
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
    }
  };

  // Enter 키로 메시지 전송
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  // 트래킹 영역 클릭 핸들러 (사용하지 않지만 VideoTracker에 전달 필요)
  const handlePersonClick = (person: DetectedObject) => {
    // 클릭으로 채팅 시작하지 않음 - 페이지 로드 시 바로 표시
  };


  console.log('🎥 현재 영상 경로:', videoSrc);
  console.log('📐 포스터 3 여부:', isPoster3);

  return (
    <div className={`w-full h-screen bg-black aspect-[16/9] mx-auto relative overflow-hidden ${isPoster3 ? '' : 'flex'}`}>
      {/* 영상 영역 - 포스터 3은 전체화면, 나머지는 왼쪽 50% */}
      <div className={isPoster3 ? "w-full h-full relative z-10" : "w-1/2 h-full relative"}>
        <VideoTracker
          videoSrc={videoSrc}
          onPersonClick={handlePersonClick}
          className="w-full h-full"
          selectedPerson={selectedPerson}
          followPerson={false}
        />
      </div>
      
      {/* AI 채팅 영역 - 포스터 3은 오른쪽 오버레이, 나머지는 오른쪽 50% */}
      <div className={isPoster3 
        ? "absolute top-0 right-0 w-1/2 h-full bg-transparent backdrop-blur-sm flex flex-col z-20"
        : "w-1/2 h-full bg-transparent backdrop-blur-sm flex flex-col"
      }>
        {/* 채팅 메시지 영역 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
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
        <div className="p-4 border-t border-white/20">
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
    </div>
  );
}
