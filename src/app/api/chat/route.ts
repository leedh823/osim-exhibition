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
      
      systemPrompt = `당신은 CCTV 영상 분석 전문가입니다. 사용자와의 대화를 바탕으로 두 가지 분석을 생성해주세요:

중요: 사용자가 실제로 답변한 내용만 바탕으로 분석하세요. 사용자가 언급하지 않은 것(옷차림, 직업, 나이대 등)은 추측하지 마세요.

1. 추적된 인물 분석 (Tracked Person Analysis): 
   - 사용자가 언급한 인물의 행동, 감정, 상황만 분석
   - 사용자가 답변한 내용을 바탕으로 인물의 심리 상태와 상황 해석
   - 사용자가 관찰한 구체적인 행동이나 표정에 대한 심층 분석

2. 관람자 분석 (Viewer Analysis):
   - 사용자의 답변을 통해 드러난 관람자의 관점과 감정
   - 사용자가 보여준 관찰력과 해석 능력
   - 사용자의 답변에서 나타난 가치관과 사고방식
   - 사용자가 이 상황에 대해 느끼는 감정과 공감 능력

대화 내용:
${conversationHistory}

사용자가 실제로 답변한 내용만 바탕으로 분석하세요. 추측이나 가정은 하지 마세요.
다음 JSON 형식으로 응답해주세요:
{
  "trackedPersonAnalysis": "사용자 답변 기반 인물 분석 (한국어, 200-300자)",
  "viewerAnalysis": "사용자 답변 기반 관람자 분석 (한국어, 200-300자)"
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
          trackedPersonAnalysis: "사용자가 관찰한 인물의 행동과 상황에 대한 분석이 필요합니다. 사용자의 답변을 바탕으로 인물의 심리 상태와 현재 상황을 해석해주세요.",
          viewerAnalysis: "사용자의 답변을 통해 드러난 관람자의 관점과 감정을 분석해주세요. 사용자가 보여준 관찰력과 해석 능력을 바탕으로 관람자의 성향을 파악해주세요."
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
