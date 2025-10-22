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
      // 1-3턴: 고정된 질문들
      const fixedQuestions = [
        "CCTV 속 보이는 인물은 지금 어떤 행동을 하고 있는거 같나요?",
        "이 사람의 행동 패턴을 보면 어떤 상황에 처해 있다고 생각하나요?",
        "이 인물의 다음 행동을 예측해본다면 무엇일까요?"
      ];
      
      systemPrompt = `다음 질문을 그대로 출력하세요: "${fixedQuestions[turnCount]}"`;
    } else if (turnCount === 3) {
      // 4턴: 분석 시작 알림
      systemPrompt = `이제 3턴의 대화를 바탕으로 분석을 시작합니다.
      "분석을 시작하겠습니다..."라고 답변하세요.`;
    } else {
      // 5턴: 최종 분석 결과 생성
      systemPrompt = `당신은 심리학자이자 CCTV 화면 분석 전문가입니다.
      
      다음 CCTV 화면 분석 정보와 대화 내용을 바탕으로 2개의 분석 결과를 생성하세요:
      
      1. **추적된 인물 분석**:
      - 선택된 인물: ${selectedPerson ? selectedPerson.label : '알 수 없음'}
      - 위치: (${selectedPerson ? Math.round(selectedPerson.x) : 0}, ${selectedPerson ? Math.round(selectedPerson.y) : 0})
      - 움직임: ${selectedPerson ? (selectedPerson.isMoving ? '움직임 감지됨' : '정지 상태') : '알 수 없음'}
      - 신뢰도: ${selectedPerson ? (selectedPerson.confidence * 100).toFixed(1) : 0}%
      - 속도: ${selectedPerson ? (selectedPerson.speed || 0).toFixed(1) : 0} 픽셀/프레임
      
      인물의 행동 패턴, 위치, 움직임 데이터와 관람자의 답변을 종합하여 분석하세요.
      
      2. **관람자 분석**:
      - 대화 패턴과 답변 내용을 분석
      - CCTV 화면에 대한 관심도와 관찰력 평가
      - 인물에 대한 공감 능력과 분석적 사고 평가
      
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
