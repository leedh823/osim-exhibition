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
      // 초기 위치: 이미지 Y를 30vh 아래로 내리고(요청), 나머지는 0
      gsap.set('.parallax', { x: 0, y: '30vh', rotateX: 0, rotateY: 0 });
      gsap.set(['.portal-core', '.parallax-item'], { x: 0, y: 0, rotateX: 0, rotateY: 0 });
      // Split titles(after hero) into per-letter spans for stagger animation
      document.querySelectorAll<HTMLElement>('#narratives .section-title, #gallery .section-title, #exhibit .section-title, #exhibit .exhibit-subtitle').forEach((titleEl) => {
        if (titleEl.getAttribute('data-split') === 'true') return;
        const text = titleEl.innerText;
        const letters = text.split('').map((ch, idx) => {
          const safe = ch === ' ' ? '&nbsp;' : ch;
          return `<span class="letter inline-block will-change-transform">${safe}</span>`;
        }).join('');
        titleEl.innerHTML = letters;
        titleEl.setAttribute('data-split', 'true');
      });
      // Hero: 고정(pin) + 확대(500%) → 끝 구간에서 흰 오버레이만
      const heroTl = gsap.timeline({
        scrollTrigger: {
          trigger: '#hero',
          start: 'top top',
          end: '+=320%',
          pin: true,
          scrub: true,
          anticipatePin: 1,
        },
      });
      // 전체 구간을 1로 보고 진행(스케일 1 → 5)
      heroTl.fromTo('#hero .parallax', { scale: 1 }, { scale: 5, ease: 'none', duration: 1 }, 0);
      // 스케일이 약 3배(60% 부근) 지점부터 흰 전환 시작 + 이미지 투명 처리 (전역 배경 변경 없음)
      heroTl.to('#hero .white-overlay', { opacity: 1, ease: 'none', duration: 0.4 }, 0.6);
      heroTl.to('#hero .parallax', { opacity: 0, duration: 0.4, ease: 'none' }, 0.6);
      // 히어로 종료 시점에 페이지 배경을 흰색으로 미리 맞춰 경계선을 제거
      heroTl.to('#pageRoot', { backgroundColor: '#ffffff', ease: 'none' }, 0.88);

      // Narratives reveal
      gsap.fromTo(
        '#narratives',
        { opacity: 0 },
        {
          opacity: 1,
          scrollTrigger: { trigger: '#narratives', start: 'top bottom', end: 'top center', scrub: true },
        }
      );
      // 전역 배경 토글 제거(요청에 따라 히어로만 검은색 유지)
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

        // 전역 배경 변경 없음
      });
      // 2번 후반부부터 전역 오버레이를 올리고, 3번 초반에서 완전히 전환
      const secondPanel = document.querySelector<HTMLElement>('#narratives .panel-block:nth-of-type(2)');
      const globalOverlay = document.getElementById('global-overlay');
      if (secondPanel && globalOverlay) {
        gsap.fromTo(globalOverlay, { opacity: 0 }, {
          opacity: 1,
          ease: 'none',
          scrollTrigger: { trigger: secondPanel, start: 'center 30%', end: 'bottom top', scrub: true },
        });
      }
      // 패널3(인덱스 2) 진입 시 배경을 자연스럽게 흰 → 검정 전환(오버레이 + 자체 배경 동기화) + 타이틀 컬러 전환
      const thirdPanel = document.querySelector<HTMLElement>('#narratives .panel-block:nth-of-type(3)');
      if (thirdPanel && globalOverlay) {
        // 패널3 자체 배경을 흰 → 검정으로 전환
        gsap.fromTo(
          thirdPanel,
          { backgroundColor: '#ffffff', color: '#000000' },
          { backgroundColor: '#000000', color: '#ffffff', ease: 'none', scrollTrigger: { trigger: thirdPanel, start: 'top 90%', end: 'top 60%', scrub: true } }
        );
        // 전역 오버레이는 패널3 초반에서 서서히 제거(한 번만 검정으로 바뀌도록)
        gsap.to(globalOverlay, {
          opacity: 0,
          ease: 'none',
          scrollTrigger: { trigger: thirdPanel, start: 'top 80%', end: 'top 60%', scrub: true },
        });
        const panel3Title = thirdPanel.querySelector<HTMLElement>('.panel3-title');
        if (panel3Title) {
          gsap.fromTo(
            panel3Title,
            { color: '#000000' },
            { color: '#ffffff', ease: 'none', scrollTrigger: { trigger: thirdPanel, start: 'top 90%', end: 'top 60%', scrub: true } }
          );
        }
      }
      gsap.fromTo('#gallery .section-title', { y: 16, opacity: 0 }, {
        y: 0,
        opacity: 1,
        scrollTrigger: { trigger: '#gallery', start: 'top 90%', end: 'top 70%', scrub: true },
      });
      // 갤러리 진입 시 전역 배경 변경 없음
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

      // Exhibition title: 다른 텍스트와 동일하게 글자 단위 등장
      gsap.utils.toArray<HTMLElement>('#exhibit .section-title, #exhibit .exhibit-subtitle').forEach((el) => {
        const letters = el.querySelectorAll<HTMLElement>('.letter');
        gsap.set(letters, { opacity: 0 });
        gsap.fromTo(letters, { y: 30, opacity: 0 }, {
          y: 0,
          opacity: 1,
          stagger: 0.03,
          ease: 'power2.out',
          scrollTrigger: { trigger: '#exhibit', start: 'top 85%', end: 'top 60%', scrub: true },
        });
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
      // 중앙에서 크게 벗어나지 않도록 감도 고정(≈25px)
      gsap.to('.parallax', {
        x: dx * 25,
        y: dy * 25,
        rotateY: -dx * 1.5,
        rotateX: dy * 1,
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

  // 데이터 주도 블록 정의: 타이틀과 박스(좌표/크기/툴팁)
  const blocks = [
    {
      title: 'Words become images.',
      boxes: [
        { style: 'top-14 left-10 w-24 h-24', tooltip: 'Prompt: sample A' },
        { style: 'top-28 right-16 w-28 h-40', tooltip: 'Prompt: sample B' },
        { style: 'bottom-28 left-28 w-40 h-28', tooltip: 'Prompt: sample C' },
        { style: 'bottom-16 right-40 w-28 h-28', tooltip: 'Prompt: sample D' },
        { style: 'top-1/3 left-1/4 w-16 h-16', tooltip: 'Prompt: sample E' },
        { style: 'top-1/3 right-1/5 w-16 h-24', tooltip: 'Prompt: sample F' },
      ],
    },
    {
      title: 'Each image carries its seed.',
      boxes: [
        { style: 'top-20 left-24 w-28 h-36', tooltip: 'Prompt: sample G' },
        { style: 'top-12 right-28 w-20 h-20', tooltip: 'Prompt: sample H' },
        { style: 'bottom-28 right-20 w-36 h-28', tooltip: 'Prompt: sample I' },
        { style: 'bottom-20 left-16 w-24 h-24', tooltip: 'Prompt: sample J' },
        { style: 'top-1/2 left-[12%] w-14 h-14', tooltip: 'Prompt: sample K' },
        { style: 'top-[45%] right-[15%] w-20 h-14', tooltip: 'Prompt: sample L' },
      ],
    },
    {
      title: 'Hover on an image surface what that sparked it.',
      boxes: [
        { style: 'top-16 left-10 w-20 h-28', tooltip: 'Prompt: sample M' },
        { style: 'top-12 right-20 w-28 h-28', tooltip: 'Prompt: sample N' },
        { style: 'bottom-24 left-32 w-28 h-28', tooltip: 'Prompt: sample O' },
        { style: 'bottom-20 right-32 w-40 h-28', tooltip: 'Prompt: sample P' },
        { style: 'top-[42%] left-[8%] w-16 h-16', tooltip: 'Prompt: sample Q' },
        { style: 'top-[38%] right-[10%] w-16 h-20', tooltip: 'Prompt: sample R' },
      ],
    },
  ];

  return (
    <div ref={rootRef} id="pageRoot" className="bg-white text-black">
      {/* Global overlay: fades black across the whole viewport when transitioning 2 → 3 */}
      <div id="global-overlay" className="pointer-events-none fixed inset-0 bg-black opacity-0 z-[5]" />
      {/* Hero: 이미지 + 마우스 반응 */}
      <section id="hero" className="h-screen relative overflow-hidden flex items-center justify-center bg-black">
        <img
          src="/image/2.png"
          alt="hero"
          className="parallax max-w-none opacity-90 will-change-transform"
          style={{
            width: '110vw',
            height: '120vh',
            objectFit: 'cover',
            objectPosition: 'center 70%',
            transform: 'translateZ(0)',
            marginTop: '0'
          }}
        />
        <div className="white-overlay absolute inset-0 bg-white opacity-0 pointer-events-none" />
      </section>

      {/* Narratives (one section, data-driven blocks) */}
      <section id="narratives" className="relative overflow-visible" style={{ opacity: 0 }}>
        {blocks.map((block, idx) => (
          <div
            key={idx}
            className={`panel-block relative min-h-[90vh] w-full px-8 flex flex-col items-center justify-center overflow-visible`}
          >
            <h2 className={`section-title relative z-10 text-3xl md:text-5xl text-center mb-10 ${idx === 2 ? 'panel3-title' : ''}`}>{block.title}</h2>
            {block.boxes.map((b, i) => (
              <div key={i} className={`group parallax-item absolute ${b.style} overflow-visible z-10`}>
                <div className={`w-full h-full rounded-md shadow ${idx === 2 ? 'bg-white/10' : 'bg-black/5'}`} />
                {/* 아래 라인이 그려진 뒤 텍스트가 중앙에서 뜨는 효과 */}
                <div className="z-20 absolute left-1/2 -translate-x-1/2 top-full mt-2 w-[260px] max-w-[70vw]">
                  <div className={`mx-auto h-[3px] rounded-full w-0 group-hover:w-24 transition-all duration-300 ${idx === 2 ? 'bg-white/30' : 'bg-black/20'}`}></div>
                  <div className={`mt-2 px-4 py-3 rounded-xl border shadow text-sm opacity-0 translate-y-1 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0 text-center ${idx === 2 ? 'bg-black text-white border-white/20' : 'bg-white text-black border-black/10'}`}>
                    {b.tooltip}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </section>

      {/* Exhibition Title (전시 이름) */}
      <section id="exhibit" className="min-h-[80vh] bg-white text-black flex items-center justify-center px-8">
        <div className="text-center">
          <h2 className="section-title exhibit-title text-6xl md:text-8xl font-semibold tracking-wide">DESIGN</h2>
          <p className="section-title exhibit-subtitle mt-6 italic text-2xl md:text-3xl opacity-90">at the speed of creation</p>
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