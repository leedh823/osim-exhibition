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
      // Hero: pin + scrub 타임라인 복구 (카메라 줌 + 화이트 페이드 + 타이틀 페이드)
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: '#hero',
          start: 'top top',
          end: '+=200%',
          pin: true,
          scrub: true,
        },
      });
      tl.to('#hero', { scale: prefersReduced ? 1.03 : 1.12, transformOrigin: 'center center', ease: 'none' }, 0);
      tl.to('.white-overlay', { opacity: 1, ease: 'none' }, 0.2);
      tl.fromTo('#hero h1', { opacity: 1, y: 0 }, { opacity: 0, y: prefersReduced ? -10 : -40, ease: 'none' }, 0);
      tl.to('#pageRoot', { backgroundColor: '#ffffff', color: '#000000', ease: 'none' }, 0.35);

      // Gallery reveal
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
        { y: 16, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          scrollTrigger: { trigger: '#gallery', start: 'top 90%', end: 'top 70%', scrub: true },
        }
      );
      gsap.fromTo(
        '.card',
        { y: prefersReduced ? 10 : 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          stagger: 0.08,
          scrollTrigger: { trigger: '#gallery', start: 'top 90%', end: 'bottom 70%', scrub: true },
        }
      );
    }, rootRef);

    // 히어로 패럴랙스
    const el = rootRef.current;
    const handler = (e: MouseEvent) => {
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

    return () => {
      window.removeEventListener('mousemove', handler);
      ctx.revert();
    };
  }, []);

  return (
    <div ref={rootRef} id="pageRoot" className="bg-black text-white">
      {/* Hero: 포털(화이트) */}
      <section id="hero" className="h-screen relative overflow-hidden flex items-center justify-center">
        {(() => {
          const portalStyle = {
            background: '#ffffff',
            ['--maskInner']: 62,
            ['--maskOuter']: 68,
            maskImage: 'radial-gradient(circle at center, #000 var(--maskInner)%, transparent var(--maskOuter)%)',
            WebkitMaskImage: 'radial-gradient(circle at center, #000 var(--maskInner)%, transparent var(--maskOuter)%)',
            boxShadow: '0 0 80px 20px rgba(0,0,0,0.08)',
          } as React.CSSProperties & Record<'--maskInner' | '--maskOuter', number>;
          return (
            <div className="portal-core parallax absolute w-[60vmin] h-[60vmin] rounded-full" style={portalStyle} />
          );
        })()}
        {/* Floating decorative thumbs (placeholders) */}
        <div className="absolute top-8 left-8 w-28 h-28 rounded-md bg-white/80 shadow float-medium" />
        <div className="absolute top-14 right-6 w-40 h-56 rounded-md bg-white/80 shadow float-slow" />
        <div className="absolute bottom-16 left-24 w-44 h-32 rounded-md bg-white/80 shadow float-slow" />
        <div className="absolute bottom-20 right-24 w-36 h-36 rounded-md bg-white/80 shadow float-medium" />
        <h1 className="parallax relative z-10 text-4xl md:text-6xl" style={{ letterSpacing: '0.02em' }}>
          Words become images.
        </h1>
        <div className="white-overlay absolute inset-0 bg-white opacity-0 pointer-events-none" />
      </section>

      {/* 갤러리: 16:9 네모 박스 플레이스홀더 */}
      <section id="gallery" className="min-h-[140vh] p-8 bg-white text-black opacity-0">
        
        <h2 className="section-title text-xl md:text-2xl mb-6 text-black/90">Words become images</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(9)].map((_, i) => (
            <div
              key={i}
              className="card group relative aspect-video bg-white rounded-lg overflow-hidden outline-none border border-black/10 shadow-sm focus-visible:ring-2 focus-visible:ring-black/40"
              tabIndex={0}
              role="button"
              aria-label={`갤러리 아이템 ${i + 1}`}
            >
              <div className="absolute inset-0 grid place-items-center text-black/50">16:9</div>
              <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity p-4 text-sm">
                <p className="text-black">Prompt</p>
                <p className="mt-1 text-black/70">“...”</p>
              </div>
            </div>
          ))}
        </div>
      </section>

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