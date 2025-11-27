import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

interface ChatMessage {
  role: string;
  content: string;
}

// OpenAI 인스턴스를 지연 초기화 (빌드 시점 에러 방지)
function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
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
      
      systemPrompt = `당신은 CCTV 영상 속 인물 분석 전문가입니다. 사용자와의 대화를 바탕으로 7가지 분석 지표를 활용하여 심층적인 분석을 생성해주세요:

중요: 사용자가 실제로 답변한 내용만 바탕으로 분석하세요. 사용자가 언급하지 않은 것(옷차림, 직업, 나이대 등)은 추측하지 마세요.

다음 7가지 분석 지표를 바탕으로 사용자의 답변을 분석하세요:

1. 인지적 해석(Meaning-Making)
   - 관찰 우선순위: 사용자가 무엇을 먼저 주목했는가?
   - 의미부여 경향: 사용자가 상황에 어떤 의미를 부여했는가?
   - 인지적 초점: 사람/환경/상징 중 어디에 집중했는가?

2. 감정 공감(Empathic Resonance)
   - 감정 인식 민감도: 사용자가 인물의 감정을 얼마나 민감하게 인식했는가?
   - 투사/공감 방식: 자신의 감정을 투사했는가, 아니면 인물의 입장에서 공감했는가?
   - 정서 반응성: 어떤 감정에 가장 강하게 반응했는가?

3. 상상적 보완(Imaginative Completion)
   - 상상 경향: 현실적/서사적/감정 중심/추상적 중 어떤 방식으로 상상했는가?
   - 사고의 확산성: 얼마나 넓게, 깊게 상상했는가?

4. 가치 판단(Value Orientation)
   - 가치 기준: 노동/성실/안전/평등/환경/도시 등 어떤 가치를 드러냈는가?
   - 판단 스타일: 도덕적/실용적/감정적 중 어떤 방식으로 판단했는가?

5. 상황 판단(Situational Reasoning)
   - 논리 판단: 논리적 추론을 얼마나 사용했는가?
   - 문제 해결 방향: 문제를 어떻게 해석하고 해결하려 했는가?
   - 우선순위 설정 방식: 무엇을 가장 중요하게 여겼는가?

6. 대인 감수성(Interpersonal Lens)
   - 관계 지향성: 관계와 상호작용에 얼마나 주목했는가?
   - 외향/내향적 공감 구조: 타인과의 관계를 어떻게 이해했는가?
   - 대인 감각: 사람들 간의 관계를 얼마나 세밀하게 파악했는가?

7. 자기 투사(Self-Projection)
   - 자기 동일시 방식: 자신을 인물과 어떻게 동일시했는가?
   - 감정 투사: 자신의 경험이나 감정을 얼마나 투사했는가?
   - 경험 기반 해석 패턴: 자신의 경험을 바탕으로 어떻게 해석했는가?

대화 내용:
${conversationHistory}

사용자가 실제로 답변한 내용만 바탕으로 위 7가지 지표를 종합하여 분석하세요. 각 지표를 개별적으로 나열하지 말고, 7가지 지표를 모두 종합하여 하나의 통합된 분석 결과를 생성하세요.

분석 결과는 3줄 정도의 자연스러운 문단 형태로 작성하되, 다음 요소들을 포함해야 합니다:
- 사용자의 관찰 우선순위와 의미부여 방식
- 감정 인식과 공감 방식
- 상상력과 사고의 확산성
- 가치 기준과 판단 스타일
- 논리적 추론과 문제 해결 접근
- 대인 관계에 대한 감수성
- 자기 경험의 투사 방식

중요: 분석 텍스트를 작성할 때 가독성을 최우선으로 고려하세요:
- 각 문장은 20-30자 이내로 짧게 작성하여 단어 중간에 줄바꿈이 일어나지 않도록 하세요
- 문장 끝(마침표, 물음표, 느낌표) 뒤에 줄바꿈(\n)을 넣어 문장 단위로 구분하세요
- 쉼표 뒤에도 필요시 줄바꿈을 넣을 수 있지만, 문장의 의미가 끊기지 않도록 주의하세요
- 문단을 나눌 때는 빈 줄(\n\n)을 사용하세요
- 한 문장이 너무 길어지면 두 개의 짧은 문장으로 나누세요
- 단어 중간에 줄바꿈이 일어나면 가독성이 크게 떨어지므로, 반드시 문장 끝이나 자연스러운 구분점에서만 줄바꿈하세요

다음 JSON 형식으로 응답해주세요:
{
  "analysis": "7가지 지표를 종합한 통합 분석 결과 (한국어, 3줄 정도, 200-300자, 자연스러운 줄바꿈 포함)"
}`;

      const openai = getOpenAIClient();
      if (!openai) {
        console.error('❌ OpenAI 클라이언트 생성 실패 - API 키 없음');
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

        const requestMessages = [
          { role: "system", content: systemPrompt },
          ...apiMessages,
          { role: "user", content: "위 대화 내용을 바탕으로 7가지 분석 지표를 종합하여 분석 결과를 생성해주세요." }
        ];
        
        console.log('📨 최종 요청 메시지 구조:', {
          systemPromptLength: systemPrompt.length,
          userMessagesCount: apiMessages.filter((m: { role: string }) => m.role === 'user').length,
          assistantMessagesCount: apiMessages.filter((m: { role: string }) => m.role === 'assistant').length,
          totalMessages: requestMessages.length
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
        
        try {
          // JSON 파싱 시도
          const parsedData = JSON.parse(analysisText);
          console.log('✅ 분석 데이터 JSON 파싱 성공');
          
          // analysis 필드 추출 (객체인 경우 analysis 속성에서, 문자열인 경우 직접 사용)
          const analysisTextValue = typeof parsedData === 'object' && parsedData !== null && 'analysis' in parsedData
            ? parsedData.analysis
            : typeof parsedData === 'string'
            ? parsedData
            : analysisText;
          
          // 줄바꿈이 포함된 분석 텍스트를 객체로 감싸서 반환
          const analysisData = {
            analysis: analysisTextValue
          };
          
          return NextResponse.json({
            content: response,
            analysis: analysisData,
            isAnalysis: true
          });
        } catch (parseError) {
          console.error('❌ JSON 파싱 실패:', parseError);
          // JSON 파싱 실패 시 기본 분석 데이터 사용
          const analysisData = {
            analysis: "당신의 시선은 감정의 파동을 먼저 읽어내는 방식입니다. 타인의 행동보다 분위기와 미묘한 감정을 먼저 포착하며, 그 흐름 속에서 의미를 찾으려는 경향이 뚜렷합니다. 상황을 논리적으로 분석하기보다는 감정적 공감을 통해 이해하려 하며, 자신의 경험을 자연스럽게 투사합니다. 대인 관계에 대한 세심한 관찰력을 보여주며, 상상력을 통해 상황을 확장하여 해석하는 경향이 있습니다."
          };
          
          console.log('⚠️ 기본 분석 데이터 사용');
          return NextResponse.json({
            content: response,
            analysis: analysisData,
            isAnalysis: true
          });
        }
      } catch (apiError) {
        console.error('❌ OpenAI API 호출 실패:', apiError);
        console.error('API 오류 상세:', {
          message: apiError instanceof Error ? apiError.message : String(apiError),
          name: apiError instanceof Error ? apiError.name : undefined,
          stack: apiError instanceof Error ? apiError.stack : undefined
        });
        
        // API 호출 실패 시에도 분석 시작 메시지는 반환하고 isAnalysis: true로 설정하여 페이지 이동 가능하게 함
        // 기본 분석 데이터를 사용하여 사용자 경험을 유지
        const analysisData = {
          analysis: "당신의 시선은 감정의 파동을 먼저 읽어내는 방식입니다. 타인의 행동보다 분위기와 미묘한 감정을 먼저 포착하며, 그 흐름 속에서 의미를 찾으려는 경향이 뚜렷합니다. 상황을 논리적으로 분석하기보다는 감정적 공감을 통해 이해하려 하며, 자신의 경험을 자연스럽게 투사합니다. 대인 관계에 대한 세심한 관찰력을 보여주며, 상상력을 통해 상황을 확장하여 해석하는 경향이 있습니다."
        };
        
        return NextResponse.json({
          content: response,
          analysis: analysisData,
          isAnalysis: true, // 페이지 이동을 위해 true로 설정
          error: apiError instanceof Error ? apiError.message : String(apiError)
        });
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
