'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

export default function DownloadPage() {
  const params = useParams();
  const id = params?.id as string;
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError('다운로드 ID가 없습니다.');
      return;
    }

    // 이미지 다운로드
    const downloadImage = async () => {
      try {
        const response = await fetch(`/api/download-image?id=${id}`);
        
        if (!response.ok) {
          setError('이미지를 불러올 수 없습니다.');
          return;
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analysis-card-${id}.png`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        // 다운로드 후 2초 뒤에 페이지 닫기 또는 메시지 표시
        setTimeout(() => {
          setError('다운로드가 완료되었습니다. 이 페이지를 닫아주세요.');
        }, 2000);
      } catch (err) {
        console.error('다운로드 오류:', err);
        setError('다운로드 중 오류가 발생했습니다.');
      }
    };

    downloadImage();
  }, [id]);

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

