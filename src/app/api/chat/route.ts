import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { messages, turnCount, selectedPerson } = await request.json();

    // 시스템 프롬프트 설정
    let systemPrompt = '';
    
    if (turnCount < 3) {
      // 1-3턴: 영상 속 인물에 대한 질문
      systemPrompt = `당신은 영상 분석 전문가입니다. 
      영상 속 인물의 행동, 감정, 상황을 분석하여 질문을 던지세요.
      질문은 간단하고 구체적으로 하세요.
      한국어로 답변하세요.`;
    } else if (turnCount === 3) {
      // 4턴: 분석 시작 알림
      systemPrompt = `이제 3턴의 대화를 바탕으로 분석을 시작합니다.
      "분석을 시작하겠습니다..."라고 답변하세요.`;
    } else {
      // 5턴: 최종 분석 결과 생성
      systemPrompt = `당신은 심리학자이자 행동 분석 전문가입니다.
      
      다음 정보를 바탕으로 2개의 분석 결과를 생성하세요:
      
      1. **추적된 인물 분석**:
      - 선택된 인물: ${selectedPerson ? selectedPerson.label : '알 수 없음'}
      - 위치: (${selectedPerson ? selectedPerson.x : 0}, ${selectedPerson ? selectedPerson.y : 0})
      - 움직임: ${selectedPerson ? (selectedPerson.isMoving ? '움직임 감지됨' : '정지 상태') : '알 수 없음'}
      
      2. **관람자 분석**:
      - 대화 패턴과 답변 내용을 분석
      
      각 분석은 200자 이내로 간결하게 작성하세요.
      JSON 형태로 응답하세요:
      {
        "trackedPersonAnalysis": "추적된 인물에 대한 분석 텍스트",
        "viewerAnalysis": "관람자에 대한 분석 텍스트"
      }`;
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    const response = completion.choices[0].message.content;

    // 5턴에서는 JSON 파싱 시도
    if (turnCount >= 4) {
      try {
        const analysisData = JSON.parse(response || '{}');
        return NextResponse.json({
          content: response,
          analysis: analysisData,
          isAnalysis: true
        });
      } catch (error) {
        console.error('JSON 파싱 오류:', error);
        return NextResponse.json({
          content: response,
          analysis: null,
          isAnalysis: false
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
    return NextResponse.json(
      { error: 'AI 응답 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
