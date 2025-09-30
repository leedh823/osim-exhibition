import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [cardVisible, setCardVisible] = useState(false) // Controls opacity/transform of the card
  const [storyActive, setStoryActive] = useState(false) // Controls story container visibility
  const [currentStep, setCurrentStep] = useState(0)
  const [showVideo, setShowVideo] = useState(false)
  const [videoEnded, setVideoEnded] = useState(false)
  const [showThreeCards, setShowThreeCards] = useState(false)
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [rotation, setRotation] = useState(0) // 첫 번째 카드(index 0)를 정면으로

  useEffect(() => {
    // Step 1: Make the card visible after a short delay
    const initialCardDisplayTimer = setTimeout(() => {
      setCardVisible(true);
    }, 500); // Card appears after 0.5 seconds

    // Step 2: After 5 seconds of display (total 5.5s from start), hide the card and start story
    const transitionToStoryTimer = setTimeout(() => {
      setCardVisible(false); // Start fading out the card
      // After card fades out, activate story
      const activateStoryTimer = setTimeout(() => {
        setStoryActive(true);
      }, 1000); // Allow 1s for card fade-out animation
      return () => clearTimeout(activateStoryTimer);
    }, 5500); // 0.5s (initial delay) + 5s (display duration)

    return () => {
      clearTimeout(initialCardDisplayTimer);
      clearTimeout(transitionToStoryTimer);
    };
  }, []);

  const storySteps = [
    "아카이브 시티...",
    "미래의 거대한 데이터 아카이브 도시",
    "AI가 모든 기록을 관리하는 사이버스페이스",
    "당신은 이 도시의 기록 분석자입니다",
    "3개의 기록이 당신을 기다리고 있습니다..."
  ]

  useEffect(() => {
    if (storyActive && currentStep < storySteps.length) {
      const typingTimer = setTimeout(() => {
        setCurrentStep((prevStep) => prevStep + 1)
      }, 4000) // Each story step appears after 4 seconds (matches animation duration)
      return () => clearTimeout(typingTimer)
    }
  }, [storyActive, currentStep, storySteps.length])

  // Auto transition to video after all story steps are complete
  useEffect(() => {
    console.log('Checking video transition:', { storyActive, currentStep, storyStepsLength: storySteps.length })
    if (storyActive && currentStep >= storySteps.length) {
      console.log('Starting video transition timer...')
      const videoTransitionTimer = setTimeout(() => {
        console.log('Transitioning to video!')
        setShowVideo(true)
      }, 2000) // Wait 2 seconds after last story step, then go to video
      return () => clearTimeout(videoTransitionTimer)
    }
  }, [storyActive, currentStep, storySteps.length])

  // Start the first story step immediately when story becomes active
  useEffect(() => {
    if (storyActive && currentStep === 0) {
      const startFirstStep = setTimeout(() => {
        setCurrentStep(1)
      }, 500) // Small delay to ensure smooth transition
      return () => clearTimeout(startFirstStep)
    }
  }, [storyActive, currentStep])

  return (
    <div className="cyberpunk-container">
      <div className="cyberpunk-bg">
        <div className="grid-overlay"></div>
        <div className="neon-particles"></div>
      </div>

      <div className="main-content">
        {/* Initial Card */}
        <div className={`cyber-card ${cardVisible ? 'show' : 'hide'}`}>
          <div className="card-header">
            <div className="card-icon">[SCAN]</div>
            <h2>ARCHIVE CITY</h2>
            <div className="card-subtitle">RECORD ANALYST</div>
          </div>
          <p className="card-description">당신은 아카이브 시티의 기록 분석자입니다.</p>
          <div className="system-status">
            <span className="status-dot"></span>
            <span>SYSTEM ONLINE</span>
          </div>
        </div>

        {/* Fixed Title */}
        {storyActive && (
          <div className="fixed-title">
            <h1>ARCHIVE CITY</h1>
          </div>
        )}

        {/* Story Screen */}
        {storyActive && !showVideo && (
          <div className="story-screen">
            <div className="story-text-container">
              {currentStep > 0 && currentStep <= storySteps.length && (
                <p className="story-text">
                  {storySteps[currentStep - 1]}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 비디오 플레이어 */}
      {showVideo && (
        <div className="video-overlay">
          <div className="video-container-fullscreen">
            <div className="video-header-overlay">
              <h3>ARCHIVE CITY - SYSTEM BRIEFING</h3>
              <button 
                className="close-button-overlay"
                onClick={() => setShowVideo(false)}
              >
                [X]
              </button>
            </div>
            <video 
              className="cyber-video-fullscreen"
              autoPlay
              muted
              onEnded={() => setVideoEnded(true)}
            >
              <source src="/1.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
            <div className="video-info-overlay">
              <p>아카이브 시티 시스템 브리핑</p>
              <div className="video-status">
                <span className="status-indicator"></span>
                <span>{videoEnded ? 'STREAMING COMPLETE' : 'STREAMING ACTIVE'}</span>
              </div>
            </div>
            {videoEnded && (
              <div className="next-page-button-container">
                <button 
                  className="cyber-button next-page-button"
                  onClick={() => {
                    setShowVideo(false)
                    setShowThreeCards(true)
                  }}
                >
                  <span>PROCEED TO ARCHIVES</span>
                  <div className="button-glow"></div>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3개의 카드 섹션 */}
      {showThreeCards && (
        <div className="three-cards-overlay">
          <div className="three-cards-container">
            <div className="cards-header">
              <h2>ARCHIVE RECORDS</h2>
            </div>
            
            <div className="carousel-wrapper">
              <div 
                className="carousel-track"
                style={{ transform: `rotateY(${rotation}deg)` }}
              >
                {[
                  { id: 1, number: "01", title: "CITIZEN ALPHA", description: "데이터 아키텍트 - 시스템 접근 기록 분석" },
                  { id: 2, number: "02", title: "CITIZEN BETA", description: "보안 전문가 - 이상 행동 탐지 및 모니터링" },
                  { id: 3, number: "03", title: "CITIZEN GAMMA", description: "연구원 - 오메가 프로토콜 연구 진행" }
                ].map((card, index) => {
                  const isCenter = index === currentCardIndex
                  
                  // 현재 중앙 카드에 따라 위치 계산
                  let offset = 0
                  if (currentCardIndex === 0) { // 1번이 중앙
                    if (index === 0) offset = 0 // 1번 중앙
                    else if (index === 1) offset = 400 // 2번 오른쪽
                    else if (index === 2) offset = -400 // 3번 왼쪽
                  } else if (currentCardIndex === 1) { // 2번이 중앙
                    if (index === 0) offset = -400 // 1번 왼쪽
                    else if (index === 1) offset = 0 // 2번 중앙
                    else if (index === 2) offset = 400 // 3번 오른쪽
                  } else if (currentCardIndex === 2) { // 3번이 중앙
                    if (index === 0) offset = 400 // 1번 오른쪽
                    else if (index === 1) offset = -400 // 2번 왼쪽
                    else if (index === 2) offset = 0 // 3번 중앙
                  }
                  
                  return (
                    <div
                      key={card.id}
                      className={`archive-card ${isCenter ? 'active' : ''}`}
                      style={{
                        transform: `translateX(${offset}px)`,
                        zIndex: isCenter ? 10 : 5
                      }}
                      onClick={() => {
                        if (isCenter) {
                          console.log('Card selected:', card.title)
                        } else {
                          setCurrentCardIndex(index)
                        }
                      }}
                    >
                      <div className="card-number">{card.number}</div>
                      <div className="card-title">{card.title}</div>
                      <div className="card-description">{card.description}</div>
                      {isCenter && (
                        <button className="card-select-button">
                          SELECT
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="carousel-controls">
              <button 
                className="carousel-nav-btn"
                onClick={() => {
                  setCurrentCardIndex((prev) => (prev - 1 + 3) % 3)
                }}
              >
                ←
              </button>
              
              <div className="carousel-dots">
                {[0, 1, 2].map((index) => (
                  <div 
                    key={index}
                    className={`carousel-dot ${index === currentCardIndex ? 'active' : ''}`}
                    onClick={() => {
                      setCurrentCardIndex(index)
                    }}
                  />
                ))}
              </div>
              
              <button 
                className="carousel-nav-btn"
                onClick={() => {
                  setCurrentCardIndex((prev) => (prev + 1) % 3)
                }}
              >
                →
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}

export default App
