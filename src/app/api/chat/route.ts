import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { messages, turnCount, selectedPerson } = await request.json();

    let response = '';
    
    if (turnCount < 3) {
      if (turnCount === 0) {
        // 1턴: 고정된 첫 번째 질문
        response = "CCTV 속 보이는 인물은 지금 어떤 행동을 하고 있는거 같나요?";
      } else {
        // 2-3턴: 더미 후속 질문
        const followUpQuestions = [
          "그 행동을 보면서 어떤 감정을 느끼시나요?",
          "이 상황에서 당신이라면 어떻게 행동하실 것 같나요?"
        ];
        response = followUpQuestions[turnCount - 1] || "이 상황에 대해 더 자세히 말씀해주세요.";
      }
    } else if (turnCount === 3) {
      // 4턴: 분석 시작 알림
      response = "분석을 시작하겠습니다...";
    } else {
      // 5턴: 최종 분석 결과 생성 (더미 데이터)
      const analysisData = {
        trackedPersonAnalysis: "이 사람은 편의점 앞에서 휴식을 취하고 있는 것으로 보입니다. 혼자 앉아 있는 모습에서 고독감이나 피로감을 느끼고 있을 수 있습니다. 도시 생활의 피로와 일상의 무료함이 느껴지는 모습입니다.",
        viewerAnalysis: "관람자는 이 사람의 상황에 공감하고 있으며, 도시 생활의 피로와 고독감에 대해 깊이 생각하고 있습니다. 타인에 대한 배려심과 공감 능력이 뛰어난 것으로 보입니다."
      };
      
      return NextResponse.json({
        content: "분석이 완료되었습니다.",
        analysis: analysisData,
        isAnalysis: true
      });
    }

    return NextResponse.json({
      content: response,
      analysis: null,
      isAnalysis: false
    });

  } catch (error) {
    console.error('API 오류:', error);
    return NextResponse.json(
      { error: '응답 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
