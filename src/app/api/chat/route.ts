import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

interface ChatMessage {
  role: string;
  content: string;
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { messages, turnCount } = await request.json();

    // API 키 확인
    if (!process.env.OPENAI_API_KEY) {
      console.error('OpenAI API 키가 설정되지 않았습니다.');
      return NextResponse.json(
        { error: 'AI 서비스가 설정되지 않았습니다.' },
        { status: 500 }
      );
    }

    let systemPrompt = '';
    let response = '';

    if (turnCount < 5) {
      // 1-5턴: 대화 단계
      if (turnCount === 0) {
        // 첫 번째 질문 (고정)
        response = "CCTV 속 보이는 인물은 지금 어떤 행동을 하고 있는거 같나요?";
      } else {
        // 2-5턴: 사용자 답변에 따른 영상 관련 후속 질문 (얼굴 관련 제외, 중복 방지)
        const previousQuestions = messages
          .filter((msg: ChatMessage) => msg.role === 'assistant')
          .map((msg: ChatMessage) => msg.content);
        
        systemPrompt = `당신은 CCTV 영상을 분석하는 AI입니다. 사용자의 이전 답변을 바탕으로 영상과 관련된 더 깊이 있는 질문을 해주세요. 
        
        사용자의 답변: ${messages[messages.length - 1]?.content || ''}
        
        이전에 한 질문들: ${previousQuestions.join(', ')}
        
        다음 조건을 만족하는 질문을 생성해주세요:
        1. 영상 속 인물의 행동, 움직임, 자세, 의복, 환경, 시간대, 상황과 관련된 질문
        2. 얼굴, 표정, 외모, 개인적 특성과 관련된 질문은 절대 하지 마세요
        3. 이전에 한 질문과 중복되지 않는 새로운 질문
        4. 한 문장으로 자연스럽게 질문해주세요:`;
        
        const completion = await openai.chat.completions.create({
          model: "gpt-4",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: "다음 질문을 해주세요." }
          ],
          max_tokens: 200,
          temperature: 0.7,
        });
        
        response = completion.choices[0]?.message?.content || "이 영상 속 상황에 대해 더 자세히 말씀해주세요.";
      }
    } else if (turnCount === 5) {
      // 6턴: 분석 시작 알림
      response = "대답해주신 결과에 따라 CCTV 속 인물이 어떤 활동을 진행하고 있는 분석을 시작하겠습니다";
      
      // 분석 시작 메시지와 함께 분석 결과도 함께 반환
      const conversationHistory = messages.map((msg: ChatMessage) => `${msg.role}: ${msg.content}`).join('\n');
      
      systemPrompt = `당신은 CCTV 영상 분석 전문가입니다. 사용자와의 대화를 바탕으로 두 가지 상세한 분석을 생성해주세요:

1. 추적된 인물 분석 (Tracked Person Analysis): 
   - 영상 속 인물의 구체적인 행동, 표정, 자세, 의복, 환경 분석
   - 이 사람이 어떤 성격, 직업, 나이대, 사회적 지위를 가진 사람인지 추론
   - 현재 상황에서 느끼고 있는 감정과 심리 상태
   - 일상생활 패턴과 라이프스타일 추측

2. 관람자 분석 (Viewer Analysis):
   - 사용자의 답변을 통해 파악한 관람자의 성향, 감정, 사고방식
   - 관람자가 이 영상에 대해 어떤 관점으로 바라보고 있는지
   - 관람자의 사회적 배경, 가치관, 성격 특성 추론
   - 관람자가 보여준 공감 능력과 관찰력 수준

대화 내용:
${conversationHistory}

사용자의 답변을 반영하여 구체적이고 개인화된 분석을 제공해주세요.
다음 JSON 형식으로 응답해주세요:
{
  "trackedPersonAnalysis": "영상 속 인물에 대한 상세하고 구체적인 분석 (한국어, 200-300자)",
  "viewerAnalysis": "관람자에 대한 상세하고 개인화된 분석 (한국어, 200-300자)"
}`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: "분석 결과를 생성해주세요." }
        ],
        max_tokens: 1200,
        temperature: 0.8,
      });

      const analysisText = completion.choices[0]?.message?.content || '';
      
      try {
        // JSON 파싱 시도
        const analysisData = JSON.parse(analysisText);
        
        return NextResponse.json({
          content: response,
          analysis: analysisData,
          isAnalysis: true
        });
      } catch {
        // JSON 파싱 실패 시 기본 분석 데이터 사용
        const analysisData = {
          trackedPersonAnalysis: "이 사람은 30대 중반의 직장인으로 보이며, 편의점 앞에서 잠시 휴식을 취하고 있습니다. 어깨가 축 늘어져 있는 자세와 한숨을 쉬는 듯한 모습에서 하루의 피로감이 느껴집니다. 깔끔한 정장 차림과 가방을 보면 사무직에 종사하는 것으로 추정되며, 현재 업무 스트레스나 개인적인 고민으로 인한 무기력감을 느끼고 있는 것 같습니다. 도시 생활의 일상적 피로와 고독감이 표정에 드러나 있습니다.",
          viewerAnalysis: "관람자는 이 사람의 상황에 깊은 공감을 보이며, 도시 생활의 현실적인 어려움을 이해하고 있습니다. 세심한 관찰력으로 인물의 미묘한 감정 변화까지 포착하는 능력이 뛰어나며, 타인의 고통에 대한 민감한 감수성을 가지고 있습니다. 사회적 약자나 힘든 상황에 있는 사람들에 대한 배려심이 깊고, 현대 사회의 개인주의적 경향에 대해 비판적 사고를 하는 것으로 보입니다."
        };
        
        return NextResponse.json({
          content: response,
          analysis: analysisData,
          isAnalysis: true
        });
      }
    } else {
      // 7턴 이상: 더 이상 처리하지 않음
      response = "분석이 완료되었습니다.";
    }

    return NextResponse.json({
      content: response,
      analysis: null,
      isAnalysis: false
    });

  } catch (error) {
    console.error('OpenAI API 오류:', error);
    
    // API 오류 시 fallback 응답
    const fallbackResponses = [
      "죄송합니다. 잠시 후 다시 시도해주세요.",
      "AI 서비스에 일시적인 문제가 있습니다. 잠시만 기다려주세요.",
      "네트워크 연결을 확인해주세요."
    ];
    
    return NextResponse.json({
      content: fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)],
      analysis: null,
      isAnalysis: false,
      error: 'API 오류가 발생했습니다.'
    });
  }
}
