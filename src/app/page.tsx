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
      // Split titles(after hero) into per-letter spans for stagger animation
      document.querySelectorAll<HTMLElement>('#narratives .section-title, #gallery .section-title').forEach((titleEl) => {
        if (titleEl.getAttribute('data-split') === 'true') return;
        const text = titleEl.innerText;
        const letters = text.split('').map((ch, idx) => {
          const safe = ch === ' ' ? '&nbsp;' : ch;
          return `<span class="letter inline-block will-change-transform">${safe}</span>`;
        }).join('');
        titleEl.innerHTML = letters;
        titleEl.setAttribute('data-split', 'true');
      });
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
      // Titles(after hero): per-letter appear/disappear with different start per block
      gsap.utils.toArray<HTMLElement>('#narratives .section-title').forEach((el, idx) => {
        const letters = el.querySelectorAll<HTMLElement>('.letter');
        // reset to avoid first-letter missing when re-entering
        gsap.set(letters, { opacity: 0 });
        const appearFromY = idx === 0 ? 40 : 20; // panel 2,3 slightly below center
        const appearStart = idx === 0 ? 'bottom 95%' : 'center 105%';
        const appearEnd = idx === 0 ? 'center 70%' : 'center 85%';
        gsap.fromTo(
          letters,
          { y: appearFromY, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            stagger: 0.03,
            ease: 'power2.out',
            immediateRender: false,
            scrollTrigger: { trigger: el, start: appearStart, end: appearEnd, scrub: true },
          }
        );
        // fade out higher than before
        gsap.to(letters, {
          y: -24,
          opacity: 0,
          stagger: 0.05,
          ease: 'power2.inOut',
          scrollTrigger: { trigger: el, start: 'center 30%', end: 'top 15%', scrub: true },
        });
      });
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
      // 페이지 내 이미지/박스 블록 전체 패럴랙스(텍스트 제외)
      gsap.to('.parallax-item', { x: dx * 40, y: dy * 40, duration: 0.35, ease: 'power2.out' });
    };
    window.addEventListener('mousemove', handler);

    return () => {
      window.removeEventListener('mousemove', handler);
      ctx.revert();
    };
  }, []);

  // 데이터 주도 블록 정의: 타이틀과 박스(좌표/크기/툴팁)
  const blocks = [
    {
      title: 'Words become images.',
      boxes: [
        { style: 'top-10 left-8 w-24 h-24', tooltip: 'Prompt: sample A' },
        { style: 'top-24 right-10 w-28 h-40', tooltip: 'Prompt: sample B' },
        { style: 'bottom-24 left-24 w-40 h-28', tooltip: 'Prompt: sample C' },
        { style: 'bottom-16 right-32 w-28 h-28', tooltip: 'Prompt: sample D' },
      ],
    },
    {
      title: 'Each image carries its seed.',
      boxes: [
        { style: 'top-16 left-20 w-28 h-36', tooltip: 'Prompt: sample E' },
        { style: 'top-10 right-24 w-20 h-20', tooltip: 'Prompt: sample F' },
        { style: 'bottom-28 right-16 w-36 h-28', tooltip: 'Prompt: sample G' },
        { style: 'bottom-16 left-10 w-24 h-24', tooltip: 'Prompt: sample H' },
      ],
    },
    {
      title: 'Hover on an image surface what that sparked it.',
      boxes: [
        { style: 'top-16 left-8 w-20 h-28', tooltip: 'Prompt: sample I' },
        { style: 'top-12 right-16 w-28 h-28', tooltip: 'Prompt: sample J' },
        { style: 'bottom-24 left-28 w-28 h-28', tooltip: 'Prompt: sample K' },
        { style: 'bottom-20 right-28 w-40 h-28', tooltip: 'Prompt: sample L' },
      ],
    },
  ];

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

      {/* Narratives (one section, data-driven blocks) */}
      <section id="narratives" className="relative bg-white text-black overflow-visible">
        {blocks.map((block, idx) => (
          <div key={idx} className="panel-block relative min-h-[90vh] container mx-auto px-8 flex flex-col items-center justify-center overflow-visible">
            <h2 className="section-title relative z-10 text-3xl md:text-5xl text-center mb-10">{block.title}</h2>
            {block.boxes.map((b, i) => (
              <div key={i} className={`group parallax-item absolute ${b.style} overflow-visible`}>
                <div className="rounded-md bg-black/5 shadow" />
                <div className="z-20 absolute left-1/2 -translate-x-1/2 top-full mt-2 px-4 py-2 rounded-xl bg-white border border-black/10 shadow text-xs text-black opacity-0 translate-y-1 transition-all duration-200 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0">{b.tooltip}</div>
              </div>
            ))}
          </div>
        ))}
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