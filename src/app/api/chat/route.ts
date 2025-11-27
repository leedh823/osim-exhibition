import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

interface ChatMessage {
  role: string;
  content: string;
}

// API 키 정리 함수 (공백, 줄바꿈, 특수문자 제거)
function cleanApiKey(key: string | undefined): string | null {
  if (!key) return null;
  
  // 앞뒤 공백 제거
  let cleaned = key.trim();
  
  // 줄바꿈, 캐리지 리턴 제거
  cleaned = cleaned.replace(/\r\n/g, '').replace(/\n/g, '').replace(/\r/g, '');
  
  // 모든 공백 제거
  cleaned = cleaned.replace(/\s/g, '');
  
  // ASCII 범위를 벗어나는 문자 제거 (0-255 범위만 허용)
  cleaned = cleaned.split('').filter(char => {
    const code = char.charCodeAt(0);
    return code >= 0 && code <= 255;
  }).join('');
  
  // sk-로 시작하는지 확인
  if (!cleaned.startsWith('sk-')) {
    console.error('⚠️ API 키가 sk-로 시작하지 않습니다:', cleaned.substring(0, 10));
    return null;
  }
  
  return cleaned;
}

// OpenAI 인스턴스를 지연 초기화 (빌드 시점 에러 방지)
function getOpenAIClient() {
  const rawKey = process.env.OPENAI_API_KEY;
  const cleanedKey = cleanApiKey(rawKey);
  
  if (!cleanedKey) {
    console.error('❌ API 키가 유효하지 않습니다. 원본 키:', rawKey ? `${rawKey.substring(0, 10)}...` : '없음');
    return null;
  }
  
  console.log('✅ API 키 정리 완료:', {
    originalLength: rawKey?.length || 0,
    cleanedLength: cleanedKey.length,
    preview: `${cleanedKey.substring(0, 10)}...${cleanedKey.substring(cleanedKey.length - 4)}`
  });
  
  return new OpenAI({
    apiKey: cleanedKey,
  });
}

// 포스터 1 질문 데이터
const poster1Questions = {
  car: {
    1: [
      "그는 청소차의 뒷문을 자연스럽게 엽니다. 이 일을 얼마나 해온 사람처럼 보이나요?",
      "조용한 거리 한복판에서 문을 열고 준비를 합니다. 이 거리가 오늘 작업의 시작일까요, 이미 여러 장소를 거친 뒤일까요?",
      "햇빛 아래 트럭 뒤에서 혼자 서 있는 모습입니다. 그는 지금 마음속으로 어떤 생각을 하고 있을까요?",
      "문을 연 뒤 그는 다음 어떤 행동을 할까요?"
    ],
    2: [
      "그는 차에 올라탑니다. 완전히 작업을 마친 걸까요, 아니면 다음 작업 장소로 이동하는 걸까요?",
      "햇빛 좋은 거리에서 작업을 마친 그는, 이 순간 그는 어떤 생각을 하고 있을까요?",
      "이동하는 차량 뒤에 서 있는 동안, 그는 다음 일을 대비하고 있을까요, 아니면 잠시 여유를 느끼고 있을까요?",
      "그가 방금 지나온 구간에는 어떤 일들이 있었을 것 같나요?",
      "이 일을 선택한 이유가 있다면, 어떤 이유일 것 같나요?"
    ],
    3: [
      "두 사람은 지금 어떤 이야기를 주고받는 중이라고 느껴지나요?",
      "동료와의 대화가 자연스러워 보입니다. 두 사람은 오래 함께 일해온 사이처럼 보이나요?",
      "이 둘의 관계는 '평소처럼 편안한 동료'인가요, '업무 때문에 진지해진 순간'인가요?",
      "이 상황에서 당신이라면 말을 건넬 것인가요, 아니면 조용히 길에 집중할 것인가요?",
      "그의 표정에서 읽히는 감정은 무엇인가요?"
    ],
    4: [
      "두 사람이 이 기록을 함께 보고 있는 이유는 무엇이라고 생각하나요?",
      "서로에게 기대고 있는 신뢰의 정도는 어느 정도로 보이나요?",
      "당신 눈에는 두 사람 중 누가 더 주도적으로 보이나요? 왜 그렇게 느꼈나요?",
      "이들이 처음 만난 동료일까요, 오래 함께 일한 팀일까요?",
      "지금 작성하는 문서가 '시작점'일까요, '마무리'일까요?",
      "두 사람 중 한 명이 실수를 했다면 누구라고 생각하나요?",
      "이 상황에서 당신이라면 어떤 역할을 맡았을 것 같나요?"
    ]
  },
  people: {
    1: [
      "방금 그가 줍고 있는 것은 어떤 것이었을까요?",
      "그가 오늘 하루동안 얼마나 일을 했다고 생각하나요?",
      "그가 오늘 하루 동안 가장 많이 되뇌었던 말 한마디가 있다면 어떤 표현일까요?",
    ],
    2: [
      "이 인물이 검은 봉투를 들고 걸어오는 이 순간, 어떤 생각을 하고 있을 것 같나요?",
      "몇 분 뒤 이 인물은 하고 있을 일을 상상해본다면 무엇인가요?",
      "이 길로 들어서기 전에 그는 어떤 일을 마무리하고 있었을까요?",
      "이 봉투를 내려놓거나 올려둔 뒤, 그는 어떤 행동을 이어갈 것 같나요?"
    ],
    3: [
      "햇빛과 먼지가 만들어낸 분위기에서 어떤 정서가 느껴지나요?",
      "당신이 보기에, 그는 어떤 것을 치우고 있는 중으로 보이나요?",
      "이 장면 바로 다음 컷을 상상한다면 어떤 모습일까요?"
    ],
    4: [
      "그는 다른 작업을 시작하려고 하는 것일까요? 아님 작업의 정리를 하려고 하는 것일까요?",
      "그가 마주하게 될 '다음 동작'은 무엇일지 어떻게 예상하나요?",
      "지금 그의 마음을 한 문장으로 표현한다면 어떻게 말할 수 있을까요?",
    ]
  }
};

// 포스터 2 질문 데이터
const poster2Questions = {
  people: {
    1: [
      "그는 왜 여기서 멈췄을까요?",
      "그는 상점 유리창을 조용히 들여다봅니다. 무엇이 그의 시선을 붙잡았나요?",
      "그의 이어폰 속에는 어떤 소리가 흐르고 있을까요?",
      "잠시 서서 상품을 바라보는 동안, 그는 어떤 생각을 하고 있을까요?"
    ],
    2: [
      "그는 시간을 확인한 뒤 신호등으로 향합니다. 그 순간, 그의 머릿속에 어떤 생각이 스쳤을까요?",
      "비 오는 거리에서 신호를 기다리는 그의 뒷모습. 그는 누구를 만나러 가는 사람처럼 보이나요?",
      "붉은 신호 앞에서 잠시 멈춘 그는 무엇을 떠올리고 있었을까요?",
    ],
    3: [
      "화면이 전환된 뒤, 그는 쇼핑백을 들고 나옵니다. 그는 어디에 들렀던 것처럼 보이나요?",
      "신호를 건넌 뒤 원래 있던 곳으로 돌아온 것처럼 보입니다. 그가 이곳에 온 이유는 무엇일까요?",
      "무언가를 사 온 것 같습니다. 이 쇼핑은 누구를 위한 것 같나요? 자기 자신일까요, 누군가일까요?",
      "그는 쇼핑백 하나를 들고 있는 모습입니다. 그의 다음 목적지는 어디일 거 같나요?"
    ],
    4: [
      "그는 쇼핑백을 들고 걷다가 한 여성을 만납니다. 두 사람이 어떤 사이처럼 보이나요?",
      "쇼핑백을 건네는 그의 표정과 손짓. 그는 어떤 말을 건네고 있을 것 같나요?",
      "그는 쇼핑백을 여성에게 건넵니다. 이 쇼핑백에는 어떤 선물이 들어있을 것 같나요?"
    ]
  },
  taxi: {
    1: [
      "이 택시는 어디로 향하고 있다고 느껴지나요?",
      "이 택시 안에 승객이 타 있을까요? 아님 승객을 타우러 가는 길일까요?",
      "비로 젖은 도로 위를 달리는 이 택시는, 조금 전 어떤 상황을 지나왔을까요?",
      "방금 신호를 통과한 택시는 곧 어떤 장면과 마주칠 것 같나요?",
      "비로 젖은 도로 위를 달리는 이 택시를 당신이 타고 있다면, 당신이 듣고 있을 음악의 분위기는 어떤가요?"
    ],
    2: [
      "이 택시가 왜 비상등을 켜고 있을까요? 누군가를 태우기 위해 멈추려는 걸까요, 아니면 다른 길로 새어 나가려는 걸까요?",
      "이 장면 이후의 '다음 한 컷'을 상상한다면 어떤 모습일까요?"
    ],
    3: [
      "이 택시는 지금 왜 좌우로 빠르게 움직이고 있을까요?",
      "운전자는 지금 무엇을 가장 신경 쓰고 있을까요?",
      "이 장면 이후의 '다음 한 컷'을 상상한다면 어떤 모습일까요?"
    ],
    4: [
      "그의 표정에서 가장 먼저 읽힌 감정은 무엇인가요?",
      "이 눈빛은 승객을 향한 것일까요, 자신의 상태를 점검하는 것일까요?",
      "백미러 너머에는 어떤 승객이 앉아 있는 것 같나요?",
      "다음 순간 그는 어떤 행동을 할 것 같나요?",
      "이 택시가 향하는 목적지는 어떤 장소라고 상상되나요?",
      "이 상황을 보며 느낀 첫 감정은 무엇인가요?"
    ]
  }
};

// 포스터 3 질문 데이터
const poster3Questions = {
  bike: {
    1: [
      "인물이 이 시간대에 이곳을 자전거로 달리는 이유는 무엇이라고 생각하나요?",
      "이 호수 주변은 이 인물에게 어떤 의미를 가진 공간일까요?",
      "노을 지는 시간대에 자전거를 타는 이 인물의 감정은 어떨 거 같나요?"
    ],
    2: [
      "그는 지금 '무엇'을 찍으려고 하는 것 같나요?",
      "그는 사진을 취미로 즐기는 사람일까요, 아니면 기록을 중시하는 사람일까요?",
      "그는 이 장소에 '사진을 찍기 위해' 온 걸까요, 아니면 촬영은 우연히 찾아온 순간일까요?",
      "이 인물이 사진을 남기고 싶어 한 이유는 무엇일까요? 특별한 날일까요, 아니면 평범한 하루의 어떤 장면일까요?",
      "혹시 그는 누군가의 모습을 찍고 있는 걸까요, 아니면 풍경을 찍으며 혼자만의 시간을 기록하고 있는 걸까요?"
    ],
    3: [
      "인물이 손을 흔드는 표정에서 어떤 감정이 가장 먼저 느껴지나요?",
      "인물이 손을 흔드는 대상은 어떤 사람일까요?",
      "그는 어디에서 어디로 가는 중이었을까요?"
    ],
    4: [
      "두 사람 사이의 관계는 무엇이라고 느껴지나요?",
      "이 인물들이 이 장소에서 만나게 된 이유는 무엇일까요?",
      "두 사람이 지금 나누고 있는 대화의 분위기는 어떤가요?"
    ]
  },
  boat: {
    1: [
      "이 인물이 보트를 타고 가고 있는 곳은 어떤 공간일까요?",
      "이 인물은 혼자 이곳에 온 것일까요, 아니면 누군가와 함께 왔다가 혼자 남은 것일까요?",
      "노을 지는 시간대에 혼자 보트를 타는 이 인물의 감정은 어떨 거 같나요?"
    ],
    2: [
      "인물이 손가락으로 가리키는 곳에는 무엇이 있다고 생각하나요?",
      "그가 지금 \"누군가에게 보여주고 싶은 장면\"은 무엇이라고 생각하나요?",
      "인물이 이 장면을 함께 보고 있다고 생각하는 사람은 누구일까요?",
      "인물이 누군가에게 이 장면을 설명하려는 듯 보이나요? 그 대상은 누구일까요?"
    ],
    3: [
      "이 두 사람은 어떤 관계로 보이나요? 이 둘은 어디로 가고 있는 중일까요?",
      "이들이 함께 이곳을 걷게 된 이유는 무엇일까요?",
      "둘의 분위기는 어떤 것 같나요?"
    ],
    4: [
      "이 장소는 두 사람에게 어떤 의미를 가진 공간일까요",
      "당신이 이 둘 중 한 사람이라면, 지금 어떤 생각을 하고 있을까요?",
      "왜 두 사람은 이 장소에 서있을까요?"
    ]
  }
};

export async function POST(request: NextRequest) {
  try {
    // 가장 먼저 환경 변수 확인
    const apiKey = process.env.OPENAI_API_KEY;
    console.log('🚀 API 라우트 시작 - 환경 변수 확인:', {
      OPENAI_API_KEY_exists: !!apiKey,
      OPENAI_API_KEY_length: apiKey?.length || 0,
      OPENAI_API_KEY_startsWith: apiKey?.startsWith('sk-') || false,
      OPENAI_API_KEY_preview: apiKey ? `${apiKey.substring(0, 7)}...${apiKey.substring(apiKey.length - 4)}` : '없음',
      allEnvKeys: Object.keys(process.env).filter(k => k.includes('OPENAI') || k.includes('API')).join(', ')
    });
    
    const { messages, turnCount, selectedType, selectedPoster } = await request.json();

    // API 키 확인 (디버깅용)
    const hasApiKey = !!process.env.OPENAI_API_KEY;
    console.log('🔑 OpenAI API 키 상태:', hasApiKey ? '설정됨' : '설정되지 않음');

    let systemPrompt = '';
    let response = '';

    // 질문 선택 로직 (새롭게 구현)
    // turnCount: 0, 1, 2, 3 → 각각 people/taxi 1, 2, 3, 4 질문
    const questionIndex = turnCount + 1; // 1, 2, 3, 4
    
    // 포스터 체크 (문자열 또는 숫자 모두 허용)
    const posterStr = String(selectedPoster);
    const isPoster1 = posterStr === '1' || selectedPoster === 1;
    const isPoster2 = posterStr === '2' || selectedPoster === 2;
    const isPoster3 = posterStr === '3' || selectedPoster === 3;
    
    // 타입 체크 (people, car, taxi, bike, boat)
    const typeStr = String(selectedType || '').toLowerCase().trim();
    const isPeople = typeStr === 'people';
    const isCar = typeStr === 'car';
    const isTaxi = typeStr === 'taxi';
    const isBike = typeStr === 'bike';
    const isBoat = typeStr === 'boat';
    
    console.log('🔍 질문 선택 시작:', {
      turnCount,
      questionIndex,
      selectedPoster,
      selectedType,
      typeStr,
      isPoster2,
      isPeople,
      isTaxi
    });
    
    // 질문 선택
    if (turnCount < 4) {
      // 0-3턴: 질문 선택
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let questionSet: any = null;
      let questionType: string = '';
      
      // 포스터 1 질문 선택
      if (isPoster1 && (isPeople || isCar)) {
        questionType = isPeople ? 'people' : 'car';
        questionSet = poster1Questions[questionType as 'people' | 'car'];
      }
      // 포스터 2 질문 선택
      else if (isPoster2 && (isPeople || isTaxi)) {
        questionType = isPeople ? 'people' : 'taxi';
        questionSet = poster2Questions[questionType as 'people' | 'taxi'];
      }
      // 포스터 3 질문 선택
      else if (isPoster3 && (isBike || isBoat)) {
        questionType = isBike ? 'bike' : 'boat';
        questionSet = poster3Questions[questionType as 'bike' | 'boat'];
      }
      
      if (questionSet && questionSet[questionIndex as 1 | 2 | 3 | 4]) {
        const questions = questionSet[questionIndex as 1 | 2 | 3 | 4];
        
        console.log('📋 질문 세트 확인:', {
          questionType,
          hasQuestionSet: !!questionSet,
          questionIndex,
          hasQuestionIndex: questionSet ? !!questionSet[questionIndex as 1 | 2 | 3 | 4] : false
        });
        
        console.log('📋 질문 배열:', {
          questionType,
          questionIndex,
          questionsCount: Array.isArray(questions) ? questions.length : 0,
          questions: Array.isArray(questions) ? questions : '없음'
        });
        
        if (Array.isArray(questions) && questions.length > 0) {
          // 랜덤으로 질문 선택
          const randomIndex = Math.floor(Math.random() * questions.length);
          response = questions[randomIndex];
          console.log('✅ 질문 선택 완료:', {
            questionType,
            questionIndex,
            randomIndex,
            totalQuestions: questions.length,
            selectedQuestion: response
          });
        } else {
          console.error('❌ 질문 배열이 비어있음:', { questionType, questionIndex, questions });
          response = "이 영상 속 상황에 대해 어떻게 생각하시나요?";
        }
      } else {
        // 질문 데이터가 없는 경우 기본 질문
        console.warn('⚠️ 조건 불만족 - 기본 질문 사용:', {
          isPoster1,
          isPoster2,
          isPeople,
          isCar,
          isTaxi,
          selectedPoster,
          selectedType,
          turnCount
        });
        if (turnCount === 0) {
          response = "CCTV 속 보이는 인물은 지금 어떤 행동을 하고 있는거 같나요?";
        } else {
          response = "이 영상 속 상황에 대해 더 자세히 말씀해주세요.";
        }
      }
    } else if (turnCount === 4) {
      // 4턴 (4개 질문 완료): 분석 시작
      // ⚠️ 여기서만 AI를 사용합니다. 질문은 위에서 제공된 질문 목록에서만 선택됩니다.
      response = "분석을 시작하겠습니다";
      
      console.log('🔍 분석 단계 시작:', {
        turnCount,
        hasApiKey: !!process.env.OPENAI_API_KEY,
        messagesCount: messages.length
      });
      
      // API 키 확인 (분석 부분만 필요 - 질문 생성에는 AI 사용 안 함)
      if (!process.env.OPENAI_API_KEY) {
        console.error('❌ OpenAI API 키가 설정되지 않았습니다. 분석을 건너뜁니다.');
        // API 키가 없어도 분석 시작 메시지는 반환하고 isAnalysis: true로 설정하여 페이지 이동 가능하게 함
        return NextResponse.json({
          content: response,
          analysis: null,
          isAnalysis: true, // 페이지 이동을 위해 true로 설정
          error: 'AI 서비스가 설정되지 않아 분석을 생성할 수 없습니다.'
        });
      }
      
      console.log('✅ OpenAI API 키 확인됨, 분석 생성 시작');
      
      // AI를 사용하여 분석 결과 생성 (질문 생성이 아님)
      const conversationHistory = messages.map((msg: ChatMessage) => `${msg.role}: ${msg.content}`).join('\n');
      
      // 간단하고 명확한 systemPrompt로 변경
      systemPrompt = `당신은 CCTV 영상 속 인물을 관찰한 사용자의 대화 내용을 분석하는 전문가입니다.

사용자와의 대화 내용을 바탕으로 다음 7가지 분석 지표를 종합하여 분석하세요:
1. 인지적 해석: 관찰 우선순위, 의미부여 경향, 인지적 초점
2. 감정 공감: 감정 인식 민감도, 투사/공감 방식, 정서 반응성
3. 상상적 보완: 상상 경향, 사고의 확산성
4. 가치 판단: 가치 기준, 판단 스타일
5. 상황 판단: 논리 판단, 문제 해결 방향, 우선순위 설정
6. 대인 감수성: 관계 지향성, 공감 구조, 대인 감각
7. 자기 투사: 자기 동일시 방식, 감정 투사, 경험 기반 해석

중요 규칙:
- 사용자가 실제로 답변한 내용만 바탕으로 분석하세요
- 사용자가 언급하지 않은 것(옷차림, 직업, 나이대 등)은 추측하지 마세요
- 각 지표를 개별적으로 나열하지 말고, 7가지 지표를 모두 종합하여 하나의 통합된 분석 결과를 생성하세요
- 분석 결과는 200-300자의 한국어로, 2-3개의 문장으로 구성된 자연스러운 문단 형태로 작성하세요
- 문장은 20-30자 이내로 짧게 작성하고, 문장 끝에 줄바꿈을 넣어 가독성을 높이세요

다음 JSON 형식으로만 응답하세요:
{
  "analysis": "여기에 분석 결과를 작성하세요"
}`;

      // API 키 상세 확인
      const apiKey = process.env.OPENAI_API_KEY;
      console.log('🔍 API 키 상세 확인:', {
        exists: !!apiKey,
        length: apiKey?.length || 0,
        startsWithSk: apiKey?.startsWith('sk-') || false,
        first10: apiKey?.substring(0, 10) || '없음',
        last4: apiKey?.substring(apiKey.length - 4) || '없음'
      });
      
      const openai = getOpenAIClient();
      if (!openai) {
        console.error('❌ OpenAI 클라이언트 생성 실패 - API 키 없음');
        console.error('🔍 환경 변수 확인:', {
          OPENAI_API_KEY: apiKey ? `${apiKey.substring(0, 10)}...` : '없음',
          allEnvKeys: Object.keys(process.env).filter(k => k.includes('OPENAI') || k.includes('API'))
        });
        // API 키가 없어도 분석 시작 메시지는 반환하고 isAnalysis: true로 설정하여 페이지 이동 가능하게 함
        return NextResponse.json({
          content: response,
          analysis: null,
          isAnalysis: true, // 페이지 이동을 위해 true로 설정
          error: 'AI 서비스가 설정되지 않아 분석을 생성할 수 없습니다.'
        });
      }

      console.log('🤖 OpenAI API 호출 시작');
      console.log('📝 대화 내용:', conversationHistory);
      console.log('📊 메시지 개수:', messages.length);
      console.log('📋 메시지 상세:', JSON.stringify(messages, null, 2));
      
      try {
        // 실제 대화 내용을 messages 배열에 포함
        const apiMessages = messages.map((msg: ChatMessage) => ({
          role: msg.role === 'user' ? 'user' as const : 'assistant' as const,
          content: msg.content
        }));

        console.log('📤 API에 전달할 메시지:', JSON.stringify(apiMessages, null, 2));
        console.log('📏 API 메시지 개수:', apiMessages.length);
        console.log('🔑 API 키 존재 여부:', !!process.env.OPENAI_API_KEY);
        console.log('🔑 API 키 앞 10자:', process.env.OPENAI_API_KEY?.substring(0, 10) || '없음');

        // system prompt에 대화 내용을 포함하지 않고, messages 배열에만 의존
        const requestMessages = [
          { role: "system", content: systemPrompt },
          ...apiMessages
        ];
        
        console.log('📨 최종 요청 메시지 (처음 3개):', requestMessages.slice(0, 3).map(m => ({
          role: m.role,
          contentLength: m.content.length,
          contentPreview: m.content.substring(0, 100) + '...'
        })));
        
        console.log('📨 최종 요청 메시지 구조:', {
          systemPromptLength: systemPrompt.length,
          userMessagesCount: apiMessages.filter((m: { role: string }) => m.role === 'user').length,
          assistantMessagesCount: apiMessages.filter((m: { role: string }) => m.role === 'assistant').length,
          totalMessages: requestMessages.length
        });

        // API 호출 전 최종 확인
        const finalApiKey = process.env.OPENAI_API_KEY;
        console.log('🔍 API 호출 직전 최종 확인:', {
          keyExists: !!finalApiKey,
          keyLength: finalApiKey?.length || 0,
          keyStartsWith: finalApiKey?.startsWith('sk-') || false,
          keyPreview: finalApiKey ? `${finalApiKey.substring(0, 10)}...${finalApiKey.substring(finalApiKey.length - 6)}` : '없음',
          keyFormat: finalApiKey?.match(/^sk-[a-zA-Z0-9]+$/) ? '올바른 형식' : '잘못된 형식 또는 특수문자 포함'
        });

        const completion = await openai.chat.completions.create({
          model: "gpt-4",
          messages: requestMessages,
          max_tokens: 2000,
          temperature: 0.8,
        });

        console.log('✅ OpenAI API 호출 성공');
        console.log('📊 API 응답 상세:', {
          model: completion.model,
          choicesCount: completion.choices.length,
          usage: completion.usage,
          finishReason: completion.choices[0]?.finish_reason
        });
        const analysisText = completion.choices[0]?.message?.content || '';
        console.log('📄 분석 결과 받음 (전체):', analysisText);
        console.log('📄 분석 결과 길이:', analysisText.length);
        
        // 분석 텍스트가 없으면 에러
        if (!analysisText || analysisText.trim().length === 0) {
          console.error('❌ 분석 결과가 비어있습니다.');
          throw new Error('OpenAI API가 빈 응답을 반환했습니다.');
        }
        
        let analysisTextValue = '';
        
        try {
          // JSON 파싱 시도
          const parsedData = JSON.parse(analysisText);
          console.log('✅ 분석 데이터 JSON 파싱 성공');
          
          // analysis 필드 추출 (객체인 경우 analysis 속성에서, 문자열인 경우 직접 사용)
          analysisTextValue = typeof parsedData === 'object' && parsedData !== null && 'analysis' in parsedData
            ? parsedData.analysis
            : typeof parsedData === 'string'
            ? parsedData
            : analysisText;
        } catch (parseError) {
          console.warn('⚠️ JSON 파싱 실패, 일반 텍스트로 처리:', parseError);
          // JSON 파싱 실패 시에도 실제 API 응답을 사용 (기본값 사용 안 함)
          analysisTextValue = analysisText;
        }
        
        // 분석 텍스트가 여전히 비어있으면 에러
        if (!analysisTextValue || analysisTextValue.trim().length === 0) {
          console.error('❌ 최종 분석 텍스트가 비어있습니다.');
          throw new Error('분석 텍스트를 추출할 수 없습니다.');
        }
        
        console.log('✅ 최종 분석 텍스트:', analysisTextValue.substring(0, 100) + '...');
        
        // 줄바꿈이 포함된 분석 텍스트를 객체로 감싸서 반환
        const analysisData = {
          analysis: analysisTextValue
        };
        
        return NextResponse.json({
          content: response,
          analysis: analysisData,
          isAnalysis: true
        });
      } catch (apiError) {
        console.error('❌ OpenAI API 호출 실패:', apiError);
        console.error('API 오류 상세:', {
          message: apiError instanceof Error ? apiError.message : String(apiError),
          name: apiError instanceof Error ? apiError.name : undefined,
          stack: apiError instanceof Error ? apiError.stack : undefined
        });
        
        // API 키 정보 다시 로깅
        const apiKey = process.env.OPENAI_API_KEY;
        console.error('🔍 에러 발생 시 API 키 상태:', {
          exists: !!apiKey,
          length: apiKey?.length || 0,
          startsWithSk: apiKey?.startsWith('sk-') || false,
          first10: apiKey?.substring(0, 10) || '없음'
        });
        
        // 401 에러 (API 키 문제)인 경우 명확한 메시지 반환
        const errorMessage = apiError instanceof Error ? apiError.message : String(apiError);
        if (errorMessage.includes('401') || errorMessage.includes('Incorrect API key') || errorMessage.includes('Invalid API key') || errorMessage.includes('Unauthorized') || errorMessage.includes('invalid_api_key')) {
          console.error('🔑 API 키 오류 감지: OpenAI가 API 키를 거부했습니다.');
          console.error('🔍 현재 API 키 정보:', {
            exists: !!apiKey,
            length: apiKey?.length || 0,
            format: apiKey?.startsWith('sk-') ? '올바른 형식' : '잘못된 형식',
            preview: apiKey ? `${apiKey.substring(0, 7)}...${apiKey.substring(apiKey.length - 4)}` : '없음',
            fullKey: apiKey // 디버깅용 (실제 운영에서는 제거해야 함)
          });
          console.error('⚠️ 해결 방법:');
          console.error('1. OpenAI 대시보드(https://platform.openai.com/api-keys)에서 새 API 키 생성');
          console.error('2. 전체 키를 복사 (공백 없이)');
          console.error('3. Vercel 환경 변수에서 기존 키 삭제 후 새 키 추가');
          console.error('4. 재배포');
          return NextResponse.json({
            content: response,
            analysis: null,
            isAnalysis: true,
            error: `OpenAI API 키가 올바르지 않습니다. 새 API 키를 생성하여 Vercel 환경 변수에 다시 설정해주세요. (에러: ${errorMessage})`
          }, { status: 401 });
        }
        
        // 기타 API 에러는 상위로 전달
        throw apiError;
      }
    } else {
      // 7턴 이상: 더 이상 처리하지 않음
      response = "분석이 완료되었습니다.";
    }

    console.log('📤 최종 응답:', {
      content: response,
      turnCount,
      hasContent: !!response
    });

    return NextResponse.json({
      content: response,
      analysis: null,
      isAnalysis: false
    });

  } catch (error) {
    console.error('❌ API 라우트 오류:', error);
    console.error('오류 상세:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    // 에러 발생 시 기본 메시지 반환
    return NextResponse.json({
      content: "죄송합니다. AI 서비스에 일시적인 문제가 있습니다. 잠시 후 다시 시도해주세요.",
      analysis: null,
      isAnalysis: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
