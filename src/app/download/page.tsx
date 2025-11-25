'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function DownloadPage() {
  const searchParams = useSearchParams();
  const imageData = searchParams.get('data');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!imageData) {
      setError('이미지 데이터가 없습니다.');
      return;
    }

    try {
      // base64 데이터 디코딩
      const decodedData = decodeURIComponent(imageData);
      
      // base64 데이터를 blob으로 변환
      const byteString = atob(decodedData.split(',')[1]);
      const mimeString = decodedData.split(',')[0].split(':')[1].split(';')[0];
      const ab = new ArrayBuffer(byteString.length);
      const ia = new Uint8Array(ab);
      for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }
      const blob = new Blob([ab], { type: mimeString });
      
      // 다운로드
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
    } catch (err) {
      console.error('다운로드 오류:', err);
      setError('다운로드 중 오류가 발생했습니다.');
    }
  }, [imageData]);

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

