'use client';

import { useState } from 'react';

export default function ExhibitionHome() {
  const [currentStep, setCurrentStep] = useState('intro'); // intro, code, questions, result
  const [enteredCode, setEnteredCode] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState(1);

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
            <button
              onClick={() => setCurrentStep('code')}
              className="bg-[#FFE805] text-[#593B15] px-16 py-6 text-2xl font-semibold rounded-full hover:bg-[#CE9C53] hover:text-white transition-colors touch-manipulation shadow-lg"
            >
              시작하기
            </button>
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
              <div className="grid grid-cols-3 gap-6 max-w-md">
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
                    className="bg-[#FFFFFF] text-[#593B15] text-4xl font-bold h-20 rounded-xl hover:bg-[#FFE805] hover:text-[#593B15] transition-colors touch-manipulation shadow-lg"
                    disabled={key === ''}
                  >
                    {key}
                  </button>
                ))}
              </div>
            </div>
            
            {/* 확인 버튼 */}
            {enteredCode.length === 4 && (
              <button
                onClick={() => setCurrentStep('questions')}
                className="bg-[#FFE805] text-[#593B15] px-16 py-6 text-2xl font-semibold rounded-full hover:bg-[#CE9C53] hover:text-white transition-colors mt-8 shadow-lg"
              >
                확인
              </button>
            )}
          </div>
        </div>
      )}

      {/* 질문 화면 */}
      {currentStep === 'questions' && (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-[#CE9C53] to-[#593B15] p-8">
          <div className="text-center space-y-8 max-w-4xl">
            <div className="text-4xl font-bold mb-8 text-[#FFE805]">
              질문 {currentQuestion}/8
            </div>
            <h3 className="text-5xl font-bold mb-12 leading-relaxed text-[#FFFFFF]">
              당신이 가장 중요하게 생각하는 것은?
            </h3>
            
            <div className="grid grid-cols-1 gap-6 w-full">
              {['자유', '안정', '성취', '관계'].map((option, index) => (
                <button
                  key={index}
                  onClick={() => {
                    if (currentQuestion < 8) {
                      setCurrentQuestion(prev => prev + 1);
                    } else {
                      setCurrentStep('result');
                    }
                  }}
                  className="bg-[#FFFFFF] text-[#593B15] text-3xl font-semibold py-8 px-12 rounded-2xl hover:bg-[#FFE805] hover:text-[#593B15] transition-colors touch-manipulation shadow-lg"
                >
                  {option}
                </button>
              ))}
            </div>
            
            {/* 진행률 표시 */}
            <div className="w-full bg-[#593B15] rounded-full h-4 mt-12">
              <div 
                className="bg-[#FFE805] h-4 rounded-full transition-all duration-500"
                style={{ width: `${(currentQuestion / 8) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* 결과 화면 */}
      {currentStep === 'result' && (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-[#CE9C53] to-[#593B15]">
          <div className="text-center space-y-8">
            <h2 className="text-6xl font-bold mb-8 text-[#FFE805]">
              결과
            </h2>
            <p className="text-3xl mb-12 text-[#FFFFFF]">
              당신의 추구미는...
            </p>
            <button
              onClick={() => {
                setCurrentStep('intro');
                setEnteredCode('');
                setCurrentQuestion(1);
              }}
              className="bg-[#FFE805] text-[#593B15] px-16 py-6 text-2xl font-semibold rounded-full hover:bg-[#CE9C53] hover:text-white transition-colors shadow-lg"
            >
              다시 시작하기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
