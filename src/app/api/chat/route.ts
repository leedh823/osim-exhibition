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
        // 2-5턴: 사용자 답변에 따른 영상 관련 후속 질문
        systemPrompt = `당신은 CCTV 영상을 분석하는 AI입니다. 사용자의 이전 답변을 바탕으로 영상과 관련된 더 깊이 있는 질문을 해주세요. 
        
        사용자의 답변: ${messages[messages.length - 1]?.content || ''}
        
        영상 속 인물의 행동, 감정, 상황, 환경, 시간대, 의복, 표정, 움직임 등과 관련된 질문을 생성해주세요. 
        한 문장으로 자연스럽게 질문해주세요:`;
        
        const completion = await openai.chat.completions.create({
          model: "gpt-4",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: "다음 질문을 해주세요." }
          ],
          max_tokens: 100,
          temperature: 0.7,
        });
        
        response = completion.choices[0]?.message?.content || "이 영상 속 상황에 대해 더 자세히 말씀해주세요.";
      }
    } else if (turnCount === 5) {
      // 6턴: 분석 시작 알림
      response = "분석을 시작하겠습니다...";
    } else {
      // 6턴: 최종 분석 결과 생성
      const conversationHistory = messages.map((msg: ChatMessage) => `${msg.role}: ${msg.content}`).join('\n');
      
      systemPrompt = `당신은 CCTV 영상 분석 전문가입니다. 사용자와의 대화를 바탕으로 두 가지 분석을 생성해주세요:

1. 추적된 인물 분석 (Tracked Person Analysis): 영상 속 인물의 행동, 감정, 상황에 대한 분석
2. 관람자 분석 (Viewer Analysis): 사용자의 답변을 통해 파악한 관람자의 성향, 감정, 사고방식 분석

대화 내용:
${conversationHistory}

다음 JSON 형식으로 응답해주세요:
{
  "trackedPersonAnalysis": "영상 속 인물에 대한 상세한 분석 (한국어)",
  "viewerAnalysis": "관람자에 대한 상세한 분석 (한국어)"
}`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: "분석 결과를 생성해주세요." }
        ],
        max_tokens: 800,
        temperature: 0.7,
      });

      const analysisText = completion.choices[0]?.message?.content || '';
      
      try {
        // JSON 파싱 시도
        const analysisData = JSON.parse(analysisText);
        
        return NextResponse.json({
          content: "분석이 완료되었습니다.",
          analysis: analysisData,
          isAnalysis: true
        });
      } catch {
        // JSON 파싱 실패 시 기본 분석 데이터 사용
        const analysisData = {
          trackedPersonAnalysis: "영상 속 인물은 도시 환경에서 일상적인 활동을 하고 있는 것으로 보입니다. 행동 패턴과 표정을 통해 현재 상황에 대한 감정과 상태를 파악할 수 있습니다.",
          viewerAnalysis: "관람자는 이 영상에 대해 깊이 있게 관찰하고 있으며, 타인에 대한 공감과 이해를 보여주고 있습니다. 세심한 관찰력과 배려심이 뛰어난 것으로 분석됩니다."
        };
        
        return NextResponse.json({
          content: "분석이 완료되었습니다.",
          analysis: analysisData,
          isAnalysis: true
        });
      }
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
