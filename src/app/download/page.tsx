'use client';

import { useEffect, useState } from 'react';

export default function DownloadPage() {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // URL에서 이미지 URL 가져오기
    const params = new URLSearchParams(window.location.search);
    const imageUrl = params.get('url');
    
    if (!imageUrl) {
      setError('이미지 URL이 없습니다.');
      return;
    }

    try {
      // Supabase 공개 URL에서 이미지 다운로드
      fetch(imageUrl)
        .then(response => response.blob())
        .then(blob => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `analysis-card-${Date.now()}.png`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          
          // 다운로드 후 2초 뒤에 메시지 표시
          setTimeout(() => {
            setError('다운로드가 완료되었습니다. 이 페이지를 닫아주세요.');
          }, 2000);
        })
        .catch(err => {
          console.error('다운로드 오류:', err);
          setError('이미지를 불러올 수 없습니다.');
        });
    } catch (err) {
      console.error('다운로드 오류:', err);
      setError('다운로드 중 오류가 발생했습니다.');
    }
  }, []);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-white text-center">
        {error ? (
          <p className="text-xl">{error}</p>
        ) : (
          <div>
            <p className="text-xl mb-4">이미지 다운로드 중...</p>
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto"></div>
          </div>
        )}
      </div>
    </div>
  );
}

