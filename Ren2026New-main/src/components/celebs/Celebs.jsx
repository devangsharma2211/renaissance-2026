import React, { useEffect, useState, useRef, useCallback } from "react"
import { motion, useTransform } from "framer-motion"
import './Celebs.css'
import { getAsset } from '../../config'; // Adjust path (../) based on your folder structure
// OPTION A: If using imports (Recommended for Vite/React)
// import artist1 from './assets/artist1.jpg'
// import artist2 from './assets/artist2.jpg'
// import artist3 from './assets/artist3.jpg'

const VisualizerBar = ({ index, total, scrollProgress, isPlaying, color }) => {
  const step = 1 / total;
  const start = index * step;
  const end = start + step; 

  const barColor = useTransform(
    scrollProgress || { get: () => 0 }, 
    [start, end], 
    ["#00E5FF", "#FF0000"]
  );

  return (
    <motion.div
      style={{
        width: "10px",
        borderRadius: "9999px",
        transition: "height 0.1s", 
        height: isPlaying ? `${20 + Math.abs(Math.sin(Date.now() / 100 + index * 0.4)) * 50}px` : "10px",
        backgroundColor: scrollProgress ? barColor : (isPlaying ? color : "#444"),
        boxShadow: isPlaying && !scrollProgress ? `0 0 15px ${color}` : "none",
      }}
      animate={isPlaying ? { 
        height: [20, 60, 30, 70, 20],
        transition: { duration: 0.8, repeat: Infinity, ease: "linear", delay: index * 0.05 }
      } : {}}
    />
  );
};

export default function FestivalBanner({ scrollProgress }) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [rawMousePos, setRawMousePos] = useState({ x: 0, y: 0 })
  const [activeVinyl, setActiveVinyl] = useState(null)
  const [isPlaying, setIsPlaying] = useState([false, false, false])
  const [ripples, setRipples] = useState([])
  const [confetti, setConfetti] = useState([])
  const [hoverIndex, setHoverIndex] = useState(null)
  const [clickCount, setClickCount] = useState(0)
  const [showFireworks, setShowFireworks] = useState(false)
  const [discoBallActive, setDiscoBallActive] = useState(false)
  const [spotlightOn, setSpotlightOn] = useState(false)
  const [glitchEffect, setGlitchEffect] = useState(false)
  const [autoRickshaw, setAutoRickshaw] = useState({ active: false, x: -200 })
  const [isActive, setIsActive] = useState(false)
  const containerRef = useRef(null)
  const rippleIdRef = useRef(0)
  const confettiIdRef = useRef(0)
  const trailIdRef = useRef(0)
  const [cursorTrail, setCursorTrail] = useState([])

const celebrities = [
  { 
    name: "DJ RICHAL", 
    title: "DJ NIGHT", 
    image: "https://ren2026-assests.b-cdn.net/Richal.webp", 
    color: "#FF3B8F" 
  },
  { 
    name: "BISMIL", 
    title: "CELEBRITY NIGHT", 
    image: "https://ren2026-assests.b-cdn.net/bismil.webp",
    color: "#00E5FF" 
  },
  { 
    name: "SAGAR LALWANI", 
    title: "CONCERT NIGHT", 
    image: "https://ren2026-assests.b-cdn.net/Sagar.webp",
    color: "#7cff18"
  }
];
  useEffect(() => {
    if (!containerRef.current) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsActive(entry.isIntersecting && entry.intersectionRatio > 0.1)
      },
      { threshold: [0, 0.1, 0.25], rootMargin: "200px 0px" }
    )
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!isActive) return
    const handleMouseMove = (e) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        setRawMousePos({ x, y })
        setMousePos({
          x: (e.clientX - rect.left - rect.width / 2) / 30,
          y: (e.clientY - rect.top - rect.height / 2) / 30,
        })
        const newTrail = { x, y, id: trailIdRef.current++ }
        setCursorTrail(prev => [...prev.slice(-15), newTrail])
      }
    }
    window.addEventListener("mousemove", handleMouseMove, { passive: true })
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [isActive])

  useEffect(() => {
    if (!isActive) return
    const interval = setInterval(() => {
      setAutoRickshaw({ active: true, x: -200 })
      const animate = () => {
        setAutoRickshaw(prev => {
          if (prev.x > 1600) return { active: false, x: -200 }
          return { ...prev, x: prev.x + 8 }
        })
      }
      const animationInterval = setInterval(animate, 16)
      setTimeout(() => clearInterval(animationInterval), 5000)
    }, 15000)
    
    const kickoff = setTimeout(() => {
      setAutoRickshaw({ active: true, x: -200 })
      const animate = () => {
        setAutoRickshaw(prev => {
          if (prev.x > 1600) return { active: false, x: -200 }
          return { ...prev, x: prev.x + 8 }
        })
      }
      const animationInterval = setInterval(animate, 16)
      setTimeout(() => clearInterval(animationInterval), 5000)
    }, 2000)
    
    return () => {
      clearInterval(interval)
      clearTimeout(kickoff)
    }
  }, [isActive])

  const launchConfetti = useCallback((x, y) => {
    const colors = ["#FF3B8F", "#00E5FF", "#C4FF2B", "#FFD700", "#FF6B35", "#9B59B6", "#E74C3C", "#2ECC71"]
    const newConfetti = Array.from({ length: 50 }, (_, i) => ({
      x, y,
      color: colors[i % colors.length],
      id: confettiIdRef.current++,
      angle: (Math.PI * 2 * i) / 50 + Math.random() * 0.5,
      velocity: 8 + Math.random() * 8,
    }))
    setConfetti(prev => [...prev, ...newConfetti])
    setTimeout(() => {
      setConfetti(prev => prev.filter(c => !newConfetti.find(nc => nc.id === c.id)))
    }, 3000)
  }, [])

  const createRipple = useCallback((e) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const newRipple = { x, y, id: rippleIdRef.current++ }
    setRipples(prev => [...prev, newRipple])
    setClickCount(prev => prev + 1)
    
    if ((clickCount + 1) % 10 === 0) {
      setShowFireworks(true)
      launchConfetti(720, 450)
      setTimeout(() => setShowFireworks(false), 2000)
    }
    
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== newRipple.id))
    }, 1000)
  }, [clickCount, launchConfetti])

  const togglePlay = (index, e) => {
    e.stopPropagation()
    
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    launchConfetti(e.clientX - rect.left, e.clientY - rect.top)
    
    setGlitchEffect(true)
    setTimeout(() => setGlitchEffect(false), 200)
    
    setIsPlaying(prev => {
      const newState = [...prev]
      newState[index] = !newState[index]
      return newState
    })
    setActiveVinyl(isPlaying[index] ? null : index)
  }

  const handleDoubleClick = () => {
    setDiscoBallActive(prev => !prev)
    setSpotlightOn(prev => !prev)
  }

  return (
    <div className="celebs-wrapper">
    <div style={{ width: "100vw", display: "flex", alignItems: "center", justifyContent: "center"}}>
      <div
        ref={containerRef}
        onClick={createRipple}
        onDoubleClick={handleDoubleClick}
        style={{
          position: "relative",
          width: "100%",
          margin: "0 auto",
          overflow: "hidden",
          minHeight: "100vh", // Add this line
          userSelect: "none",
          
        }}
        className={`celebs-container ${glitchEffect ? "animate-glitch" : ""}`}
      >
        {/* Spotlight */}
        {spotlightOn && (
          <div 
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              zIndex: 80,
              background: `radial-gradient(circle 300px at ${rawMousePos.x}px ${rawMousePos.y}px, transparent 0%, rgba(0,0,0,0.7) 100%)`,
            }}
          />
        )}

        {/* Background Image */}
        <img
  src={getAsset("/heroSection/bg3.webp")}
  className="celebs-bg"
  alt="Festival Background"
  loading="lazy"
  decoding="async"
  style={{
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
  }}
  crossOrigin="anonymous"
/>

        {/* Disco Ball */}
        {discoBallActive && (
          <div className="disco-ball-wrapper" style={{ position: "absolute", top: "40px", left: "50%", transform: "translateX(-50%)", zIndex: 70 }}>
            {/* Disco Ball Content Omitted for Brevity - keeping your original logic */}
            <div style={{ width: "128px", height: "128px", borderRadius: "50%", background: "radial-gradient(circle, #fff 0%, #ccc 50%, #999 100%)", animation: "spin 3s linear infinite", position: "relative" }}>
              {[...Array(24)].map((_, i) => (
                <div key={i} style={{ position: "absolute", width: "12px", height: "12px", backgroundColor: "white", borderRadius: "2px", top: `${30 + 20 * Math.sin((i * Math.PI * 2) / 12)}%`, left: `${30 + 20 * Math.cos((i * Math.PI * 2) / 12)}%`, transform: `rotate(${i * 30}deg)`, boxShadow: "0 0 10px white" }} />
              ))}
            </div>
            {[...Array(8)].map((_, i) => (
              <div key={i} style={{ position: "absolute", top: "64px", left: "64px", width: "800px", height: "8px", transformOrigin: "left", background: `linear-gradient(90deg, ${["#FF3B8F", "#00E5FF", "#C4FF2B", "#FFD700", "#9B59B6", "#FF6B35", "#2ECC71", "#E74C3C"][i]} 0%, transparent 100%)`, transform: `rotate(${i * 45}deg)`, opacity: 0.6, animation: `disco-ray ${2 + i * 0.3}s linear infinite` }} />
            ))}
          </div>
        )}

        {/* Fireworks */}
        {showFireworks && (
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 90 }}>
            {[...Array(5)].map((_, i) => (
              <div key={i} style={{ position: "absolute", left: `${20 + i * 15}%`, top: `${20 + (i % 3) * 15}%` }}>
                {[...Array(12)].map((_, j) => (
                  <div key={j} style={{ position: "absolute", width: "8px", height: "8px", borderRadius: "50%", backgroundColor: ["#FF3B8F", "#00E5FF", "#C4FF2B", "#FFD700"][j % 4], animation: "firework-particle 1s ease-out forwards", animationDelay: `${i * 0.2}s`, transform: `rotate(${j * 30}deg) translateY(-${50 + Math.random() * 50}px)`, boxShadow: `0 0 10px ${["#FF3B8F", "#00E5FF", "#C4FF2B", "#FFD700"][j % 4]}` }} />
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Confetti */}
        {confetti.map((c, i) => (
          <div key={c.id} style={{ position: "absolute", pointerEvents: "none", zIndex: 100, left: c.x, top: c.y, animation: "confetti-fall 3s ease-out forwards", animationDelay: `${i * 0.02}s` }}>
            <div style={{ width: "12px", height: "12px", backgroundColor: c.color, transform: `rotate(${c.angle * 180}deg)`, clipPath: i % 3 === 0 ? "polygon(50% 0%, 0% 100%, 100% 100%)" : i % 3 === 1 ? "circle(50%)" : "none", boxShadow: `0 0 5px ${c.color}`, animation: "confetti-spin 0.5s linear infinite" }} />
          </div>
        ))}

        {/* Ripples */}
        {ripples.map(ripple => (
          <div key={ripple.id} style={{ position: "absolute", pointerEvents: "none", zIndex: 100, left: ripple.x, top: ripple.y, transform: "translate(-50%, -50%)" }}>
            <div style={{ width: "16px", height: "16px", borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.8)", animation: "ping 1s cubic-bezier(0,0,0.2,1) infinite" }} />
            <div style={{ position: "absolute", inset: 0, width: "400px", height: "400px", borderRadius: "50%", border: "4px solid rgba(255,255,255,0.5)", transform: "translate(-50%, -50%)", animation: "ripple 1s ease-out forwards" }} />
          </div>
        ))}

        {/* Auto-Rickshaw */}
        {autoRickshaw.active && (
          <div style={{ position: "absolute", bottom: "128px", zIndex: 60, left: autoRickshaw.x }}>
            {/* Rickshaw SVG Omitted for Brevity - keeping original */}
            <svg width="120" height="80" viewBox="0 0 120 80" style={{ filter: "drop-shadow(0 10px 15px rgba(0,0,0,0.5))" }}>
              <rect x="20" y="20" width="80" height="45" rx="8" fill="#2ECC71" stroke="#1a1a1a" strokeWidth="2"/>
              <path d="M25 20 Q60 -5 95 20" fill="#C4FF2B" stroke="#1a1a1a" strokeWidth="2"/>
              <rect x="85" y="25" width="20" height="35" rx="4" fill="#FFD700"/>
              <circle cx="35" cy="70" r="12" fill="#1a1a1a" style={{ animation: "spin 0.5s linear infinite", transformOrigin: "35px 70px" }}/>
              <circle cx="85" cy="70" r="12" fill="#1a1a1a" style={{ animation: "spin 0.5s linear infinite", transformOrigin: "85px 70px" }}/>
              <circle cx="35" cy="70" r="4" fill="#ccc"/>
              <circle cx="85" cy="70" r="4" fill="#ccc"/>
              <rect x="30" y="28" width="45" height="20" rx="2" fill="#87CEEB"/>
              <circle cx="100" cy="50" r="5" fill="#FFD700"><animate attributeName="opacity" values="0.5;1;0.5" dur="0.3s" repeatCount="indefinite"/></circle>
            </svg>
            <div style={{ fontSize: "12px", fontWeight: "bold", textAlign: "center", color: "#f59e0b", marginTop: "4px", animation: "bounce 1s infinite" }}>BEEP BEEP!</div>
          </div>
        )}

        {/* Floating Music Notes */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 10, overflow: "hidden" }}>
          {[...Array(12)].map((_, i) => (
            <div className="sound-visualizer" key={i} style={{ position: "absolute", left: `${5 + i * 8}%`, fontSize: "48px", animation: `float-up ${6 + i * 1.5}s linear infinite`, animationDelay: `${i * 0.8}s` }}>
              <span style={{ color: ["#FF3B8F", "#00E5FF", "#C4FF2B", "#FFD700", "#9B59B6", "#FF6B35"][i % 6], textShadow: `0 0 20px ${["#FF3B8F", "#00E5FF", "#C4FF2B", "#FFD700", "#9B59B6", "#FF6B35"][i % 6]}` }}>{["♪", "♫", "♬", "♩"][i % 4]}</span>
            </div>
          ))}
        </div>

        {/* Sound Wave Visualizer */}
        <div className="visualizer-container" style={{ position: "absolute", top: "8%", left: "50%", transform: "translateX(-50%)", display: "flex", alignItems: "flex-end", gap: "6px", zIndex: 30, height: "80px" }}>
          {[...Array(25)].map((_, i) => (
            <VisualizerBar key={i} index={i} total={25} scrollProgress={scrollProgress} isPlaying={activeVinyl !== null} color={activeVinyl !== null ? celebrities[activeVinyl].color : "#444"} />
          ))}
        </div>

        {/* Vinyl Records */}
        <div className="vinyl-container" style={{ position: "absolute", bottom: "290px", left: "50%", transform: "translateX(-50%)", display: "flex", alignItems: "flex-end", justifyContent: "center", gap: "40px", zIndex: 40 }}>
          {celebrities.map((celeb, index) => {
            const isCenter = index === 1
            const size = isCenter ? 350 : 262.5
            const parallaxX = index === 0 ? -1 : index === 2 ? 1 : 0.3
            const parallaxY = index === 1 ? -0.7 : 0.6

            return (
              <div
                key={index}
                className="vinyl-item"
                style={{
                  position: "relative",
                  cursor: "pointer",
                  transition: "all 0.3s",
                  marginBottom: isCenter ? "-40px" : "0",
                  transform: `translate(${mousePos.x * parallaxX}px, ${mousePos.y * parallaxY}px) scale(${hoverIndex === index ? 1.15 : 1})`,
                  zIndex: hoverIndex === index ? 60 : isCenter ? 50 : 40,
                  filter: hoverIndex !== null && hoverIndex !== index ? "brightness(0.7)" : "brightness(1)",
                }}
                onMouseEnter={() => setHoverIndex(index)}
                onMouseLeave={() => setHoverIndex(null)}
                onClick={(e) => togglePlay(index, e)}
              >
                {/* Glow */}
                <div style={{ position: "absolute", inset: "-24px", borderRadius: "50%", filter: "blur(24px)", transition: "all 0.5s", backgroundColor: celeb.color, opacity: hoverIndex === index || isPlaying[index] ? 0.7 : 0, animation: isPlaying[index] ? "pulse-glow 1s ease-in-out infinite" : "none" }} />

                {/* Sound waves */}
                {isPlaying[index] && (
                  <>
                    {[...Array(3)].map((_, i) => (
                      <div key={i} style={{ position: "absolute", inset: 0, borderRadius: "50%", border: `2px solid ${celeb.color}`, animation: "ping 1.5s cubic-bezier(0,0,0.2,1) infinite", animationDelay: `${i * 0.3}s` }} />
                    ))}
                  </>
                )}

                {/* Vinyl Disc Container */}
                <div 
                  style={{ 
                    position: "relative",
                    width: size, 
                    height: size,
                    transform: hoverIndex === index && !isPlaying[index] ? "rotateY(15deg) rotateX(-10deg)" : "none",
                    transformStyle: "preserve-3d",
                    transition: "transform 0.5s",
                  }}
                >
                  
                  {/* LAYER 1: SPINNING DISC */}
                  <div
                    style={{
                        position: "absolute",
                        inset: 0,
                        animation: isPlaying[index] ? "spin 1.5s linear infinite" : "none",
                    }}
                  >
                        {/* Vinyl surface (Grooves) */}
                        <div 
                            style={{
                            position: "absolute",
                            inset: 0,
                            borderRadius: "50%",
                            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
                            background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.1) 0%, transparent 50%), radial-gradient(circle, #1a1a1a 0%, #2a2a2a 30%, #1a1a1a 31%, #2a2a2a 50%, #1a1a1a 51%, #2a2a2a 70%, #1a1a1a 100%)`,
                            }}
                        >
                            {[...Array(isCenter ? 10 : 7)].map((_, i) => (
                            <div key={i} style={{ position: "absolute", borderRadius: "50%", border: "1px solid", borderColor: hoverIndex === index ? `${celeb.color}40` : i % 2 === 0 ? "#3a3a3a" : "#2a2a2a", inset: `${(i + 2) * (isCenter ? 11.25 : 12.5)}px`, transition: "all 0.3s" }} />
                            ))}
                        </div>

                        {/* Vinyl shine */}
                        <div style={{ position: "absolute", inset: 0, borderRadius: "50%", pointerEvents: "none", background: "linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 50%, rgba(0,0,0,0.1) 100%)" }} />

                        {/* Light rays for center vinyl */}
                        {isCenter && (
                            <div style={{ position: "absolute", inset: "-24px", zIndex: -1 }}>
                            <svg viewBox="0 0 100 100" style={{ width: "100%", height: "100%", animation: isPlaying[1] ? "spin 2s linear infinite" : "spin 15s linear infinite" }}>
                                {[...Array(16)].map((_, i) => (
                                <line key={i} x1="50" y1="50" x2="50" y2="2" stroke={celeb.color} strokeWidth="1.5" transform={`rotate(${i * 22.5} 50 50)`} opacity={isPlaying[1] ? "0.9" : "0.5"} />
                                ))}
                            </svg>
                            </div>
                        )}
                  </div>

                  {/* LAYER 2: STATIC IMAGE (NO OVERLAY) */}
                  <div
                    style={{
                      position: "absolute",
                      borderRadius: "50%",
                      overflow: "hidden",
                      inset: isCenter ? "18.75px" : "16.25px",
                      borderWidth: "5px",
                      borderStyle: "solid",
                      borderColor: celeb.color,
                      boxShadow: hoverIndex === index || isPlaying[index] 
                        ? `0 0 40px ${celeb.color}, 0 0 80px ${celeb.color}40, inset 0 0 30px rgba(0,0,0,0.5)` 
                        : "0 10px 40px rgba(0,0,0,0.4)",
                      transform: hoverIndex === index ? "scale(1.05)" : "scale(1)",
                      transition: "all 0.5s",
                    }}
                  >
                    <img 
                      src={celeb.image} 
                      alt={celeb.name} 
                      style={{ 
                        width: (index === 0 || index === 2) ? "140%" : "100%", // Increase celeb1 and celeb3 image size
                        height: (index === 0 || index === 2) ? "140%" : "100%", // Increase celeb1 and celeb3 image size
                        objectFit: "cover", // Changed back to cover to properly fill the circle
                        transform: (index === 0 || index === 2) ? "scale(1)" : "scale(1)", // Scale celeb1 and celeb3 image
                      }} 
                      loading="lazy"
                      decoding="async"
                      crossOrigin="anonymous" 
                    />
                    
                    {/* OVERLAY REMOVED HERE */}
                  </div>

                </div>

                {/* Name badge */}
                <div style={{ position: "absolute", bottom: "-64px", left: "50%", padding: "10px 20px", borderRadius: "4px", backgroundColor: celeb.color, transform: `translateX(-50%) scale(${hoverIndex === index ? 1.15 : 1})`, boxShadow: hoverIndex === index ? `0 0 30px ${celeb.color}, 0 5px 20px rgba(0,0,0,0.4)` : "0 5px 20px rgba(0,0,0,0.3)", transition: "all 0.3s" }}>
                  <p style={{ fontSize: "14px", fontWeight: 900, letterSpacing: "0.1em", whiteSpace: "nowrap", color: index === 2 || index === 1 ? "#18181b" : "white", margin: 0 }}>{celeb.name}</p>
                  <p style={{ fontSize: "12px", textAlign: "center", fontWeight: 600, color: index === 2 || index === 1 ? "#3f3f46" : "#fce7f3", margin: 0 }}>{celeb.title}</p>
                </div>

                {/* Now Playing badge */}
                {isPlaying[index] && (
                  <div style={{ position: "absolute", top: "-24px", left: "50%", transform: "translateX(-50%)", padding: "6px 16px", borderRadius: "9999px", fontSize: "12px", fontWeight: 900, letterSpacing: "0.1em", backgroundColor: celeb.color, color: index === 0 ? "white" : "#1a1a1a", boxShadow: `0 0 20px ${celeb.color}`, animation: "bounce 1s infinite" }}>NOW PLAYING</div>
                )}
              </div>
            )
          })}
        </div>

        {/* Cassette Tapes and Film Strip and Neon Beams... (Omitted for brevity - keeping original) */}
        {/* You can keep the rest of the code exactly as it was in your previous snippet */}
        <div className="cassette-tapes" style={{ position: "absolute", top: "28%", left: "40px", zIndex: 30, cursor: "grab", transform: `rotate(-12deg) translate(${mousePos.x * 0.8}px, ${mousePos.y * 0.5}px)`, animation: "float-gentle 4s ease-in-out infinite", transition: "all 0.3s" }} onClick={(e) => { e.stopPropagation(); launchConfetti(e.clientX - containerRef.current.getBoundingClientRect().left, e.clientY - containerRef.current.getBoundingClientRect().top) }}>
          <div style={{ width: "110px", height: "70px", background: "linear-gradient(to bottom, #E74C3C, #C0392B)", borderRadius: "8px", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)", border: "2px solid #18181b" }}>
            <div style={{ margin: "8px", height: "30px", backgroundColor: "#fef3c7", borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "space-around" }}>
              <div style={{ width: "24px", height: "24px", borderRadius: "50%", backgroundColor: "#18181b", display: "flex", alignItems: "center", justifyContent: "center", animation: activeVinyl === 0 ? "spin 0.5s linear infinite" : "none" }}><div style={{ width: "8px", height: "8px", backgroundColor: "#fef3c7", borderRadius: "50%" }} /></div>
              <div style={{ width: "24px", height: "24px", borderRadius: "50%", backgroundColor: "#18181b", display: "flex", alignItems: "center", justifyContent: "center", animation: activeVinyl === 0 ? "spin 0.5s linear infinite" : "none" }}><div style={{ width: "8px", height: "8px", backgroundColor: "#fef3c7", borderRadius: "50%" }} /></div>
            </div>
            <div style={{ margin: "0 8px", height: "20px", backgroundColor: "#18181b", borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ color: "#fbbf24", fontSize: "7px", fontWeight: 900, letterSpacing: "0.05em" }}>RENAISSANCE 2026</span></div>
          </div>
        </div>

        <div className="cassette-tapes2" style={{ position: "absolute", top: "22%", right: "56px", zIndex: 30, cursor: "grab", transform: `rotate(10deg) translate(${mousePos.x * -0.6}px, ${mousePos.y * 0.4}px)`, animation: "float-gentle 5s ease-in-out infinite", animationDelay: "1s", transition: "all 0.3s" }} onClick={(e) => { e.stopPropagation(); launchConfetti(e.clientX - containerRef.current.getBoundingClientRect().left, e.clientY - containerRef.current.getBoundingClientRect().top) }}>
          <div style={{ width: "100px", height: "65px", background: "linear-gradient(to bottom, #9B59B6, #8E44AD)", borderRadius: "8px", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)", border: "2px solid #18181b" }}>
            <div style={{ margin: "8px", height: "26px", backgroundColor: "#fef3c7", borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "space-around" }}>
              <div style={{ width: "20px", height: "20px", borderRadius: "50%", backgroundColor: "#18181b", display: "flex", alignItems: "center", justifyContent: "center", animation: activeVinyl === 2 ? "spin 0.5s linear infinite" : "none" }}><div style={{ width: "6px", height: "6px", backgroundColor: "#fef3c7", borderRadius: "50%" }} /></div>
              <div style={{ width: "20px", height: "20px", borderRadius: "50%", backgroundColor: "#18181b", display: "flex", alignItems: "center", justifyContent: "center", animation: activeVinyl === 2 ? "spin 0.5s linear infinite" : "none" }}><div style={{ width: "6px", height: "6px", backgroundColor: "#fef3c7", borderRadius: "50%" }} /></div>
            </div>
            <div style={{ margin: "0 8px", height: "16px", backgroundColor: "#18181b", borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ color: "#d8b4fe", fontSize: "6px", fontWeight: 900 }}>INDIE MIXTAPE</span></div>
          </div>
        </div>

        <div style={{ position: "absolute", top: "20px", left: 0, right: 0, display: "flex", justifyContent: "center", zIndex: 30 }}>
          <div style={{ display: "flex", alignItems: "center", backgroundColor: "#18181b", height: "72px", padding: "0 12px", borderRadius: "8px", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)", transform: `rotate(-2deg) translateX(${mousePos.x * 0.6}px)`, transition: "all 0.3s" }}>
            {[...Array(9)].map((_, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", margin: "0 6px" }}>
                <div style={{ width: "10px", height: "10px", backgroundColor: "#3f3f46", borderRadius: "2px", marginBottom: "4px" }} />
                <div style={{ width: "48px", height: "36px", borderRadius: "4px", overflow: "hidden", background: `linear-gradient(135deg, ${["#FF3B8F", "#00E5FF", "#C4FF2B", "#FFD700", "#9B59B6", "#FF6B35", "#2ECC71", "#E74C3C", "#3498DB"][i]} 0%, ${["#FF3B8F", "#00E5FF", "#C4FF2B", "#FFD700", "#9B59B6", "#FF6B35", "#2ECC71", "#E74C3C", "#3498DB"][(i + 1) % 9]} 100%)`, animation: `pulse ${1 + i * 0.15}s ease-in-out infinite`, transition: "all 0.3s" }} />
                <div style={{ width: "10px", height: "10px", backgroundColor: "#3f3f46", borderRadius: "2px", marginTop: "4px" }} />
              </div>
            ))}
          </div>
        </div>

        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 20, overflow: "hidden" }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} style={{ position: "absolute", top: "50%", left: "50%", width: "250%", height: "8px", background: `linear-gradient(90deg, transparent 0%, ${["#00E5FF", "#FF3B8F", "#C4FF2B", "#00E5FF", "#FF3B8F", "#9B59B6"][i]}80 50%, transparent 100%)`, transform: `translate(-50%, -50%) rotate(${(i * 30) + mousePos.x * (i % 2 === 0 ? 0.8 : -0.8) + mousePos.y * (i % 2 === 0 ? -0.5 : 0.5)}deg)`, boxShadow: `0 0 30px ${["#00E5FF", "#FF3B8F", "#C4FF2B", "#00E5FF", "#FF3B8F", "#9B59B6"][i]}60`, opacity: 0.7, transition: "all 0.2s" }} />
          ))}
        </div>

        {/* Double Click to Rock Text */}
        <div 
          className="hidden md:block"
          style={{
            position: "absolute",
            bottom: "10px",
            left: "5px",
            zIndex: 100,
            borderRadius: "8px",
            color: "#000",
            fontSize: "14px",
            fontWeight: "bold",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          Click | Double Click | 10-Clicks  </div>

        {clickCount >= 5 && (
          <div style={{ position: "absolute", top: "16px", right: "16px", backgroundColor: "rgba(24,24,27,0.9)", backdropFilter: "blur(4px)", padding: "8px 16px", borderRadius: "9999px", color: "#fbbf24", fontWeight: "bold", fontSize: "14px", zIndex: 50, animation: "bounce 1s infinite" }}>
            Clicks: {clickCount}
          </div>
        )}

        <style>{`
          @keyframes float-up { 0% { transform: translateY(900px) rotate(0deg); opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { transform: translateY(-100px) rotate(360deg); opacity: 0; } }
          @keyframes equalizer { 0% { transform: scaleY(0.3); } 100% { transform: scaleY(1); } }
          @keyframes float-gentle { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-15px); } }
          @keyframes confetti-fall { 0% { transform: translate(0, 0) rotate(0deg); opacity: 1; } 100% { transform: translate(calc((var(--random, 0.5) - 0.5) * 400px), 300px) rotate(720deg); opacity: 0; } }
          @keyframes confetti-spin { to { transform: rotate(360deg); } }
          @keyframes pulse-glow { 0%, 100% { opacity: 0.5; transform: scale(1); } 50% { opacity: 0.8; transform: scale(1.1); } }
          @keyframes disco-ray { 0% { transform: rotate(0deg); opacity: 0.6; } 100% { transform: rotate(360deg); opacity: 0.6; } }
          @keyframes firework-particle { 0% { transform: scale(1) translateY(0); opacity: 1; } 100% { transform: scale(0) translateY(-100px); opacity: 0; } }
          @keyframes ripple { to { transform: translate(-50%, -50%) scale(4); opacity: 0; } }
          @keyframes spin { to { transform: rotate(360deg); } }
          @keyframes ping { 75%, 100% { transform: scale(2); opacity: 0; } }
          @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
          @keyframes bounce { 0%, 100% { transform: translateY(-25%); animation-timing-function: cubic-bezier(0.8, 0, 1, 1); } 50% { transform: translateY(0); animation-timing-function: cubic-bezier(0, 0, 0.2, 1); } }
          .animate-glitch { animation: glitch 0.2s ease-in-out; }
          @keyframes glitch { 0%, 100% { transform: translate(0); filter: hue-rotate(0deg); } 25% { transform: translate(-5px, 5px); filter: hue-rotate(90deg); } 50% { transform: translate(5px, -5px); filter: hue-rotate(180deg); } 75% { transform: translate(-5px, -5px); filter: hue-rotate(270deg); } }
        `}</style>
      </div>
    </div>
    </div>
  )
}
