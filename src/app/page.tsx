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
      // 첫 화면부터 흰색: 갤러리 등장 애니메이션만 적용
      gsap.fromTo(
        '#gallery .section-title',
        { y: 16, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: prefersReduced ? 0.3 : 0.6,
          ease: 'power2.out',
          scrollTrigger: { trigger: '#gallery', start: 'top 95%', end: 'top 70%', scrub: true },
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

    return () => {
      ctx.revert();
    };
  }, []);

  return (
    <div ref={rootRef} id="pageRoot" className="bg-white text-black">

      {/* 갤러리: 16:9 네모 박스 플레이스홀더 */}
      <section id="gallery" className="min-h-[140vh] p-8 bg-white text-black">
        
        <h2 className="section-title text-xl md:text-2xl mb-6 text-black/90">Words become images</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(9)].map((_, i) => (
            <div
              key={i}
              className="card group relative aspect-video bg-white rounded-lg overflow-hidden outline-none border border-black/10 shadow-sm"
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