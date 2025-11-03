'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export default function Landing() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [posterIndex, setPosterIndex] = useState(0);

  useLayoutEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ctx = gsap.context(() => {
      // 초기 위치: 이미지 Y를 중앙 아래로 내리고, 나머지는 0
      gsap.set('.parallax', { x: 0, y: 'calc(30vh + 70px)', rotateX: 0, rotateY: 0 });
      gsap.set(['.portal-core', '.parallax-item'], { x: 0, y: 0, rotateX: 0, rotateY: 0 });
      // Split titles(after hero) into per-letter spans for stagger animation
      document.querySelectorAll<HTMLElement>('#narratives .section-title, #gallery .section-title, #exhibit .section-title, #exhibit .exhibit-subtitle').forEach((titleEl) => {
        if (titleEl.getAttribute('data-split') === 'true') return;
        const text = titleEl.innerText;
        const letters = text.split('').map((ch, idx) => {
          const safe = ch === ' ' ? '&nbsp;' : ch;
          // 첫 글자 앞에 투명한 스페이스를 추가하여 첫 글자가 사라지는 것을 방지
          const prefix = idx === 0 ? '<span class="letter" style="opacity:0;width:0;display:inline-block;pointer-events:none;user-select:none;">&nbsp;</span>' : '';
          return `${prefix}<span class="letter inline-block will-change-transform">${safe}</span>`;
        }).join('');
        titleEl.innerHTML = letters;
        titleEl.setAttribute('data-split', 'true');
      });
      // Hero: 고정(pin) + 확대(500%) → 끝 구간에서 흰 오버레이만
      const heroTl = gsap.timeline({
        scrollTrigger: {
          trigger: '#hero',
          start: 'top top',
          end: '+=280%',
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
        if (letters.length === 0) return;
        const appearFromY = idx === 0 ? 40 : 20; // panel 2,3 slightly below center
        // 초기 상태: 확실히 opacity 0, 첫 글자도 포함 (CSS도 함께 설정)
        letters.forEach(letter => {
          letter.style.opacity = '0';
          letter.style.transform = `translateY(${appearFromY}px)`;
        });
        gsap.set(letters, { opacity: 0, y: appearFromY, clearProps: 'none', force3D: true });
        const appearStart = idx === 0 ? 'bottom 95%' : 'center 105%';
        const appearEnd = idx === 0 ? 'center 70%' : 'center 85%';
        // 첫 글자는 별도로 처리하여 확실하게 등장하도록
        const firstLetter = letters[0];
        const restLetters = Array.from(letters).slice(1);
        if (firstLetter) {
          gsap.fromTo(
            firstLetter,
            { y: appearFromY, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              ease: 'power2.out',
              immediateRender: true,
              scrollTrigger: { 
                trigger: el, 
                start: appearStart, 
                end: appearEnd, 
                scrub: true,
              },
            }
          );
        }
        if (restLetters.length > 0) {
          gsap.fromTo(
            restLetters,
            { y: appearFromY, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              stagger: 0.03,
              ease: 'power2.out',
              immediateRender: false,
              scrollTrigger: { 
                trigger: el, 
                start: appearStart, 
                end: appearEnd, 
                scrub: true,
              },
            }
          );
        }
        // fade out (텍스트가 더 위로 올라갔을 때 사라지기 시작)
        gsap.to(letters, {
          y: -24,
          opacity: 0,
          stagger: 0.05,
          ease: 'power2.inOut',
          scrollTrigger: { 
            trigger: el, 
            start: 'center 30%', 
            end: 'top 10%', 
            scrub: true,
          },
        });

        // 전역 배경 변경 없음
      });
      // 2번 후반부부터 전역 오버레이를 올리고(뷰포트 전체), 같은 구간에 pageRoot 배경도 흰→검정으로 동기화
      const secondPanel = document.querySelector<HTMLElement>('#narratives .panel-block:nth-of-type(2)');
      const globalOverlay = document.getElementById('global-overlay');
      if (secondPanel && globalOverlay) {
        gsap.fromTo(globalOverlay, { opacity: 0 }, {
          opacity: 1,
          ease: 'none',
          scrollTrigger: { trigger: secondPanel, start: 'center 30%', end: 'bottom top', scrub: true },
        });
        gsap.fromTo('#pageRoot', { backgroundColor: '#ffffff' }, {
          backgroundColor: '#000000',
          ease: 'none',
          scrollTrigger: { trigger: secondPanel, start: 'center 30%', end: 'bottom top', scrub: true },
        });
        // 세 번째 패널의 회색 박스들도 배경과 함께 색상 변경
        const panel3GrayBoxes = document.querySelectorAll<HTMLElement>('.panel3-gray-box');
        if (panel3GrayBoxes.length > 0) {
          gsap.fromTo(panel3GrayBoxes, { backgroundColor: '#F9F9F9' }, {
            backgroundColor: '#111111',
            ease: 'none',
            scrollTrigger: { trigger: secondPanel, start: 'center 30%', end: 'bottom top', scrub: true },
          });
        }
      }
      // 패널3(인덱스 2) 진입 시 배경을 자연스럽게 흰 → 검정 전환(오버레이 + 자체 배경 동기화) + 타이틀 컬러 전환
      const thirdPanel = document.querySelector<HTMLElement>('#narratives .panel-block:nth-of-type(3)');
      if (thirdPanel && globalOverlay) {
        // 오버레이는 패널3 초반에서 서서히 제거(이미 pageRoot는 검정)
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

      // Exhibition section: Pin 고정 + 순차 등장 애니메이션
      const exhibitSection = document.querySelector<HTMLElement>('#exhibit');
      const exhibitGrid = document.querySelector<HTMLElement>('#exhibit-grid');
      const exhibitChatInput = document.querySelector<HTMLElement>('#exhibit-chat-input');
      const exhibitChatText = document.querySelector<HTMLElement>('#exhibit-chat-text');

      if (exhibitSection) {
        // 전시 이름 텍스트 글자 단위 등장 (갤러리처럼) - 1단계: 먼저 등장
        document.querySelectorAll<HTMLElement>('#exhibit .section-title').forEach((el) => {
          const text = el.innerText;
          const letters = text.split('').map((ch, idx) => {
            const safe = ch === ' ' ? '\u00A0' : ch;
            const prefix = idx === 0 ? '<span class="letter" style="opacity:0;width:0;display:inline-block;pointer-events:none;user-select:none;">&nbsp;</span>' : '';
            return `${prefix}<span class="letter inline-block will-change-transform">${safe}</span>`;
          }).join('');
          el.innerHTML = letters;
        });

        // Pin 고정 + 순차 등장 애니메이션
        const exhibitTl = gsap.timeline({
          scrollTrigger: {
            trigger: exhibitSection,
            start: 'center center',
            end: '+=300%',
            pin: true,
            scrub: true,
            anticipatePin: 1,
          },
        });

        // 1. 전시명 등장 (0 ~ 0.5)
        document.querySelectorAll<HTMLElement>('#exhibit .section-title').forEach((el) => {
          const letterElements = el.querySelectorAll<HTMLElement>('.letter');
          if (letterElements.length === 0) return;
          const appearFromY = 30;
          
          letterElements.forEach(letter => {
            letter.style.opacity = '0';
            letter.style.transform = `translateY(${appearFromY}px)`;
          });
          gsap.set(letterElements, { opacity: 0, y: appearFromY, clearProps: 'none', force3D: true });
          
          const firstLetter = letterElements[0];
          const restLetters = Array.from(letterElements).slice(1);
          
          if (firstLetter) {
            exhibitTl.fromTo(
              firstLetter,
              { y: appearFromY, opacity: 0 },
              {
                y: 0,
                opacity: 1,
                ease: 'power2.out',
                immediateRender: true,
                duration: 0.5
              },
              0
            );
          }
          if (restLetters.length > 0) {
            exhibitTl.fromTo(
              restLetters,
              { y: appearFromY, opacity: 0 },
              {
                y: 0,
                opacity: 1,
                stagger: 0.03,
                ease: 'power2.out',
                immediateRender: false,
                duration: 0.8
              },
              0
            );
          }
        });

        // 2. 채팅 UI 등장 + 배경 격자 무늬 점점 등장 (동시에, 0.5부터)
        if (exhibitChatInput) {
          exhibitTl.to(exhibitChatInput, 
            { 
              opacity: 1,
              duration: 0.5, 
              ease: 'power2.out' 
            }, 
            0.5
          );
        }

        // 격자 배경 원형으로 확장되면서 나타남 (2단계와 3단계에서 연속 확장)
        if (exhibitGrid) {
          // clipPath를 직접 업데이트하여 원형으로 확장
          // 2단계: opacity와 clipPath 동시에 시작
          const gridAnimation = { progress: 0 };
          
          // opacity와 clipPath 애니메이션을 하나로 통합
          exhibitTl.to(exhibitGrid, { 
            opacity: 1,
            duration: 0.3,
            ease: 'power2.out' 
          }, 0.5);
          
          // 2단계: 절반까지 확장 (0.5부터 시작)
          exhibitTl.to(gridAnimation, {
            progress: 0.5,
            duration: 0.8,
            ease: 'power2.inOut',
            onUpdate: function() {
              if (exhibitGrid) {
                // 화면 전체를 확실히 채우기 위해 150%까지 확장
                const radius = 150 * gridAnimation.progress + '%';
                exhibitGrid.style.clipPath = `circle(${radius} at 50% 50%)`;
              }
            },
            onStart: function() {
              // 애니메이션 시작 시 초기 clipPath 설정
              if (exhibitGrid) {
                exhibitGrid.style.clipPath = 'circle(0% at 50% 50%)';
              }
            }
          }, 0.5);
          
          // 3단계: 나머지 확장 (1.3부터 시작, 같은 객체 사용)
          exhibitTl.to(gridAnimation, {
            progress: 1,
            duration: 1.2,
            ease: 'power2.inOut',
            onUpdate: function() {
              if (exhibitGrid) {
                // 화면 전체를 확실히 채우기 위해 150%까지 확장
                const radius = 150 * gridAnimation.progress + '%';
                exhibitGrid.style.clipPath = `circle(${radius} at 50% 50%)`;
              }
            }
          }, 1.3);
        }

        // 채팅 UI 안 영어 텍스트 단어별로 등장 (3단계와 동시 시작)
        if (exhibitChatText) {
          const chatText = exhibitChatText.innerText;
          exhibitChatText.innerHTML = '';
          const words = chatText.split(' ').map((word, idx) => {
            const span = document.createElement('span');
            span.className = 'inline-block';
            span.style.opacity = '0';
            span.textContent = word;
            if (idx < chatText.split(' ').length - 1) {
              span.textContent += ' ';
            }
            exhibitChatText.appendChild(span);
            return span;
          });

          gsap.set(words, { opacity: 0, y: 10 });
          exhibitTl.to(words, 
            { 
              opacity: 1,
              y: 0,
              duration: 1.0, 
              stagger: 0.08,
              ease: 'power2.out' 
            }, 
            1.3
          );
        }

        // 검은색 박스가 아래에서 올라오는 애니메이션 (영어 텍스트 완료 후)
        const blackBox = document.querySelector('#exhibit-black-box') as HTMLElement;
        const regenerateButton = document.querySelector('#regenerate-button') as HTMLElement;
        const posterContainer = document.querySelector('#poster-carousel') as HTMLElement;
        
        if (blackBox) {
          // 초기 위치: 화면 아래쪽 밖으로 (top: 50% + 100vh = 화면 아래)
          gsap.set(blackBox, { y: '100vh', opacity: 0, transformOrigin: 'center center', rotationX: 0 });
          if (regenerateButton) {
            // 버튼 초기 위치: 약간 아래쪽에 숨겨진 상태
            gsap.set(regenerateButton, { opacity: 0, y: 20 });
          }
          
          // 스크롤 시 박스가 올라오면서 나타남 (영어 텍스트 완료 후, 약 2.3 지점부터 시작)
          exhibitTl.to(blackBox, {
            y: '-50%',
            opacity: 1,
            duration: 1.2,
            ease: 'power2.out'
          }, 2.3);
          
          // 포스터 캐러셀이 박스 위에 올라오는 느낌으로 등장 (박스 등장 후)
          if (posterContainer) {
            gsap.set(posterContainer, { opacity: 0, y: 150 });
            exhibitTl.to(posterContainer, {
              opacity: 1,
              y: 0,
              duration: 1.0,
              ease: 'power2.out'
            }, 3.5);
          }
          
          // 버튼은 포스터 등장이 끝난 후에 따라 나오는 느낌으로
          if (regenerateButton) {
            exhibitTl.to(regenerateButton, {
              opacity: 1,
              y: 0,
              duration: 0.6,
              ease: 'power2.out'
            }, 4.5);
          }
          
          // 박스가 끝까지 올라간 후 약간 눕혀졌다가 원상복귀 (천천히, 30% 더 길게, 약간의 기울기)
          exhibitTl.to(blackBox, {
            rotationX: 5,
            duration: 1.04,
            ease: 'power2.inOut'
          }, 4.5);
          
          exhibitTl.to(blackBox, {
            rotationX: 0,
            duration: 1.04,
            ease: 'power2.inOut'
          }, 5.54);
        }
      }
    }, rootRef);
    
    // 모든 애니메이션 설정 후 ScrollTrigger refresh로 타이밍 보정 (첫 글자 문제 해결)
    ScrollTrigger.refresh();

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
      // 중앙에서 크게 벗어나지 않도록 감도 고정 (위아래 최대 30px)
      const maxY = 30;
      const yOffset = Math.max(-maxY, Math.min(maxY, dy * 25));
      gsap.to('.parallax', {
        x: dx * 25,
        y: yOffset,
        rotateY: -dx * 1.5,
        rotateX: dy * 1,
        transformPerspective: 800,
        transformOrigin: 'center center',
        duration: 0.25,
        ease: 'power3.out',
      });
      gsap.to('.portal-core', { x: dx * 45, y: dy * 45, duration: 0.25, ease: 'power3.out' });
      // 페이지 내 이미지/박스 블록 전체 패럴랙스(텍스트 제외) — 좌우/상하 동일 스케일로 증폭
      gsap.to('.parallax-item', { x: dx * 180, y: dy * 180, duration: 1, ease: 'sine.out' });
    };
    window.addEventListener('mousemove', handler);

    return () => {
      window.removeEventListener('mousemove', handler);
      ctx.revert();
    };
  }, []);

  // 포스터 클릭 애니메이션 처리
  useLayoutEffect(() => {
    const posterItems = document.querySelectorAll('.poster-item');
    if (posterItems.length === 0) return;
    
    const ctx2 = gsap.context(() => {
      posterItems.forEach((item, idx) => {
        const isCenter = idx === 1;
        const rotateY = isCenter ? 0 : (idx === 0 ? 35 : -35);
        
        gsap.to(item, {
          opacity: isCenter ? 1 : 0.5,
          scale: isCenter ? 1 : 0.85,
          x: (idx - 1) * 300, // 가운데: 0, 왼쪽: -300, 오른쪽: 300
          z: isCenter ? 0 : -50,
          rotateY: rotateY,
          width: isCenter ? 280 : 200,
          duration: 0.6,
          ease: 'power2.out',
          transformStyle: 'preserve-3d',
          transformOrigin: 'center center'
        });
      });
    });
    
    return () => {
      ctx2.revert();
    };
  }, [posterIndex]);

  // 데이터 주도 블록 정의: 타이틀과 박스(좌표/크기/툴팁)
  const blocks = [
    {
      title: 'Words become images.',
      titleEn1: 'We look at others every day.',
      titleKo1: '우리는 매일 누군가를 바라봅니다.',
      titleEn2: 'We try to read faces, movements, and the unspoken feelings in between.',
      titleKo2: '표정과 움직임, 말하지 않은 감정까지 읽어내려 합니다.',
      boxes: [
        // 왼쪽 상단: 임시 이미지 (sample A 왼쪽 위) - 1856x2464 (3:4 비율)
        { style: 'top-[12%] left-[21%]', tooltip: '따뜻한 빛이 비추는 벽면 위, 낡은 보안카메라가 고요히 시선을 고정하고 있습니다.', image: '/gallery/gallery-1-c.png', maxW: 181, maxH: 240, objectFit: 'contain', tooltipWidth: 280 },
        // sample C와 sample B 사이: 회색 박스 (가로형)
        { style: 'top-[8%] left-[50%] -translate-x-1/2', tooltip: '', image: null, maxW: 140, maxH: 90 },
        // 오른쪽 하단: 세로형 이미지 (더 오른쪽 아래로) - 1792x2688 (2:3 비율)
        { style: 'bottom-[12%] right-[10%]', tooltip: '도심의 높은 시점에서 내려다본 거리에는 사람들과 자전거가 여유롭게 흩어져 있습니다.', image: '/gallery/gallery-1-a.png', maxW: 160, maxH: 240, objectFit: 'contain', tooltipWidth: 280 },
        // 오른쪽 상단: 가로형 이미지 (원래 모양) - 2912x1632 (16:9 비율)
        { style: 'top-[8%] right-[5%]', tooltip: '화면에는 서로 다른 각도에서 촬영된 매장 내부와 복도, 창고의 풍경이 동시에 비춰지며, 각기 다른 시선이 한 화면 안에 병치되어 있습니다.\n\n여덟 개로 분할된 CCTV 화면 속 일부에는 사람이 포착되어 있습니다.', image: '/gallery/gallery-1-b.png', maxW: 324, maxH: 182, objectFit: 'contain' },
        // 텍스트 아래 중앙: 회색 박스 (세로형)
        { style: 'bottom-[19%] left-[50%] -translate-x-1/2', tooltip: '', image: null, maxW: 70, maxH: 110 },
        // 왼쪽 중앙: 가로형 이미지 - 1616x1238 (약 4:3 비율)
        { style: 'top-[61%] left-[8%]', tooltip: '단정한 건축의 곡선과 맑은 빛 속에서, 그는 마치 자신과 세계의 경계를 바라보는 듯합니다.', image: '/gallery/gallery-1-d.png', maxW: 240, maxH: 184, objectFit: 'contain' },
      ],
    },
    {
      title: 'Each image carries its seed.',
      titleEn1: 'Interpreting others may, in truth,',
      titleKo1: '그렇게 타인을 해석하는 일은,',
      titleEn2: 'be another way of trying to understand ourselves.',
      titleKo2: '어쩌면 자신을 이해하려는 시도의 또 다른 형태일지도 모릅니다.',
      boxes: [
        // 상단 왼쪽: 정사각형 이미지 - 1024x1024 (1:1 비율)
        { style: 'top-[11%] left-[12%]', tooltip: '수많은 사람들의 흐름 속에서 한 사람이 멈춰 서 있습니다.\n\n익명성 속에서도 존재를 증명하려는 개인의 시선을 드러냅니다.', image: '/gallery/gallery-1-g.png', maxW: 240, maxH: 240, objectFit: 'contain' },
        // sample G와 sample C 사이: 회색 박스 (세로형)
        { style: 'top-[8%] left-[5%]', tooltip: '', image: null, maxW: 60, maxH: 120 },
        // 상단 가운데: 회색 박스 (가로형)
        { style: 'top-[8%] left-[50%] -translate-x-1/2', tooltip: '', image: null, maxW: 160, maxH: 85 },
        // 텍스트 왼쪽 아래 대각선: 세로형 이미지 (텍스트와 겹치지 않게) - 508x816 (2:3 비율)
        { style: 'bottom-[1%] left-[25%]', tooltip: '그 움직임은 고요한 도시의 시간 속에서, 일상의 리듬을 조용히 기록하고 있습니다.', image: '/gallery/gallery-1-i.png', maxW: 134, maxH: 216, objectFit: 'contain', tooltipWidth: 220 },
        // 오른쪽 상단 위쪽: 가로형 이미지 - 1456x816 (16:9 비율)
        { style: 'top-[6%] right-[8%]', tooltip: '푸른빛이 감도는 거대한 홀 안, 광활한 공간 속에 흩어진 인물들은 마치 시간의 흐름 속을 유영하는 작은 존재처럼 보입니다.', image: '/gallery/gallery-1-h.png', maxW: 300, maxH: 169, objectFit: 'contain' },
        // 오른쪽 중앙: 가로형 이미지 - 1456x816 (16:9 비율)
        { style: 'top-[48%] right-[5%]', tooltip: '형형색색의 건물들 사이, 아이들이 운동장에서 뛰어놀고 있습니다.\n\n따스한 오후의 빛 아래, 도시는 소란스럽지 않게 살아있는 리듬을 이어갑니다.', image: '/gallery/gallery-1-l.png', maxW: 288, maxH: 162, objectFit: 'contain' },
      ],
    },
    {
      title: 'Hover on an image surface what that sparked it.',
      titleEn1: 'But what if, in that very moment,',
      titleKo1: '하지만 그 순간,',
      titleEn2: 'your own interpretation was already being observed and analyzed?',
      titleKo2: '당신의 해석 또한 누군가의 시선 속에서 분석되고 있었다면요?',
      boxes: [
        // 왼쪽: 가로형 이미지 - 1456x816 (16:9 비율)
        { style: 'top-[33%] left-[5%]', tooltip: '붉은 벽돌 지붕이 이어진 마을이 푸른 언덕과 맞닿아 있습니다.\n\n짙은 초록의 숲과 따뜻한 햇살 속에서, 자연과 인간의 시간이 평화롭게 공존합니다.', image: '/gallery/gallery-1-m.png', maxW: 280, maxH: 157, objectFit: 'contain' },
        // 왼쪽 위: 회색 박스 (가로형)
        { style: 'top-[23%] left-[30%]', tooltip: '', image: null, maxW: 130, maxH: 75 },
        // 중앙 하단: 세로형 이미지 (더 아래로) - 612x815 (3:4 비율)
        { style: 'bottom-[18%] left-[35%]', tooltip: '빛과 어둠의 경계 위에서, 그는 존재 자체로 하나의 시선을 형성합니다.', image: '/gallery/gallery-1-o.png', maxW: 200, maxH: 267, objectFit: 'contain', tooltipWidth: 280 },
        // 중앙 하단 오른쪽: 회색 박스 (세로형)
        { style: 'bottom-[27%] right-[30%]', tooltip: '', image: null, maxW: 65, maxH: 130 },
        // 오른쪽 상단 위쪽: 가로형 이미지 - 2912x1632 (16:9 비율)
        { style: 'top-[6%] right-[15%]', tooltip: '거대한 자연을 마주한 그의 작은 실루엣은, 인간의 존재가 지닌 사유와 고요한 경외심을 함께 담아냅니다.', image: '/gallery/gallery-1-e.png', maxW: 300, maxH: 169, objectFit: 'contain' },
        // 오른쪽 중앙: 세로형 이미지 - 896x1344 (2:3 비율)
        { style: 'top-[48%] right-[5%]', tooltip: '붉은 지붕과 푸른 벽, 나무 그늘이 만들어내는 따뜻한 리듬 속에 시간은 느리게 흐릅니다.', image: '/gallery/gallery-1-j.png', maxW: 161, maxH: 240, objectFit: 'contain', tooltipWidth: 280 },
      ],
    },
    {
      title: '',
      titleEn1: 'Where your gaze lingers,',
      titleKo1: '당신의 시선이 머무는 곳에서,',
      titleEn2: 'the exhibition continues to take shape.',
      titleKo2: '이 전시는 계속해서 만들어집니다.',
      boxes: [],
    },
  ];

  return (
    <div ref={rootRef} id="pageRoot" className="bg-white text-black">
      {/* Global overlay: fades black across the whole viewport when transitioning 2 → 3 */}
      <div id="global-overlay" className="pointer-events-none fixed inset-0 bg-black opacity-0 z-[1000]" />
      {/* Hero: 이미지 + 마우스 반응 */}
      <section id="hero" className="h-screen relative overflow-hidden flex items-center justify-center bg-black">
        <img
          src="/image/2.png"
          alt="hero"
          className="parallax max-w-none opacity-90 will-change-transform"
          style={{
            width: '110vw',
            height: '130vh',
            objectFit: 'cover',
            objectPosition: 'center 60%',
            transform: 'translateZ(0)',
            marginTop: '10vh'
          }}
        />
        <div className="white-overlay absolute inset-0 bg-white opacity-0 pointer-events-none" />
        {/* Hero Text Overlay */}
        <div className="absolute top-8 md:top-12 left-6 md:left-8 z-10 pointer-events-none">
          <div className="relative">
            <h1 className="text-6xl md:text-8xl lg:text-9xl text-white tracking-wide uppercase whitespace-nowrap" style={{ fontFamily: 'var(--font-butler)', fontWeight: 900 }}>
              RE:COGNITION
            </h1>
          </div>
        </div>
        <div className="absolute top-[80px] md:top-[100px] right-6 md:right-8 z-10 pointer-events-none flex items-center">
          <div className="w-16 md:w-24 h-[1px] bg-white mr-4"></div>
          <p className="text-lg md:text-xl lg:text-2xl text-white text-right" style={{ fontFamily: 'var(--font-nexon)', fontWeight: 300 }}>
            서로의 시선 사이에서
          </p>
        </div>
      </section>

      {/* Narratives (one section, data-driven blocks) */}
      <section id="narratives" className="relative overflow-visible" style={{ opacity: 0 }}>
        {blocks.map((block, idx) => (
          <div
            key={idx}
            className={`panel-block relative ${idx === 2 ? 'min-h-[110vh] pb-32' : 'min-h-[90vh]'} w-full px-8 flex flex-col items-center justify-center overflow-visible`}
          >
            {(idx === 0 || idx === 1 || idx === 2 || idx === 3) && block.titleEn1 && block.titleKo1 ? (
              <div className={`relative ${idx === 2 || idx === 3 ? 'z-[1200] text-white' : 'z-[100] text-black'} text-center mb-10 px-4 py-8 ${idx === 2 || idx === 3 ? '' : 'bg-white/90'} rounded-lg`} style={{ fontFamily: 'var(--font-nexon)', fontWeight: 300, fontSize: '20px' }}>
                <div className="section-title">{block.titleEn1}</div>
                <div className="section-title mt-2">{block.titleKo1}</div>
                <div className="section-title mt-2">{block.titleEn2}</div>
                <div className="section-title mt-2">{block.titleKo2}</div>
              </div>
            ) : (
              <h2 className={`section-title relative ${idx === 2 ? 'z-[1200] text-white' : 'z-[100] text-black'} text-3xl md:text-5xl text-center mb-10 px-4 py-8 ${idx === 2 ? '' : 'bg-white/90'} rounded-lg`}>{block.title}</h2>
            )}
            {block.boxes.map((b, i) => {
              // style에서 위치만 추출 (w-*, h-* 제거)
              const positionStyle = b.style.split(' ').filter(s => !s.startsWith('w-') && !s.startsWith('h-')).join(' ');
              // 이미지 박스는 더 높은 z-index, 회색 박스는 낮은 z-index
              const baseZ = idx === 2 || idx === 3 ? 'z-[1100]' : 'z-[5]';
              const boxZ = b.image ? baseZ : (idx === 2 || idx === 3 ? 'z-[1090]' : 'z-[4]');
              return (
                <div key={i} className={`group parallax-item absolute ${positionStyle} overflow-visible ${boxZ}`}>
                  {b.image ? (
                    <img 
                      src={b.image} 
                      alt={b.tooltip}
                      className="w-auto h-auto relative"
                      style={{ 
                        display: 'block',
                        width: b.maxW ? `${b.maxW}px` : '200px',
                        height: b.maxH ? `${b.maxH}px` : '280px',
                        objectFit: ('objectFit' in b && typeof b.objectFit === 'string' ? b.objectFit : 'cover') as 'cover' | 'contain' | 'fill' | 'none' | 'scale-down',
                        borderRadius: '4px',
                        zIndex: 10
                      }}
                    />
                  ) : (
                    <div 
                      className={`rounded-lg parallax-item ${idx === 2 ? 'panel3-gray-box' : ''}`}
                      style={{
                        width: b.maxW ? `${b.maxW}px` : '130px',
                        height: b.maxH ? `${b.maxH}px` : '180px',
                        backgroundColor: idx === 2 ? '#F9F9F9' : '#F9F9F9',
                        zIndex: 1
                      }}
                    />
                  )}
                  {/* 모든 툴팁을 아래쪽에 표시 */}
                  {b.tooltip && (
                    <div 
                      className={`z-20 absolute left-1/2 -translate-x-1/2 max-w-[70vw] top-full mt-2`}
                      style={{ width: ('tooltipWidth' in b && b.tooltipWidth) ? `${b.tooltipWidth}px` : (b.maxW ? `${b.maxW}px` : '260px') }}
                    >
                      <div className={`mx-auto h-[3px] rounded-full w-0 group-hover:w-24 transition-all duration-300 ${idx === 2 ? 'bg-white/30' : 'bg-black/20'}`}></div>
                      <div className={`mt-2 px-4 py-3 rounded-xl border shadow text-sm opacity-0 translate-y-1 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0 text-center ${idx === 2 ? 'bg-black text-white border-white/20' : 'bg-white text-black border-black/10'}`}>
                        {b.tooltip}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </section>

      {/* Exhibition Title (전시 이름) */}
      <section id="exhibit" className="relative z-[1101] min-h-[100vh] bg-black text-white flex items-center justify-center px-8">
        {/* 원형 페이드 격자 배경 패턴 */}
        <div id="exhibit-grid" className="absolute inset-0 opacity-0 pointer-events-none" style={{ clipPath: 'circle(0% at 50% 50%)', '--grid-radius': '0%' } as React.CSSProperties}>
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <radialGradient id="grid-fade" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="white" stopOpacity="0.4" />
                <stop offset="50%" stopColor="white" stopOpacity="0.3" />
                <stop offset="100%" stopColor="white" stopOpacity="0" />
              </radialGradient>
              <pattern id="exhibit-line-grid" width="30" height="30" patternUnits="userSpaceOnUse">
                <path d="M 30 0 L 0 0 0 30" fill="none" stroke="white" strokeWidth="1" strokeOpacity="0.5" />
              </pattern>
              <mask id="grid-mask">
                <rect width="100%" height="100%" fill="url(#grid-fade)" />
              </mask>
            </defs>
            <rect width="100%" height="100%" fill="url(#exhibit-line-grid)" mask="url(#grid-mask)" />
          </svg>
        </div>

        <div className="relative z-10 w-full max-w-6xl mx-auto h-full flex flex-col">
          {/* 상단 검색 바 - 화면 최상단 */}
          <div id="exhibit-chat-input" className="absolute top-8 left-1/2 transform -translate-x-1/2 w-full max-w-2xl opacity-0">
            <div className="bg-gray-900/70 rounded-full px-6 py-3 flex items-center gap-4 border border-white/20 backdrop-blur-sm">
              <div id="exhibit-chat-text" className="flex-1 text-white/70 text-sm">
                Portal-tech website, monochrome collage, dotted details, dark themed
              </div>
              <button className="w-8 h-8 rounded-full border border-white/30 bg-transparent hover:bg-white/10 flex items-center justify-center transition-colors flex-shrink-0">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          {/* 전시 이름 - 화면 정중앙 */}
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center w-full">
              <h2 className="section-title exhibit-title text-4xl md:text-6xl lg:text-7xl font-semibold tracking-wide mb-4" style={{ fontFamily: 'var(--font-butler)', fontWeight: 900 }}>RE:COGNITION</h2>
              <p className="section-title exhibit-subtitle text-base md:text-lg lg:text-xl" style={{ fontFamily: 'var(--font-nexon)', fontWeight: 300 }}>서로의 시선 사이에서</p>
            </div>
          </div>

          {/* 포스터 캐러셀 - 검은색 박스 위에 */}
          <div 
            id="poster-carousel"
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            style={{ 
              opacity: 0, 
              zIndex: 25, 
              top: '47.5%', 
              transform: 'translateY(-50%)',
              perspective: '1000px'
            }}
          >
            {[0, 1, 2].map((idx) => {
              const actualIndex = (posterIndex + idx) % 3;
              const isCenter = idx === 1;
              const rotateY = isCenter ? 0 : (idx === 0 ? 35 : -35); // 왼쪽은 +35도, 오른쪽은 -35도
              return (
                <div
                  key={`${posterIndex}-${idx}`}
                  className="poster-item absolute cursor-pointer pointer-events-auto transition-all duration-500"
                  onClick={() => {
                    if (!isCenter) {
                      // 왼쪽 클릭: +1 (왼쪽 포스터가 가운데로), 오른쪽 클릭: -1 (오른쪽 포스터가 가운데로)
                      setPosterIndex((prev) => {
                        const newIndex = prev + (idx === 0 ? 1 : -1);
                        return ((newIndex % 3) + 3) % 3;
                      });
                    }
                  }}
                  style={{
                    width: isCenter ? '280px' : '200px',
                    left: '50%',
                    transform: `translateX(${(idx - 1) * 300 - 50}%) translateZ(${isCenter ? 0 : -50}px) rotateY(${rotateY}deg) scale(${isCenter ? 1 : 0.85})`,
                    transformStyle: 'preserve-3d',
                    opacity: isCenter ? 1 : 0.5,
                    transformOrigin: 'center center'
                  }}
                >
                  <img
                    src={`/poster/poster${actualIndex + 1}.png`}
                    alt={`Poster ${actualIndex + 1}`}
                    className="w-full h-auto rounded-lg shadow-lg"
                    style={{ backfaceVisibility: 'hidden' }}
                  />
                </div>
              );
            })}
          </div>

          {/* 검은색 박스 - 아래에서 올라오는 애니메이션 */}
          <div 
            id="exhibit-black-box"
            className="absolute inset-x-8 h-[50vh] bg-black border border-white/30 rounded-lg z-20 overflow-hidden"
            style={{ top: '47.5%', opacity: 0 }}
          />
          
          {/* Regenerate 버튼 - 박스 아래 */}
          <button
            id="regenerate-button"
            className="absolute left-1/2 px-8 py-4 bg-yellow-200 text-black font-bold rounded-full text-lg transition-opacity z-30"
            style={{ top: 'calc(47.5% + 25vh + 20px)', opacity: 0, transform: 'translateX(-50%) translateY(20px)' }}
          >
            Regenerate
          </button>
        </div>
      </section>
    </div>
  );
}