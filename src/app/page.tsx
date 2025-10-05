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
      {/* 인트로 화면 */}
      {currentStep === 'intro' && (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-[#CE9C53] to-[#593B15]">
          <div className="text-center space-y-8">
            <h1 className="text-8xl font-bold mb-8 tracking-wider text-[#FFE805]">
              추구미 테스트
            </h1>
            <p className="text-3xl mb-12 text-[#FFFFFF]">
              당신의 추구미를 찾아보세요
            </p>
            <div className="text-2xl text-[#FFFFFF]">
              잠시만 기다려주세요...
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
