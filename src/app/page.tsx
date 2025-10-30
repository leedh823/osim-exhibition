'use client';

import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function Landing() {
  const rootRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ctx = gsap.context(() => {
      // 단일 타임라인: pin + scrub + 애니메이션
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: '#hero',
          start: 'top top',
          end: '+=200%',
          pin: true,
          scrub: true,
        },
      });
      tl.fromTo(
        '.portal-core',
        { scale: prefersReduced ? 0.98 : 0.9, filter: prefersReduced ? 'blur(2px)' : 'blur(6px)', opacity: 0.9, '--maskInner': 62, '--maskOuter': 68 },
        { scale: prefersReduced ? 1.10 : 1.52, filter: 'blur(0px)', opacity: 1, '--maskInner': 110, '--maskOuter': 130, ease: 'none' }
      );

      // 히어로 텍스트를 어둠 속으로 사라지게
      tl.fromTo('#hero h1', { opacity: 1, y: 0 }, { opacity: 0, y: prefersReduced ? -10 : -40, ease: 'none' }, 0);

      // 갤러리 섹션 타이틀/그리드 페이드 인
      gsap.fromTo(
        '#gallery',
        { opacity: 0 },
        {
          opacity: 1,
          scrollTrigger: { trigger: '#gallery', start: 'top 95%', end: 'top 70%', scrub: true },
        }
      );
      gsap.fromTo(
        '#gallery .section-title',
        { y: 20, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          scrollTrigger: { trigger: '#gallery', start: 'top 85%', end: 'top 60%', scrub: true },
        }
      );

      // 갤러리 카드 등장(16:9 네모 박스)
      gsap.fromTo(
        '.card',
        { y: prefersReduced ? 20 : 60, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          stagger: 0.08,
          scrollTrigger: { trigger: '#gallery', start: 'top 80%', end: 'bottom 60%', scrub: true },
        }
      );
    }, rootRef);

    const el = rootRef.current;
    const handler = (e: MouseEvent) => {
      const prefersReducedMove = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMove) return;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) / rect.width;
      const dy = (e.clientY - cy) / rect.height;
      gsap.to('.parallax', { x: dx * 60, y: dy * 60, duration: 0.25, ease: 'power3.out' });
      gsap.to('.portal-core', { x: dx * 40, y: dy * 40, duration: 0.3, ease: 'power3.out' });
    };
    window.addEventListener('mousemove', handler);

    // 보수적 리프레시와 폴백(갤러리 보이기)
    ScrollTrigger.refresh();
    setTimeout(() => {
      try {
        ScrollTrigger.refresh();
      } catch {}
      const gallery = document.getElementById('gallery');
      if (gallery) {
        // ScrollTrigger가 초기화되지 않는 드문 경우를 대비해 최소한 보이도록
        gallery.style.opacity = gallery.style.opacity || '1';
      }
    }, 100);

    return () => {
      window.removeEventListener('mousemove', handler);
      ctx.revert();
    };
  }, []);

  return (
    <div ref={rootRef} className="bg-black text-white">
      {/* Hero: 동굴(포털) */}
      <section id="hero" className="h-screen relative overflow-hidden flex items-center justify-center">
        {(() => {
          const portalStyle = {
            background: 'conic-gradient(from 0deg, #0b0b0b, #141414 50%, #0b0b0b)',
            // CSS 변수로 마스크 크기를 제어하여 원 안으로 들어가는 효과
            ['--maskInner']: 62,
            ['--maskOuter']: 68,
            maskImage: 'radial-gradient(circle at center, #000 var(--maskInner)%, transparent var(--maskOuter)%)',
            WebkitMaskImage: 'radial-gradient(circle at center, #000 var(--maskInner)%, transparent var(--maskOuter)%)',
            boxShadow: '0 0 120px 40px rgba(0,0,0,0.6) inset',
          } as React.CSSProperties & Record<'--maskInner' | '--maskOuter', number>;
          return (
            <div className="portal-core parallax absolute w-[60vmin] h-[60vmin] rounded-full" style={portalStyle} />
          );
        })()}
        <h1 className="parallax relative z-10 text-3xl md:text-5xl" style={{ letterSpacing: '0.04em' }}>
          Enter the Portal
        </h1>
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.06), transparent 60%)' }} />
      </section>

      {/* 갤러리: 16:9 네모 박스 플레이스홀더 */}
      <section id="gallery" className="min-h-[140vh] p-8 bg-[#0b0b0b] opacity-0">
        <h2 className="section-title text-xl md:text-2xl mb-6 text-white/90">Words become images</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(9)].map((_, i) => (
            <div
              key={i}
              className="card group relative aspect-video bg-[#111] rounded-lg overflow-hidden outline-none"
              tabIndex={0}
              role="button"
              aria-label={`갤러리 아이템 ${i + 1}`}
            >
              <div className="absolute inset-0 grid place-items-center text-white/60">16:9</div>
              <div className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity p-4 text-sm">
                <p className="text-[#c9f]">Prompt</p>
                <p className="mt-1 text-[#c9f]/80">“...”</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Generate: 네모 박스 + CTA */}
      <section id="generate" className="min-h-[100vh] bg-black px-8 py-20">
        <h2 className="text-2xl md:text-4xl mb-8">Generate</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="group relative h-40 rounded-lg bg-[#111] border border-white/10 flex items-center justify-center hover:border-white/30 transition-colors">
              <span className="text-white/80 group-hover:text-white">Box {i + 1}</span>
            </div>
          ))}
        </div>
        <div className="mt-10 flex items-center justify-center">
          <a href="/start" className="px-6 py-3 rounded-full bg-white text-black hover:bg-gray-200 transition-colors">
            Start Exhibition
          </a>
        </div>
      </section>
    </div>
  );
}