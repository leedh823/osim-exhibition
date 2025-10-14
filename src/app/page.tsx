'use client';

import { useState, useEffect } from 'react';

export default function ExhibitionHome() {
  const [currentStep, setCurrentStep] = useState('intro'); // intro, code, questions, result
  const [enteredCode, setEnteredCode] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);

  // 8개 질문 데이터
  const questions = [
    {
      id: 1,
      question: "당신이 가장 중요하게 생각하는 것은?",
      options: ["자유", "안정", "성취", "관계"]
    },
    {
      id: 2,
      question: "새로운 도전을 할 때 느끼는 감정은?",
      options: ["흥미진진함", "불안함", "기대감", "조심스러움"]
    },
    {
      id: 3,
      question: "휴식을 취할 때 선호하는 방식은?",
      options: ["혼자만의 시간", "가족과 함께", "친구들과", "새로운 경험"]
    },
    {
      id: 4,
      question: "문제를 해결할 때 주로 사용하는 방법은?",
      options: ["논리적 분석", "직감적 판단", "다른 사람 의견", "경험 활용"]
    },
    {
      id: 5,
      question: "성공의 기준은 무엇인가요?",
      options: ["개인적 만족", "사회적 인정", "물질적 성과", "인간관계"]
    },
    {
      id: 6,
      question: "스트레스를 받을 때 어떻게 대처하나요?",
      options: ["운동이나 활동", "휴식과 명상", "사람들과 대화", "새로운 도전"]
    },
    {
      id: 7,
      question: "미래에 대한 생각은?",
      options: ["계획적으로 준비", "유연하게 대응", "현재에 집중", "다른 사람과 함께"]
    },
    {
      id: 8,
      question: "가장 행복한 순간은?",
      options: ["목표 달성", "사랑하는 사람과", "새로운 발견", "평화로운 시간"]
    }
  ];

  // 5초 지연 후 자동으로 code 스텝으로 전환
  useEffect(() => {
    if (currentStep === 'intro') {
      const timer = setTimeout(() => {
        setCurrentStep('code');
      }, 5000); // 5초 지연
      
      return () => clearTimeout(timer); // 컴포넌트 언마운트 시 타이머 정리
    }
  }, [currentStep]);

  // 42인치 세로형 터치스크린 최적화
  return (
    <div className="w-full h-screen bg-[#593B15] text-white overflow-hidden touch-manipulation">
      {/* 디지털 감시 시스템 스타일 인트로 화면 */}
      {currentStep === 'intro' && (
        <div className="w-full h-full relative overflow-hidden bg-black">
          {/* 배경 비디오 영역 (흑백 필터) */}
          <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-black to-gray-800">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMzMzIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-20"></div>
          </div>

          {/* 디지털 오버레이 텍스트들 */}
          <div className="absolute top-10 left-10 text-green-400 font-mono text-sm opacity-60">
            <div className="animate-pulse">TRACKING_SYSTEM v2.1.4</div>
            <div className="animate-pulse delay-100">INITIALIZING...</div>
            <div className="animate-pulse delay-200">SCANNING_PATTERNS</div>
          </div>

          <div className="absolute top-10 right-10 text-green-400 font-mono text-sm opacity-60">
            <div>327548.0</div>
            <div>565</div>
            <div>7549.0</div>
          </div>

          <div className="absolute bottom-20 left-10 text-green-400 font-mono text-sm opacity-60">
            <div>(loop (format t"~%*))</div>
            <div>32/562.0</div>
            <div>3.0</div>
          </div>

          {/* 바운딩 박스들 (초록색 추적 박스) */}
          <div className="absolute top-1/4 left-1/4 w-32 h-40 border-2 border-green-400 animate-trackingBox">
            <div className="absolute -top-6 left-0 text-green-400 text-xs font-mono animate-digitalGlow">SUBJECT_01</div>
            <div className="absolute -bottom-6 right-0 text-green-400 text-xs font-mono animate-digitalGlow">CONF: 0.95</div>
          </div>

          <div className="absolute top-1/3 right-1/3 w-24 h-32 border-2 border-green-400 animate-trackingBox delay-300">
            <div className="absolute -top-6 left-0 text-green-400 text-xs font-mono animate-digitalGlow">SUBJECT_02</div>
            <div className="absolute -bottom-6 right-0 text-green-400 text-xs font-mono animate-digitalGlow">CONF: 0.87</div>
          </div>

          <div className="absolute bottom-1/4 right-1/4 w-28 h-36 border-2 border-green-400 animate-trackingBox delay-700">
            <div className="absolute -top-6 left-0 text-green-400 text-xs font-mono animate-digitalGlow">SUBJECT_03</div>
            <div className="absolute -bottom-6 right-0 text-green-400 text-xs font-mono animate-digitalGlow">CONF: 0.92</div>
          </div>

          {/* 스캔라인 효과 */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-400 to-transparent animate-scanLine"></div>
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-400 to-transparent animate-scanLine delay-1500"></div>
          </div>

          {/* 데이터 플로우 효과 */}
          <div className="absolute top-20 left-0 w-32 h-1 bg-green-400 animate-dataFlow opacity-60"></div>
          <div className="absolute top-32 right-0 w-24 h-1 bg-green-400 animate-dataFlow delay-1000 opacity-60"></div>
          <div className="absolute bottom-32 left-0 w-40 h-1 bg-green-400 animate-dataFlow delay-2000 opacity-60"></div>

          {/* 추적선들 */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            <line x1="25%" y1="25%" x2="35%" y2="35%" stroke="#00ff00" strokeWidth="1" opacity="0.6" className="animate-pulse" />
            <line x1="65%" y1="33%" x2="75%" y2="25%" stroke="#00ff00" strokeWidth="1" opacity="0.6" className="animate-pulse delay-500" />
            <line x1="75%" y1="25%" x2="75%" y2="75%" stroke="#00ff00" strokeWidth="1" opacity="0.6" className="animate-pulse delay-1000" />
          </svg>

          {/* 중앙 재생 버튼 */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              {/* 큰 원형 배경 */}
              <div className="w-48 h-48 rounded-full border-4 border-green-400 bg-black/50 flex items-center justify-center animate-trackingBox shadow-2xl">
                {/* 재생 버튼 */}
                <div className="w-16 h-16 ml-2 animate-digitalGlow">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full text-green-400">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </div>
              </div>
              
              {/* 버튼 주변 텍스트 */}
              <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 text-green-400 font-mono text-lg animate-digitalGlow">
                ANALYSIS_READY
              </div>
              <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 text-green-400 font-mono text-sm animate-flicker">
                TAP TO INITIATE
              </div>
            </div>
          </div>

          {/* 하단 UI 아이콘들 */}
          <div className="absolute bottom-10 left-10 text-white opacity-60">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
          </div>

          <div className="absolute bottom-10 right-10 text-white opacity-60">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
            </svg>
          </div>

          {/* 메인 타이틀 (디지털 스타일) */}
          <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
            <h1 className="text-7xl font-bold tracking-widest text-green-400 font-mono mb-4 animate-digitalGlow">
              추구미
            </h1>
            <div className="text-4xl font-mono text-green-300 opacity-80 animate-digitalGlow delay-500">
              ANALYSIS_SYSTEM
            </div>
            <div className="text-xl text-green-400 font-mono mt-4 animate-flicker">
              INITIALIZING... PLEASE WAIT
            </div>
          </div>
        </div>
      )}

      {/* 4자리 번호 입력 화면 */}
      {currentStep === 'code' && (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-[#CE9C53] to-[#593B15]">
          <div className="text-center space-y-12">
            <h2 className="text-6xl font-bold mb-8 text-[#FFE805]">
              4자리 번호를 입력하세요
            </h2>
            <div className="text-5xl font-mono mb-8 tracking-widest text-[#FFFFFF]">
              {enteredCode.padEnd(4, '_')}
            </div>
            
            {/* 터치 키패드 */}
            <div className="flex justify-center">
              <div className="grid grid-cols-3 gap-8 max-w-lg">
                {[1,2,3,4,5,6,7,8,9,'',0,'⌫'].map((key) => (
                  <button
                    key={key}
                    onClick={() => {
                      if (key === '⌫') {
                        setEnteredCode(prev => prev.slice(0, -1));
                      } else if (key !== '' && enteredCode.length < 4) {
                        setEnteredCode(prev => prev + key);
                      }
                    }}
                    className="bg-[#FFFFFF] text-[#593B15] text-5xl font-bold h-24 w-24 rounded-xl hover:bg-[#FFE805] hover:text-[#593B15] transition-colors touch-manipulation shadow-lg"
                    disabled={key === ''}
                  >
                    {key}
                  </button>
                ))}
              </div>
            </div>
            
            {/* 확인 버튼 */}
            <button
              onClick={() => {
                if (enteredCode.length === 4) {
                  setCurrentStep('questions');
                }
              }}
              className={`px-16 py-6 text-2xl font-semibold rounded-full transition-colors mt-8 shadow-lg ${
                enteredCode.length === 4
                  ? 'bg-[#FFE805] text-[#593B15] hover:bg-[#CE9C53] hover:text-white cursor-pointer'
                  : 'bg-[#CE9C53] text-[#593B15] cursor-not-allowed opacity-50'
              }`}
              disabled={enteredCode.length !== 4}
            >
              확인
            </button>
          </div>
        </div>
      )}

      {/* 질문 화면 */}
      {currentStep === 'questions' && (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-[#CE9C53] to-[#593B15] p-8">
          <div className="bg-white text-[#593B15] rounded-2xl p-12 max-w-4xl w-full flex flex-col items-center space-y-8">
            {/* 진행률 표시 */}
            <div className="text-4xl font-bold text-[#FFE805]">
              질문 {currentQuestion}/8
            </div>
            
            {/* 이미지 영역 */}
            <div className="w-full h-80 bg-gray-100 rounded-xl flex items-center justify-center">
              <div className="text-3xl text-[#593B15] opacity-70">
                이미지 영역
              </div>
            </div>
            
            {/* 질문 */}
            <h3 className="text-4xl font-bold leading-relaxed text-[#593B15] text-center">
              {questions[currentQuestion - 1]?.question}
            </h3>
            
            {/* 답변 옵션 */}
            <div className="grid grid-cols-1 gap-4 w-full">
              {questions[currentQuestion - 1]?.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedAnswer(index)}
                  className={`text-2xl font-semibold py-6 px-8 rounded-xl transition-all duration-200 touch-manipulation ${
                    selectedAnswer === index
                      ? 'bg-[#FFE805] text-[#593B15] scale-105'
                      : 'bg-gray-100 text-[#593B15] hover:bg-[#CE9C53] hover:text-white'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
            
            {/* 확인 버튼 */}
            <button
              onClick={() => {
                if (selectedAnswer !== null) {
                  const newAnswers = [...answers, selectedAnswer];
                  setAnswers(newAnswers);
                  
                  if (currentQuestion < 8) {
                    setCurrentQuestion(prev => prev + 1);
                    setSelectedAnswer(null);
                  } else {
                    setCurrentStep('result');
                  }
                }
              }}
              className={`px-16 py-6 text-2xl font-semibold rounded-full transition-colors ${
                selectedAnswer !== null
                  ? 'bg-[#FFE805] text-[#593B15] hover:bg-[#CE9C53] hover:text-white cursor-pointer'
                  : 'bg-gray-300 text-[#593B15] cursor-not-allowed opacity-50'
              }`}
              disabled={selectedAnswer === null}
            >
              {currentQuestion < 8 ? '다음 질문' : '결과 보기'}
            </button>
            
            {/* 진행률 바 */}
            <div className="w-full bg-gray-200 rounded-full h-3 mt-4">
              <div 
                className="bg-[#FFE805] h-3 rounded-full transition-all duration-500"
                style={{ width: `${(currentQuestion / 8) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* 결과 화면 */}
      {currentStep === 'result' && (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-[#CE9C53] to-[#593B15] p-8">
          <div className="bg-white text-[#593B15] rounded-2xl p-12 max-w-4xl w-full flex flex-col items-center space-y-8">
            <h2 className="text-6xl font-bold text-[#FFE805]">
              결과
            </h2>
            <p className="text-3xl text-[#593B15] text-center">
              당신의 추구미는...
            </p>
            <div className="text-xl text-[#593B15] text-center bg-gray-100 rounded-xl p-6 w-full">
              답변: {answers.join(', ')}
            </div>
            <button
              onClick={() => {
                setCurrentStep('intro');
                setEnteredCode('');
                setCurrentQuestion(1);
                setSelectedAnswer(null);
                setAnswers([]);
              }}
              className="bg-[#FFE805] text-[#593B15] px-16 py-6 text-2xl font-semibold rounded-full hover:bg-[#CE9C53] hover:text-white transition-colors"
            >
              다시 시작하기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
