import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: '파일 ID가 없습니다.' }, { status: 400 });
    }

    const filename = `analysis-card-${id}.png`;
    const filepath = join(process.cwd(), 'public', 'uploads', filename);

    if (!existsSync(filepath)) {
      return NextResponse.json({ error: '파일을 찾을 수 없습니다.' }, { status: 404 });
    }

    // 파일 읽기
    const fileBuffer = await readFile(filepath);
    
    // 이미지 응답 반환
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('이미지 다운로드 오류:', error);
    return NextResponse.json({ error: '이미지 다운로드 실패' }, { status: 500 });
  }
}

