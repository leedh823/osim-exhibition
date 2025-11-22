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
      "조용한 거리 한복판에서 문을 열고 준비를 합니다. 이 거리가 오늘 작업의 시작일까요, 이미 여러 장소를 거친 뒤일까요? 왜 그렇게 생각했나요?",
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
      "그의 표정에서 읽히는 감정은 무엇인가요 — 이해, 의문, 공감, 고민, 복잡? 왜 그렇게 생각했나요?"
    ],
    4: [
      "두 사람이 이 기록을 함께 보고 있는 이유는 무엇이라고 생각하나요?",
      "서로에게 기대고 있는 신뢰의 정도는 어느 정도로 보이나요?",
      "당신 눈에는 두 사람 중 누가 더 주도적으로 보이나요? 왜 그렇게 느꼈나요?",
      "이들이 처음 만난 동료일까요, 오래 함께 일한 팀일까요?",
      "지금 작성하는 문서가 '시작점'일까요, '마무리'일까요? 왜 그렇게 보이나요?",
      "두 사람 중 한 명이 실수를 했다면 누구라고 생각하나요? 그 이유는?",
      "이 상황에서 당신이라면 어떤 역할을 맡았을 것 같나요 — 설명하는 사람인가요, 기록하는 사람인가요?"
    ]
  },
  people: {
    1: [
      "이 순간을 그의 가족 또는 동료가 목격한다면, 어떤 말을 건넬까요?",
      "방금 그가 줍고 있는 것은 어떤 것이었을까요?",
      "이 길의 시간대는 언제라고 느껴지나요? 그 이유는 무엇인가요?",
      "그가 오늘 하루 동안 가장 많이 되뇌었던 말 한마디가 있다면 어떤 표현일까요?",
      "당신이라면 이 순간 이 인물에게 어떤 행동 혹은 말을 건네고 싶나요?"
    ],
    2: [
      "이 인물이 검은 봉투를 들고 걸어오는 이 순간, 어떤 생각을 하고 있을 것 같나요?",
      "몇 분 뒤 이 인물에게 새롭게 일어날 일을 상상해본다면 무엇인가요?",
      "이 길로 들어서기 전에 그는 어떤 일을 마무리하고 있었을까요?",
      "이 봉투를 내려놓거나 올려둔 뒤, 그는 어떤 행동을 이어갈 것 같나요?"
    ],
    3: [
      "햇빛과 먼지가 만들어낸 분위기에서 어떤 정서가 느껴지나요 — 고요, 따뜻함, 외로움, 혹은 시작의 기운?",
      "이 장면 바로 다음 컷을 상상한다면 어떤 모습일까요?"
    ],
    4: [
      "그는 다른 작업을 시작하려고 하는 것일까요? 아님 작업의 정리를 하려고 하는 것일까요?",
      "그가 마주하게 될 '다음 동작'은 무엇일지 어떻게 예상하나요?",
      "지금 그의 마음을 한 문장으로 표현한다면 어떻게 말할 수 있을까요?",
      "그의 속도로 보아, 그는 오늘 기분이 어떨 것 같나요?"
    ]
  }
};

// 포스터 2 질문 데이터
const poster2Questions = {
  people: {
    1: [
      "그는 왜 여기서 멈췄을까요?",
      "그는 상점 유리창을 조용히 들여다봅니다. 무엇이 그의 시선을 붙잡았나요?",
      "시계를 보는 순간, 그는 무엇을 떠올렸을까요?",
      "그의 이어폰 속에는 어떤 소리가 흐르고 있을까요?",
      "잠시 서서 상품을 바라보는 동안, 그의 마음속에는 어떤 고민이 오갔을까요?"
    ],
    2: [
      "그는 시간을 확인한 뒤 신호등으로 향합니다. 그 순간, 그의 머릿속에 어떤 생각이 스쳤을까요?",
      "비 오는 거리에서 신호를 기다리는 그의 뒷모습. 그는 누구를 만나러 가는 사람처럼 보이나요?",
      "붉은 신호 앞에서 잠시 멈춘 그는 무엇을 떠올리고 있었을까요?",
      "붉은 신호 앞에서 조용히 멈춰 서 있는 모습. 이 기다림 속에는 초조함과 여유 중 무엇이 더 크게 느껴지나요? 그리고 왜 그렇게 느꼈나요?",
      "그는 초록불을 기다립니다. 그가 건너가려는 곳은 어떤 장소라고 느껴지나요?",
      "그가 향하려는 장소에는 누가 있을까요?"
    ],
    3: [
      "화면이 전환된 뒤, 그는 쇼핑백을 들고 나옵니다. 그는 어디에 들렀던 것처럼 보이나요?",
      "신호를 건넌 뒤 바로 이곳에 온 것처럼 보입니다. 그가 이곳에 온 이유는 무엇일까요?",
      "무언가를 사 온 것 같습니다. 이 쇼핑은 누구를 위한 것 같나요—자기 자신일까요, 누군가일까요?",
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
      "이 택시 안에는 어떤 승객이 타고 있을 것 같나요?",
      "이 택시 안에 승객이 타 있을까요? 아님 승객을 타우러 가는 길일까요?",
      "비에 젖은 도로 위를 달리는 속도감에서 어떤 분위기가 읽히나요 — 긴박함, 평온함?",
      "비로 젖은 도로 위를 달리는 이 택시는, 조금 전 어떤 상황을 지나왔을까요?",
      "방금 신호를 통과한 택시는 곧 어떤 장면과 마주칠 것 같나요?",
      "비로 젖은 도로 위를 달리는 이 택시를 당신이 타고 있다면, 당신이 듣고 있을 음악의 분위기는 어떤가요?"
    ],
    2: [
      "이 택시가 왜 깜빡이를 켜고 있을까요? 누군가를 태우기 위해 멈추려는 걸까요, 아니면 다른 길로 새어 나가려는 걸까요?, 개인적인 일이 있는 걸까요?",
      "이 장면 이후의 '다음 한 컷'을 상상한다면 어떤 모습일까요?"
    ],
    3: [
      "이 택시는 지금 왜 이 방향으로 빠르게 움직이고 있다고 느껴지나요?",
      "운전자는 지금 무엇을 가장 신경 쓰고 있을까요?",
      "이 장면 이후의 '다음 한 컷'을 상상한다면 어떤 모습일까요?"
    ],
    4: [
      "그의 표정에서 가장 먼저 읽힌 감정은 무엇인가요 — 경계, 피로, 집중, 혹은 불안?",
      "이 눈빛은 승객을 향한 것일까요, 자신의 상태를 점검하는 것일까요?",
      "백미러 너머에는 어떤 승객이 앉아 있는 것 같나요? 그 승객은 어떤 승객일까요?",
      "승객이 이 택시에 타게 된 이유는 무엇일까요?",
      "다음 순간 그는 어떤 행동을 할 것 같나요 — 말을 건다, 침묵한다, 목적지를 다시 확인한다?",
      "이 택시가 향하는 목적지는 어떤 장소라고 상상되나요?",
      "이 상황을 보며 느낀 첫 감정은 무엇인가요?"
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
    
    // 타입 체크 (people, car, taxi)
    const typeStr = String(selectedType || '').toLowerCase().trim();
    const isPeople = typeStr === 'people';
    const isCar = typeStr === 'car';
    const isTaxi = typeStr === 'taxi';
    
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
        // API 키가 없어도 분석 시작 메시지는 반환
        return NextResponse.json({
          content: response,
          analysis: null,
          isAnalysis: false,
          error: 'AI 서비스가 설정되지 않아 분석을 생성할 수 없습니다.'
        });
      }
      
      console.log('✅ OpenAI API 키 확인됨, 분석 생성 시작');
      
      // AI를 사용하여 분석 결과 생성 (질문 생성이 아님)
      const conversationHistory = messages.map((msg: ChatMessage) => `${msg.role}: ${msg.content}`).join('\n');
      
      systemPrompt = `당신은 CCTV 영상 속 인물 분석 전문가입니다. 사용자와의 대화를 바탕으로 인물 분석에 집중한 분석을 생성해주세요:

중요: 사용자가 실제로 답변한 내용만 바탕으로 분석하세요. 사용자가 언급하지 않은 것(옷차림, 직업, 나이대 등)은 추측하지 마세요.

1. 추적된 인물 분석 (Tracked Person Analysis): 
   - 사용자가 언급한 인물의 행동, 감정, 상황만 분석
   - 사용자가 답변한 내용을 바탕으로 인물의 심리 상태와 상황 해석
   - 사용자가 관찰한 구체적인 행동이나 움직임에 대한 심층 분석
   - 인물이 현재 어떤 상황에 있는지, 어떤 감정을 느끼고 있는지 분석

2. 관람자 분석 (Viewer Analysis):
   - 사용자의 답변을 통해 드러난 관람자의 관찰력과 해석 능력
   - 사용자가 인물의 행동과 상황을 어떻게 이해하고 있는지
   - 사용자가 보여준 인물에 대한 공감과 이해도
   - 사용자의 답변에서 나타난 인물 분석 능력

대화 내용:
${conversationHistory}

사용자가 실제로 답변한 내용만 바탕으로 인물 분석에 집중하여 분석하세요. 추측이나 가정은 하지 마세요.
다음 JSON 형식으로 응답해주세요:
{
  "trackedPersonAnalysis": "사용자 답변 기반 인물 분석 (한국어, 200-300자)",
  "viewerAnalysis": "사용자 답변 기반 관람자 분석 (한국어, 200-300자)"
}`;

      const openai = getOpenAIClient();
      if (!openai) {
        console.error('❌ OpenAI 클라이언트 생성 실패 - API 키 없음');
        return NextResponse.json({
          content: response,
          analysis: null,
          isAnalysis: false,
          error: 'AI 서비스가 설정되지 않아 분석을 생성할 수 없습니다.'
        });
      }

      console.log('🤖 OpenAI API 호출 시작');
      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-4",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: "분석 결과를 생성해주세요." }
          ],
          max_tokens: 1200,
          temperature: 0.8,
        });

        console.log('✅ OpenAI API 호출 성공');
        const analysisText = completion.choices[0]?.message?.content || '';
        console.log('📄 분석 결과 받음:', analysisText ? `${analysisText.substring(0, 50)}...` : '없음');
        
        try {
          // JSON 파싱 시도
          const analysisData = JSON.parse(analysisText);
          console.log('✅ 분석 데이터 JSON 파싱 성공');
          
          return NextResponse.json({
            content: response,
            analysis: analysisData,
            isAnalysis: true
          });
        } catch (parseError) {
          console.error('❌ JSON 파싱 실패:', parseError);
          // JSON 파싱 실패 시 기본 분석 데이터 사용
          const analysisData = {
            trackedPersonAnalysis: "사용자가 관찰한 인물은 편의점 앞에서 휴식을 취하고 있는 것으로 보입니다. 사용자의 답변을 통해 인물의 행동과 상황을 분석한 결과, 이 사람은 현재 피로감이나 고독감을 느끼고 있을 가능성이 높습니다. 사용자가 언급한 구체적인 행동과 자세를 바탕으로 인물의 심리 상태를 해석한 결과입니다.",
            viewerAnalysis: "사용자는 인물의 상황에 대해 세심한 관찰력을 보여주고 있습니다. 사용자의 답변을 통해 드러난 관점과 감정을 분석한 결과, 이 관람자는 타인에 대한 공감 능력이 뛰어나고 세심한 관찰력을 가지고 있는 것으로 보입니다. 사용자가 보여준 인물에 대한 이해도와 해석 능력을 바탕으로 한 분석입니다."
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
          name: apiError instanceof Error ? apiError.name : undefined
        });
        throw apiError; // 상위 catch 블록으로 전달
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
    
    // 에러 발생 시 빈 응답 반환 (에러 메시지를 사용자에게 표시하지 않음)
    // 에러는 콘솔에만 표시됨
    return NextResponse.json({
      content: null,
      analysis: null,
      isAnalysis: false,
      error: null
    });
  }
}
