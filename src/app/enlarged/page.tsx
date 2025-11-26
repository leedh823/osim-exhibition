'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';

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
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoSrc, setVideoSrc] = useState('/2.mp4'); // 기본 영상
  const [selectedPoster, setSelectedPoster] = useState<string | null>(null); // 선택된 포스터 번호
  const [selectedType, setSelectedType] = useState<string | null>(null); // 선택된 타입 (people 또는 car)
  const [videoIndex, setVideoIndex] = useState(1); // 현재 비디오 인덱스 (1부터 시작)

  // AI 메시지 처리
  const handleAIMessage = useCallback(async () => {
    // 이미 AI 메시지가 마지막이면 중복 실행 방지
    if (chatMessages.length > 0) {
      const lastMessage = chatMessages[chatMessages.length - 1];
      if (lastMessage.role === 'assistant') return;
    }
    
    setIsLoading(true);
    
    console.log('📤 API 요청 데이터 (Enlarged):', {
      turnCount: currentTurn,
      selectedType,
      selectedPoster,
      selectedTypeType: typeof selectedType,
      selectedPosterType: typeof selectedPoster
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
          selectedPerson: null, // 트래킹 비활성화
          selectedType: selectedType,
          selectedPoster: selectedPoster
        }),
      });

      const data = await response.json();
      
      console.log('📥 API 응답 데이터 (Enlarged):', {
        content: data.content,
        hasContent: !!data.content,
        isAnalysis: data.isAnalysis,
        turnCount: currentTurn,
        selectedType,
        selectedPoster
      });
      
      if (data.content) {
        const newMessage = {
          role: 'assistant',
          content: data.content
        };
        setChatMessages(prev => [...prev, newMessage]);
        console.log('✅ 질문 추가됨:', data.content);
        
        // 분석 데이터가 있으면 저장
        if (data.analysis) {
          localStorage.setItem('analysisData', JSON.stringify(data.analysis));
          // 분석이 완료되면 3초 후 페이지 전환
          setTimeout(() => {
            router.push('/analysis');
          }, 3000);
        }
        
        // 4번째 대답 후 (currentTurn === 4) 분석 시작 메시지가 표시되면 분석 페이지로 이동
        if (currentTurn === 4 && (data.isAnalysis || data.content.includes('분석을 시작하겠습니다'))) {
          setTimeout(() => {
            router.push('/analysis');
          }, 2000);
        }
      } else if (data.error) {
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

  // 선택된 인물 정보 및 포스터 정보 로드
  useEffect(() => {
    // 포스터 번호 및 타입 확인하여 영상 경로 설정
    const poster = localStorage.getItem('selectedPoster');
    const type = localStorage.getItem('selectedType'); // 'people' 또는 'car'
    
    setSelectedPoster(poster);
    setSelectedType(type);
    console.log('📋 선택된 포스터:', poster);
    console.log('📋 선택된 타입:', type);
    
    // 포스터별 초기 비디오 인덱스 설정
    if (poster === '1') {
      // 포스터 1: selectedType에 따라 people 또는 car 영상 재생
      if (type === 'people') {
        setVideoIndex(1);
        setVideoSrc('/poster video 1/people 1.mp4');
        console.log('👥 People 영상 시작: people 1.mp4');
      } else if (type === 'car') {
        setVideoIndex(1);
        setVideoSrc('/poster video 1/car 1.mp4');
        console.log('🚗 Car 영상 시작: car 1.mp4');
      } else {
        // 기본값: people
        setVideoIndex(1);
        setVideoSrc('/poster video 1/people 1.mp4');
        console.log('👥 기본값: People 영상 시작');
      }
    } else if (poster === '2') {
      // 포스터 2: selectedType에 따라 people 또는 taxi 영상 재생
      if (type === 'left' || type === 'people') {
        setVideoIndex(1);
        setVideoSrc('/poster video 2/people 1.mp4');
        console.log('👥 People 영상 시작: people 1.mp4');
      } else if (type === 'taxi') {
        setVideoIndex(1);
        setVideoSrc('/poster video 2/taxi 1.mp4');
        console.log('🚕 Taxi 영상 시작: taxi 1.mp4');
      } else {
        // 기본값: people
        setVideoIndex(1);
        setVideoSrc('/poster video 2/people 1.mp4');
        console.log('👥 기본값: People 영상 시작');
      }
    } else if (poster === '3') {
      // 포스터 3: selectedType에 따라 bike 또는 boat 영상 재생
      if (type === 'bike') {
        setVideoIndex(1);
        setVideoSrc('/poster video 3/bike1.mp4');
        console.log('🚴 Bike 영상 시작: bike1.mp4');
      } else if (type === 'boat') {
        setVideoIndex(1);
        setVideoSrc('/poster video 3/boat1.mp4');
        console.log('🚤 Boat 영상 시작: boat1.mp4');
      } else {
        // 기본값: boat
        setVideoIndex(1);
        setVideoSrc('/poster video 3/boat1.mp4');
        console.log('🚤 기본값: Boat 영상 시작');
      }
    } else {
      setVideoIndex(2);
      setVideoSrc('/2.mp4'); // 기본 영상 (fallback)
    }
  }, []);

  // 비디오 소스 변경 시 비디오 업데이트
  useEffect(() => {
    if (videoRef.current && videoSrc) {
      const video = videoRef.current;
      const source = video.querySelector('source');
      if (source) {
        source.src = videoSrc;
        video.load();
      }
    }
  }, [videoSrc]);

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

  // 비디오 경로 생성 함수
  const getVideoPath = (poster: string | null, type: string | null, index: number): string => {
    if (poster === '1') {
      // 포스터 1: selectedType에 따라 people 또는 car 영상 경로 반환
      if (type === 'people') {
        return `/poster video 1/people ${index}.mp4`;
      } else if (type === 'car') {
        return `/poster video 1/car ${index}.mp4`;
      } else {
        // 기본값: people
        return `/poster video 1/people ${index}.mp4`;
      }
    } else if (poster === '2') {
      // 포스터 2: people 또는 taxi 영상 경로 반환
      if (type === 'left' || type === 'people') {
        return `/poster video 2/people ${index}.mp4`;
      } else if (type === 'taxi') {
        return `/poster video 2/taxi ${index}.mp4`;
      } else {
        // 기본값: people
        return `/poster video 2/people ${index}.mp4`;
      }
    } else if (poster === '3') {
      // 포스터 3: bike 또는 boat 영상 경로 반환
      if (type === 'bike') {
        return `/poster video 3/bike${index}.mp4`;
      } else if (type === 'boat') {
        return `/poster video 3/boat${index}.mp4`;
      } else {
        // 기본값: boat
        return `/poster video 3/boat${index}.mp4`;
      }
    }
    return `/2.mp4`;
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
      
      // 채팅 전송 시 다음 비디오로 변경 (택시 선택 시 제외)
      if (selectedPoster === '2' && selectedType === 'taxi') {
        // 택시 영상도 정상적으로 재생
        setVideoIndex(prev => {
          const nextIndex = prev + 1;
          const maxIndex = 4; // taxi 영상 4개
          
          if (nextIndex <= maxIndex) {
            const nextVideoPath = getVideoPath(selectedPoster, selectedType, nextIndex);
            console.log('🎬 다음 Taxi 비디오로 변경:', nextVideoPath);
            setVideoSrc(nextVideoPath);
            return nextIndex;
          }
          return prev;
        });
      } else {
        setVideoIndex(prev => {
          const nextIndex = prev + 1;
          // 포스터별 최대 인덱스 설정
          let maxIndex = 4; // 기본값
          if (selectedPoster === '1') {
            maxIndex = 4; // people/car 각 4개
          } else if (selectedPoster === '2') {
            maxIndex = 4; // people/taxi 각 4개
          } else if (selectedPoster === '3') {
            // bike와 boat 모두 4개
            maxIndex = 4;
          }
          
          if (nextIndex <= maxIndex) {
            const nextVideoPath = getVideoPath(selectedPoster, selectedType, nextIndex);
            console.log('🎬 다음 비디오로 변경:', nextVideoPath);
            setVideoSrc(nextVideoPath);
            return nextIndex;
          }
          return prev; // 최대 인덱스를 넘어가면 유지
        });
      }
    }
  };

  // Enter 키로 메시지 전송
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };



  console.log('🎥 현재 영상 경로:', videoSrc);

  return (
    <div className="w-full h-screen bg-black aspect-[16/9] mx-auto relative overflow-hidden">
      {/* 영상 영역 - 전체화면 */}
      <div className="w-full h-full relative z-10">
        <video
          key={videoSrc}
          ref={videoRef}
          className="w-full h-full object-cover"
          autoPlay
          loop
          playsInline
          controls={false}
          preload="auto"
          onError={(e) => {
            console.error('비디오 로드 에러:', e);
            console.error('비디오 경로:', videoSrc);
          }}
        >
          <source src={videoSrc} type="video/mp4" />
        </video>
      </div>
      
      {/* AI 채팅 영역 - 오른쪽 오버레이 */}
      {/* 포스터 1번과 3번은 동일한 배경 구조 사용 (bg-transparent backdrop-blur-sm) */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-transparent backdrop-blur-sm flex flex-col z-20">
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
