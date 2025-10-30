'use client';

import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function Landing() {
  const rootRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // 초기화
      gsap.set(['.parallax', '.portal-core', '.parallax-item'], { x: 0, y: 0, rotateX: 0, rotateY: 0 });
      // 히어로: 확대 + 흰 전환(단일 트윈)
      gsap.fromTo(
        '#hero .parallax',
        { scale: 1 },
        {
          scale: 1.6,
          ease: 'none',
          scrollTrigger: {
            trigger: '#hero',
            start: 'top top',
            end: '+=220%',
            pin: true,
            scrub: true,
            anticipatePin: 1,
          },
        }
      );
      gsap.to('#hero .white-overlay', {
        opacity: 1,
        ease: 'none',
        scrollTrigger: { trigger: '#hero', start: 'top top', end: '+=220%', scrub: true },
      });
      gsap.to('#pageRoot', {
        backgroundColor: '#ffffff',
        color: '#000000',
        ease: 'none',
        scrollTrigger: { trigger: '#hero', start: 'top top', end: '+=220%', scrub: true },
      });
    }, rootRef);

    // 히어로 패럴랙스
    const el = rootRef.current;
    const handler = (e: MouseEvent) => {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      // 동일 범위의 이동감을 위해 정규화 스케일을 최소변으로 통일
      const scale = Math.min(rect.width, rect.height) || 1;
      const dx = (e.clientX - cx) / scale;
      const dy = (e.clientY - cy) / scale;
      // 감도 감소 + 3D 틸트
      gsap.to('.parallax', {
        x: dx * 60,
        y: dy * 60,
        rotateY: -dx * 8,
        rotateX: dy * 6,
        transformPerspective: 800,
        transformOrigin: 'center center',
        duration: 0.25,
        ease: 'power3.out',
      });
      gsap.to('.portal-core', { x: dx * 45, y: dy * 45, duration: 0.25, ease: 'power3.out' });
      // 페이지 내 이미지/박스 블록 전체 패럴랙스(텍스트 제외) — 좌우/상하 동일 스케일로 증폭
      gsap.to('.parallax-item', { x: dx * 80, y: dy * 80, duration: 0.25, ease: 'power2.out' });
    };
    window.addEventListener('mousemove', handler);

    return () => {
      window.removeEventListener('mousemove', handler);
      ctx.revert();
    };
  }, []);

  // (삭제) 내러티브 데이터/텍스트 연출 제거

  return (
    <div ref={rootRef} id="pageRoot" className="bg-black text-white">
      {/* Hero: 이미지 + 마우스 반응 */}
      <section id="hero" className="h-screen relative overflow-hidden flex items-center justify-center bg-black">
        <img
          src="/image/2.png"
          alt="hero"
          className="parallax max-w-none opacity-90 will-change-transform"
          style={{
            width: '100vw',
            height: '115vh',
            objectFit: 'cover',
            objectPosition: 'center 80%',
            transform: 'translateZ(0)',
            marginTop: '10vh'
          }}
        />
        <div className="white-overlay absolute inset-0 bg-white opacity-0 pointer-events-none" />
      </section>

      {/* (삭제) 내러티브 섹션 제거 → 바로 갤러리/Generate 표시 */}


      {/* Generate: 네모 박스 + CTA */}
      <section id="generate" className="min-h-[100vh] bg-white px-8 py-20">
        <h2 className="text-2xl md:text-4xl mb-8">Generate</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="group relative h-40 rounded-lg bg-[#111] border border-white/10 flex items-center justify-center hover:border-white/30 transition-colors">
              <span className="text-white/80 group-hover:text-white">Box {i + 1}</span>
            </div>
          ))}
        </div>
        <div className="mt-10 flex items-center justify-center">
          <a href="/start" className="px-6 py-3 rounded-full bg-black text-white hover:bg-gray-800 transition-colors">
            Start Exhibition
          </a>
        </div>
      </section>
    </div>
  );
}