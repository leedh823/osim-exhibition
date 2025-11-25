import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('image') as File;

    if (!file) {
      return NextResponse.json({ error: '이미지 파일이 없습니다.' }, { status: 400 });
    }

    // 고유한 파일명 생성
    const timestamp = Date.now();
    const filename = `analysis-card-${timestamp}.png`;

    // 파일을 ArrayBuffer로 변환
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Supabase Storage에 업로드
    const { data, error } = await supabaseAdmin.storage
      .from('analysis-images')
      .upload(filename, buffer, {
        contentType: 'image/png',
        upsert: false
      });

    if (error) {
      console.error('Supabase 업로드 오류:', error);
      return NextResponse.json({ error: '이미지 업로드 실패' }, { status: 500 });
    }

    // 공개 URL 생성
    const { data: urlData } = supabaseAdmin.storage
      .from('analysis-images')
      .getPublicUrl(filename);

    return NextResponse.json({ 
      id: timestamp,
      url: urlData.publicUrl 
    });
  } catch (error) {
    console.error('이미지 업로드 오류:', error);
    return NextResponse.json({ error: '이미지 업로드 실패' }, { status: 500 });
  }
}

