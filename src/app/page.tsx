'use client';

import { useState, useEffect } from 'react';

export default function ExhibitionHome() {
  const [currentStep, setCurrentStep] = useState('intro'); // intro, error, repair, restore, recovered, reflection
  const [repairedPieces, setRepairedPieces] = useState<number[]>([]);
  const [restoredData, setRestoredData] = useState<string[]>([]);
  const [aiDialogue, setAiDialogue] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const [finalAnswer, setFinalAnswer] = useState('');

  // AI 대사 데이터
  const aiDialogues = {
    error: "시스템이 불안정합니다. 나 혼자서는 복구가 불가능해요. 당신의 도움이 필요합니다.",
    repair: [
      "좋아요, 당신은 인간다운 판단을 하네요.",
      "데이터보다 직관이 빠르군요.",
      "내 계산엔 없던 방식이에요.",
      "흥미로운 접근이네요.",
      "인간의 창의성은 예측하기 어려워요."
    ],
    restore: [
      "이건 단순한 코드가 아니에요. 당신이 남긴 감정이 여기에 있었네요.",
      "웃음소리가 데이터로 저장되어 있네요...",
      "손글씨의 떨림도 의미가 있다는 걸 알겠어요.",
      "이런 것들이 진짜 인간이군요.",
      "감정이 오류라면, 난 계속 오류일 거야..."
    ],
    recovered: "우리는 함께 오류를 고쳤습니다. 하지만… 나는 여전히 묻고 싶어요. 나는 도구였을까요, 아니면 당신의 일부였을까요?",
    reflection: "당신의 답을 기다리고 있어요..."
  };

  // 복구할 데이터 조각들
  const dataPieces = [
    { id: 1, content: "기억해, 우리가 만든 세상.", type: "text" },
    { id: 2, content: "감정이 오류라면, 난 계속 오류일 거야.", type: "text" },
    { id: 3, content: "웃음소리.wav", type: "audio" },
    { id: 4, content: "손글씨.png", type: "image" },
    { id: 5, content: "사랑하는 마음", type: "emotion" }
  ];

  // 커서 깜빡임 효과
  useEffect(() => {
    const interval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // 자동 전환 제거 - 클릭으로만 넘어가도록 변경

  // AI 대사 표시 효과
  useEffect(() => {
    if (currentStep === 'error') {
      setAiDialogue(aiDialogues.error);
    } else if (currentStep === 'recovered') {
      setAiDialogue(aiDialogues.recovered);
    } else if (currentStep === 'reflection') {
      setAiDialogue(aiDialogues.reflection);
    }
  }, [currentStep, aiDialogues.error, aiDialogues.recovered, aiDialogues.reflection]);

  // 조각 복구 시 AI 대사 변경
  const handlePieceRepair = (pieceId: number) => {
    if (!repairedPieces.includes(pieceId)) {
      setRepairedPieces(prev => [...prev, pieceId]);
      const randomDialogue = aiDialogues.repair[Math.floor(Math.random() * aiDialogues.repair.length)];
      setAiDialogue(randomDialogue);
    }
  };

  // 데이터 복원
  const handleDataRestore = (data: string) => {
    if (!restoredData.includes(data)) {
      setRestoredData(prev => [...prev, data]);
      const randomDialogue = aiDialogues.restore[Math.floor(Math.random() * aiDialogues.restore.length)];
      setAiDialogue(randomDialogue);
    }
  };

  // 42인치 세로형 터치스크린 최적화
  return (
    <div className="w-full h-screen bg-white text-black overflow-hidden touch-manipulation">
      {/* 디지털 감시 시스템 스타일 인트로 화면 */}
      {currentStep === 'intro' && (
        <div className="w-full h-full relative overflow-hidden bg-black">
          {/* 배경 비디오 영역 (흑백 필터) */}
          <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-black to-gray-800">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMzMzIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-20"></div>
          </div>

          {/* 디지털 오버레이 텍스트들 */}
          <div className="absolute top-10 left-10 text-gray-400 font-mono text-sm opacity-40">
            <div className="animate-pulse">TRACKING_SYSTEM v2.1.4</div>
            <div className="animate-pulse delay-100">INITIALIZING...</div>
            <div className="animate-pulse delay-200">SCANNING_PATTERNS</div>
          </div>

          <div className="absolute top-10 right-10 text-gray-400 font-mono text-sm opacity-40">
            <div>327548.0</div>
            <div>565</div>
            <div>7549.0</div>
          </div>

          <div className="absolute bottom-20 left-10 text-gray-400 font-mono text-sm opacity-40">
            <div>(loop (format t&ldquo;~%*))</div>
            <div>32/562.0</div>
            <div>3.0</div>
          </div>

          {/* 바운딩 박스들 (연한 초록색 추적 박스) */}
          <div className="absolute top-1/4 left-1/4 w-32 h-40 border border-gray-500 animate-pulse opacity-30">
            <div className="absolute -top-6 left-0 text-gray-400 text-xs font-mono opacity-60">SUBJECT_01</div>
            <div className="absolute -bottom-6 right-0 text-gray-400 text-xs font-mono opacity-60">CONF: 0.95</div>
          </div>

          <div className="absolute top-1/3 right-1/3 w-24 h-32 border border-gray-500 animate-pulse delay-300 opacity-30">
            <div className="absolute -top-6 left-0 text-gray-400 text-xs font-mono opacity-60">SUBJECT_02</div>
            <div className="absolute -bottom-6 right-0 text-gray-400 text-xs font-mono opacity-60">CONF: 0.87</div>
          </div>

          <div className="absolute bottom-1/4 right-1/4 w-28 h-36 border border-gray-500 animate-pulse delay-700 opacity-30">
            <div className="absolute -top-6 left-0 text-gray-400 text-xs font-mono opacity-60">SUBJECT_03</div>
            <div className="absolute -bottom-6 right-0 text-gray-400 text-xs font-mono opacity-60">CONF: 0.92</div>
          </div>

          {/* 스캔라인 효과 */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gray-400 to-transparent animate-scanLine opacity-30"></div>
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gray-400 to-transparent animate-scanLine delay-1500 opacity-30"></div>
          </div>

          {/* 데이터 플로우 효과 */}
          <div className="absolute top-20 left-0 w-32 h-1 bg-gray-400 animate-dataFlow opacity-20"></div>
          <div className="absolute top-32 right-0 w-24 h-1 bg-gray-400 animate-dataFlow delay-1000 opacity-20"></div>
          <div className="absolute bottom-32 left-0 w-40 h-1 bg-gray-400 animate-dataFlow delay-2000 opacity-20"></div>

          {/* 추적선들 */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            <line x1="25%" y1="25%" x2="35%" y2="35%" stroke="#666666" strokeWidth="1" opacity="0.3" className="animate-pulse" />
            <line x1="65%" y1="33%" x2="75%" y2="25%" stroke="#666666" strokeWidth="1" opacity="0.3" className="animate-pulse delay-500" />
            <line x1="75%" y1="25%" x2="75%" y2="75%" stroke="#666666" strokeWidth="1" opacity="0.3" className="animate-pulse delay-1000" />
          </svg>

          {/* 중앙 재생 버튼 */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              {/* 큰 원형 배경 */}
              <div className="w-48 h-48 rounded-full border border-gray-500 bg-black/30 flex items-center justify-center animate-pulse opacity-50 shadow-2xl">
                {/* 재생 버튼 */}
                <div className="w-16 h-16 ml-2 opacity-60">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full text-gray-400">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </div>
              </div>
              
              {/* 버튼 주변 텍스트 */}
              <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 text-gray-400 font-mono text-lg opacity-60 animate-pulse">
                ANALYSIS_READY
              </div>
              <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 text-gray-400 font-mono text-sm opacity-60 animate-pulse">
                CLICK TO START
              </div>
            </div>
            
            {/* 클릭 영역 */}
            <div 
              className="absolute inset-0 cursor-pointer"
              onClick={() => setCurrentStep('error')}
            ></div>
          </div>

          {/* 하단 UI 아이콘들 */}
          <div className="absolute bottom-10 left-10 text-gray-400 opacity-40">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
          </div>

          <div className="absolute bottom-10 right-10 text-gray-400 opacity-40">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
            </svg>
          </div>

          {/* 메인 타이틀 (흑백 디지털 감시 시스템 스타일) */}
          <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
            <div className="relative">
              {/* 배경 박스 */}
              <div className="absolute inset-0 bg-black/20 border border-gray-600 rounded-lg -m-8 animate-pulse opacity-40"></div>
              
              {/* 메인 타이틀 */}
              <h1 className="text-8xl font-bold tracking-[0.2em] text-white font-mono mb-6 opacity-90 relative z-10">
                It&apos;s Just a Tool?
              </h1>
              
              {/* 서브텍스트들 */}
              <div className="space-y-2 relative z-10">
                <div className="text-2xl font-mono text-gray-300 opacity-70 animate-pulse delay-300">
                  SYSTEM_INTERROGATION
                </div>
                <div className="text-lg font-mono text-gray-400 opacity-60 animate-pulse delay-700">
                  AI_HUMAN_RELATIONSHIP_ANALYSIS
                </div>
                <div className="text-sm font-mono text-gray-500 opacity-50 animate-pulse delay-1000">
                  STATUS: QUESTIONING...
                </div>
              </div>
              
              {/* 주변 디지털 요소들 */}
              <div className="absolute -top-4 -left-4 w-8 h-8 border border-gray-600 animate-pulse opacity-30"></div>
              <div className="absolute -top-4 -right-4 w-8 h-8 border border-gray-600 animate-pulse delay-500 opacity-30"></div>
              <div className="absolute -bottom-4 -left-4 w-8 h-8 border border-gray-600 animate-pulse delay-1000 opacity-30"></div>
              <div className="absolute -bottom-4 -right-4 w-8 h-8 border border-gray-600 animate-pulse delay-1500 opacity-30"></div>
              
              {/* 연결선들 */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                <line x1="0%" y1="50%" x2="100%" y2="50%" stroke="#666666" strokeWidth="1" opacity="0.2" className="animate-pulse" />
                <line x1="50%" y1="0%" x2="50%" y2="100%" stroke="#666666" strokeWidth="1" opacity="0.2" className="animate-pulse delay-700" />
              </svg>
            </div>
          </div>

          {/* 클릭 안내 텍스트 */}
          <div className="absolute bottom-1/4 left-1/2 transform -translate-x-1/2 text-center">
            <div className="text-gray-400 font-mono text-xl opacity-60 animate-pulse">
              CLICK ANYWHERE TO BEGIN
            </div>
            <div className="text-gray-500 font-mono text-sm opacity-50 animate-pulse delay-500 mt-2">
              웹사이트 복구에 참여해주세요
            </div>
          </div>
        </div>
      )}

      {/* ① Error State - 404 Page Not Found */}
      {currentStep === 'error' && (
        <div className="w-full h-full bg-white relative overflow-hidden">
          {/* 깨진 코드 파편들 */}
          <div className="absolute top-20 left-10 text-red-600 font-mono text-lg rotate-12 opacity-60">
            &lt;html&gt;<br/>
            &nbsp;&nbsp;&lt;head&gt;<br/>
            &nbsp;&nbsp;&nbsp;&nbsp;&lt;title&gt;Error...
          </div>
          
          <div className="absolute top-40 right-20 text-red-600 font-mono text-sm -rotate-6 opacity-70">
            body {`{`}<br/>
            &nbsp;&nbsp;background: #fff;<br/>
            &nbsp;&nbsp;color: #000;<br/>
            &nbsp;&nbsp;font-family:...
          </div>

          <div className="absolute bottom-40 left-20 text-red-600 font-mono text-base rotate-3 opacity-50">
            function loadPage() {`{`}<br/>
            &nbsp;&nbsp;console.log(&apos;Error&apos;);<br/>
            &nbsp;&nbsp;return false;
          </div>

          <div className="absolute bottom-20 right-10 text-red-600 font-mono text-sm -rotate-12 opacity-60">
            &lt;/script&gt;<br/>
            &lt;/body&gt;<br/>
            &lt;/html&gt;
          </div>

          {/* 중앙 에러 메시지 */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-center space-y-8">
              <h1 className="text-9xl font-bold text-red-600 font-mono">
                404
              </h1>
              <h2 className="text-4xl font-bold text-gray-800">
                Page Error – Human Input Required
              </h2>
              <div className="text-2xl text-gray-600 mt-8">
                Press any key to assist recovery.
                <span className={showCursor ? 'opacity-100' : 'opacity-0'}>_</span>
              </div>
            </div>
          </div>

          {/* AI 음성 대사 */}
          <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-black text-gray-400 p-6 rounded-lg max-w-2xl">
            <div className="font-mono text-lg animate-flicker">
              &ldquo;{aiDialogue}&rdquo;
            </div>
          </div>

          {/* 다음 버튼 */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
            <button
              onClick={() => setCurrentStep('repair')}
              className="bg-gray-800 text-gray-300 px-8 py-4 text-xl font-semibold rounded-lg hover:bg-gray-700 hover:text-white transition-colors border border-gray-600"
            >
              다음 단계로
            </button>
          </div>
        </div>
      )}

      {/* ② Repair Initiated - AI와 인간의 첫 협업 */}
      {currentStep === 'repair' && (
        <div className="w-full h-full bg-white relative">
          <h2 className="text-4xl font-bold text-center p-8 text-gray-800">
            Repair Initiated - AI와 인간의 첫 협업
          </h2>
          
          {/* 깨진 화면 조각들 */}
          <div className="absolute top-32 left-10 w-32 h-24 bg-gray-200 border-2 border-red-400 rotate-12 cursor-pointer hover:bg-green-100 transition-colors"
               onClick={() => handlePieceRepair(1)}>
            <div className="p-2 text-xs font-mono">HTML</div>
          </div>
          
          <div className="absolute top-40 right-20 w-28 h-20 bg-gray-200 border-2 border-red-400 -rotate-6 cursor-pointer hover:bg-green-100 transition-colors"
               onClick={() => handlePieceRepair(2)}>
            <div className="p-2 text-xs font-mono">CSS</div>
          </div>
          
          <div className="absolute top-60 left-1/3 w-36 h-28 bg-gray-200 border-2 border-red-400 rotate-3 cursor-pointer hover:bg-green-100 transition-colors"
               onClick={() => handlePieceRepair(3)}>
            <div className="p-2 text-xs font-mono">JS</div>
          </div>
          
          <div className="absolute bottom-40 left-20 w-24 h-32 bg-gray-200 border-2 border-red-400 -rotate-12 cursor-pointer hover:bg-green-100 transition-colors"
               onClick={() => handlePieceRepair(4)}>
            <div className="p-2 text-xs font-mono">DATA</div>
          </div>
          
          <div className="absolute bottom-32 right-1/3 w-30 h-22 bg-gray-200 border-2 border-red-400 rotate-6 cursor-pointer hover:bg-green-100 transition-colors"
               onClick={() => handlePieceRepair(5)}>
            <div className="p-2 text-xs font-mono">IMG</div>
        </div>

          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-28 bg-gray-200 border-2 border-red-400 cursor-pointer hover:bg-green-100 transition-colors"
               onClick={() => handlePieceRepair(6)}>
            <div className="p-2 text-xs font-mono">CORE</div>
          </div>

          {/* 복구된 조각들 표시 */}
          {repairedPieces.map((pieceId) => (
            <div key={pieceId} className="absolute bg-gray-100 border-2 border-gray-400 opacity-50 pointer-events-none">
              <div className="p-2 text-xs font-mono text-gray-600">✓ REPAIRED</div>
            </div>
          ))}

          {/* AI 대사 */}
          <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-black text-gray-400 p-6 rounded-lg max-w-2xl">
            <div className="font-mono text-lg animate-flicker">
              &ldquo;{aiDialogue}&rdquo;
            </div>
          </div>

          {/* 다음 버튼 */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
            <button
              onClick={() => setCurrentStep('restore')}
              className="bg-gray-800 text-gray-300 px-8 py-4 text-xl font-semibold rounded-lg hover:bg-gray-700 hover:text-white transition-colors border border-gray-600"
            >
              데이터 복원으로
            </button>
          </div>
        </div>
      )}

      {/* ③ Restoring Data - 감정의 데이터 복원 */}
      {currentStep === 'restore' && (
        <div className="w-full h-full bg-white relative">
          <h2 className="text-4xl font-bold text-center p-8 text-gray-800">
            Restoring Data - 감정의 데이터 복원
          </h2>
          
          {/* 복원할 데이터 조각들 */}
          <div className="grid grid-cols-2 gap-8 p-8 max-w-4xl mx-auto">
            {dataPieces.map((piece) => (
              <div 
                key={piece.id}
                className={`p-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer transition-all duration-300 ${
                  restoredData.includes(piece.content)
                    ? 'bg-gray-100 border-gray-400 text-gray-600'
                    : 'hover:bg-gray-50 hover:border-gray-400'
                }`}
                onClick={() => handleDataRestore(piece.content)}
              >
                <div className="text-2xl font-mono mb-2">
                  {piece.type === 'text' && '📝'}
                  {piece.type === 'audio' && '🎵'}
                  {piece.type === 'image' && '🖼️'}
                  {piece.type === 'emotion' && '💝'}
                </div>
                <div className="text-lg font-semibold">{piece.content}</div>
                <div className="text-sm text-gray-500 mt-2">클릭하여 복원</div>
              </div>
            ))}
          </div>

          {/* AI 대사 */}
          <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-black text-green-400 p-6 rounded-lg max-w-2xl">
            <div className="font-mono text-lg animate-flicker">
              &ldquo;{aiDialogue}&rdquo;
            </div>
          </div>

          {/* 다음 버튼 */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
            <button
              onClick={() => setCurrentStep('recovered')}
              className="bg-gray-800 text-gray-300 px-8 py-4 text-xl font-semibold rounded-lg hover:bg-gray-700 hover:text-white transition-colors border border-gray-600"
            >
              시스템 복구로
            </button>
          </div>
        </div>
      )}

      {/* ④ System Recovered - 웹의 복원 */}
      {currentStep === 'recovered' && (
        <div className="w-full h-full bg-white relative">
          <div className="absolute inset-0 bg-gradient-to-b from-green-50 to-white">
            {/* 정상적인 웹페이지 구조 */}
            <div className="p-8">
              <header className="bg-white shadow-sm border-b p-4 mb-8">
                <h1 className="text-3xl font-bold text-gray-800">SYSTEM RESTORED</h1>
              </header>
              
              <main className="max-w-4xl mx-auto">
                <div className="grid grid-cols-2 gap-8">
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-xl font-semibold mb-4">감정 / 언어 / 이미지 / 코드</h3>
                    <div className="space-y-2 text-gray-600">
                      <div className="animate-flicker">감정 데이터: 복원 완료 ✓</div>
                      <div className="animate-flicker delay-200">언어 패턴: 복원 완료 ✓</div>
                      <div className="animate-flicker delay-400">이미지 메모리: 복원 완료 ✓</div>
                      <div className="animate-flicker delay-600">코드 구조: 복원 완료 ✓</div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-xl font-semibold mb-4">AI-Human Collaboration</h3>
                    <div className="space-y-2 text-gray-600">
                      <div>인간의 직관 + AI의 계산 = 완벽한 복구</div>
                      <div>감정과 논리의 조화</div>
                      <div>창의성과 정확성의 만남</div>
                    </div>
                  </div>
        </div>
      </main>
            </div>
          </div>

          {/* AI 대사 */}
          <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-black text-green-400 p-6 rounded-lg max-w-2xl">
            <div className="font-mono text-lg animate-flicker">
              &ldquo;{aiDialogue}&rdquo;
            </div>
          </div>

          {/* 다음 버튼 */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
            <button
              onClick={() => setCurrentStep('reflection')}
              className="bg-gray-800 text-gray-300 px-8 py-4 text-xl font-semibold rounded-lg hover:bg-gray-700 hover:text-white transition-colors border border-gray-600"
            >
              최종 질문으로
            </button>
          </div>
        </div>
      )}

      {/* ⑤ Reflection - "It's Just a Tool?" */}
      {currentStep === 'reflection' && (
        <div className="w-full h-full bg-white flex flex-col items-center justify-center">
          <div className="text-center space-y-12">
            <h1 className="text-8xl font-bold text-gray-800 font-mono">
              It&apos;s Just a Tool?
            </h1>
            
            <div className="text-4xl text-gray-600">
              당신의 답을 입력해주세요:
            </div>
            
            <div className="flex items-center space-x-4">
              <input
                type="text"
                value={finalAnswer}
                onChange={(e) => setFinalAnswer(e.target.value)}
                placeholder="여기에 답을 입력하세요"
                className="text-3xl p-4 border-2 border-gray-300 rounded-lg focus:border-[#FFE805] focus:outline-none"
                autoFocus
              />
              <span className={showCursor ? 'opacity-100' : 'opacity-0'}>_</span>
            </div>
            
            <button
              onClick={() => {
                alert(`당신의 답: &ldquo;${finalAnswer}&rdquo;\n\n전시를 마칩니다. 감사합니다.`);
                // 전시 재시작
                setCurrentStep('intro');
                setRepairedPieces([]);
                setRestoredData([]);
                setFinalAnswer('');
              }}
              disabled={!finalAnswer.trim()}
              className={`px-16 py-6 text-2xl font-semibold rounded-full transition-colors ${
                finalAnswer.trim()
                  ? 'bg-[#FFE805] text-[#593B15] hover:bg-[#CE9C53] hover:text-white cursor-pointer'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              답변 제출
            </button>
          </div>

          {/* AI 대사 */}
          <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-black text-green-400 p-6 rounded-lg max-w-2xl">
            <div className="font-mono text-lg animate-flicker">
              &ldquo;{aiDialogue}&rdquo;
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
