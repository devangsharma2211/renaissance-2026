import { useEffect, useState, useRef, useCallback } from "react"
import { Link } from "react-router-dom"
import { DigitalClock } from "./components/digital-clock"

// Cursor-reactive dot grid background
function CursorDotGrid() {
  const canvasRef = useRef(null)
  const mouseRef = useRef({ x: -1000, y: -1000 })
  const animationRef = useRef(0)
  const dotsRef = useRef([])

  const initDots = useCallback((width, height) => {
    const spacing = 40
    const dots = []

    for (let x = spacing / 2; x < width; x += spacing) {
      for (let y = spacing / 2; y < height; y += spacing) {
        dots.push({ x, y, baseX: x, baseY: y })
      }
    }

    dotsRef.current = dots
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      initDots(canvas.width, canvas.height)
    }

    const handleMouseMove = (e) => {
      mouseRef.current = { x: e.clientX, y: e.clientY }
    }

    const animate = () => {
      if (!ctx || !canvas) return

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const mouse = mouseRef.current
      const maxDistance = 200
      const pushStrength = 60

      for (const dot of dotsRef.current) {
        let dx = mouse.x - dot.baseX
        let dy = mouse.y - dot.baseY
        let distance = Math.sqrt(dx * dx + dy * dy)

        if (distance < maxDistance) {
          const force = (1 - distance / maxDistance) * pushStrength
          const angle = Math.atan2(dy, dx)
          dot.x = dot.baseX - Math.cos(angle) * force
          dot.y = dot.baseY - Math.sin(angle) * force
        } else {
          dot.x += (dot.baseX - dot.x) * 0.08
          dot.y += (dot.baseY - dot.y) * 0.08
        }

        const distFromMouse = Math.sqrt(
          (mouse.x - dot.x) ** 2 + (mouse.y - dot.y) ** 2
        )
        const baseOpacity = 0.6
        const highlightOpacity = distFromMouse < maxDistance 
          ? Math.min(1, baseOpacity + (1 - distFromMouse / maxDistance) * 0.4)
          : baseOpacity

        ctx.beginPath()
        ctx.arc(dot.x, dot.y, 2.5, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(155, 100, 100, ${highlightOpacity})`
        ctx.fill()
      }

      animationRef.current = requestAnimationFrame(animate)
    }

    resize()
    window.addEventListener("resize", resize)
    window.addEventListener("mousemove", handleMouseMove)
    animate()

    return () => {
      window.removeEventListener("resize", resize)
      window.removeEventListener("mousemove", handleMouseMove)
      cancelAnimationFrame(animationRef.current)
    }
  }, [initDots])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  )
}

function Preloader({ onComplete }) {
  const [scale, setScale] = useState(1)
  const [opacity, setOpacity] = useState(1)
  const [displayText, setDisplayText] = useState("RENAISSANCE")

  useEffect(() => {
    const text = "RENAISSANCE"
    let animationFrame
    let frameIndex = 0

    const animateText = () => {
      const progress = frameIndex / 30
      let newText = ""

      for (let i = 0; i < text.length; i++) {
        const charProgress = (progress * text.length - i) / 1.5

        if (charProgress <= 0) {
          newText += String.fromCharCode(65 + Math.floor(Math.random() * 26))
        } else if (charProgress >= 1) {
          newText += text[i]
        } else {
          newText += Math.random() > charProgress ? String.fromCharCode(65 + Math.floor(Math.random() * 26)) : text[i]
        }
      }

      setDisplayText(newText)
      frameIndex++

      if (frameIndex <= 30) {
        animationFrame = setTimeout(animateText, 50)
      } else {
        const zoomTimer = setTimeout(() => {
          setScale(50)
          setOpacity(0)
        }, 500)

        return () => clearTimeout(zoomTimer)
      }
    }

    animateText()

    const completeTimer = setTimeout(() => {
      onComplete()
    }, 4000)

    return () => {
      clearTimeout(animationFrame)
      clearTimeout(completeTimer)
    }
  }, [onComplete])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        backgroundColor: "#EF4444",
        opacity: opacity,
        transition: "opacity 0.8s ease-out",
      }}
    >
      <h1
        className="font-sans text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-bold tracking-wider"
        style={{
          color: "#000000",
          transform: `scale(${scale})`,
          opacity: scale > 1 ? 2 - scale / 25 : 1,
          transition: "transform 2.5s cubic-bezier(0.16, 1, 0.3, 1), opacity 1s ease-out",
        }}
      >
        {displayText}
      </h1>
    </div>
  )
}

function AnimatedNightScene() {
  return (
    <div className="fixed inset-0 overflow-hidden" style={{ backgroundColor: "#0B0B0F" }}>
      <div className="absolute inset-0" style={{ backgroundColor: "#0B0B0F" }} />

      <div className="absolute inset-0 opacity-40">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-radial from-red-900/30 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-72 h-72 bg-gradient-radial from-blue-900/20 to-transparent rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-gradient-radial from-purple-900/20 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="absolute inset-0">
        {[...Array(200)].map((_, i) => (
          <div
            key={i}
            className="absolute bg-white rounded-full animate-pulse"
            style={{
              width: Math.random() * 1.5 + 0.2 + "px",
              height: Math.random() * 1.5 + 0.2 + "px",
              left: Math.random() * 100 + "%",
              top: Math.random() * 100 + "%",
              opacity: Math.random() * 0.8 + 0.2,
              animationDuration: Math.random() * 4 + 1.5 + "s",
            }}
          />
        ))}
      </div>

      <div className="absolute inset-0 pointer-events-none">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute bg-white rounded-full"
            style={{
              width: Math.random() * 1 + 0.3 + "px",
              height: Math.random() * 1 + 0.3 + "px",
              left: Math.random() * 100 + "%",
              top: Math.random() * 100 + "%",
              opacity: Math.random() * 0.3 + 0.05,
              animation: `drift${i % 3 + 1} ${15 + Math.random() * 25}s linear infinite`,
              animationDelay: Math.random() * 8 + "s",
            }}
          />
        ))}
        <style>{`
          @keyframes drift1 { 0% { transform: translateX(0) translateY(0); } 100% { transform: translateX(100px) translateY(-50px); } }
          @keyframes drift2 { 0% { transform: translateX(0) translateY(0); } 100% { transform: translateX(-120px) translateY(60px); } }
          @keyframes drift3 { 0% { transform: translateX(0) translateY(0); } 100% { transform: translateX(80px) translateY(80px); } }
        `}</style>
      </div>
    </div>
  )
}

export default function ComingSoonExact() {
  const [showContent, setShowContent] = useState(false)
  const [contentOpacity, setContentOpacity] = useState(0)

  const handlePreloaderComplete = useCallback(() => {
    setShowContent(true)
    setTimeout(() => setContentOpacity(1), 100)
  }, [])

  return (
    <>
      {!showContent && <Preloader onComplete={handlePreloaderComplete} />}

      <main
        className="fixed inset-0 overflow-hidden bg-background"
        style={{
          opacity: contentOpacity,
          transition: "opacity 0.8s ease-out",
        }}
      >
        <AnimatedNightScene />

        <CursorDotGrid />

        <div className="relative z-10 flex flex-col items-center justify-center h-full px-4">
          <div className="mb-2 md:mb-4 cursor-pointer">
            <h1 className="text-5xl sm:text-6xl md:text-8xl lg:text-9xl xl:text-[10rem] font-sans font-bold tracking-wider text-center leading-none">
              <span className="bg-gradient-to-r from-red-400 via-red-500 to-red-400 bg-clip-text text-transparent animate-shimmer bg-[length:200%_auto] inline-flex">
                {"RENAISSANCE".split("").map((letter, index) => (
                  <span
                    key={index}
                    className="transition-all duration-300 hover:scale-125 hover:-translate-y-6 inline-block"
                    style={{
                      transitionDelay: `${index * 30}ms`,
                    }}
                  >
                    {letter}
                  </span>
                ))}
              </span>
            </h1>
          </div>

          <div className="mb-8 md:mb-12">
            <h2 className="text-xl sm:text-2xl md:text-4xl lg:text-5xl font-sans tracking-[0.3em] md:tracking-[0.5em] text-red-300 text-center">
              COMING SOON
            </h2>
          </div>

          <DigitalClock />

          <div className="mt-8 md:mt-12 w-32 md:w-48 h-px bg-gradient-to-r from-transparent via-red-500 to-transparent" />

          <p className="mt-4 md:mt-6 text-xs md:text-sm font-mono bg-gradient-to-r from-red-400 via-red-500 to-red-400 bg-clip-text text-transparent tracking-widest text-center transition-all duration-300 hover:scale-105 hover:drop-shadow-lg cursor-pointer">
            SOMETHING EXTRAORDINARY IS ON THE HORIZON
          </p>

          {/* keep Teacher Portal button only in content */}
          <div className="mt-6">
            <Link to="/teacher/login" className="inline-block px-4 py-2 rounded-md bg-red-500 hover:bg-red-600 text-white font-medium">
              Teacher Portal
            </Link>
          </div>
        </div>

        <div className="absolute top-4 left-4 md:top-6 md:left-6 pointer-events-none">
          <div className="w-10 md:w-14 h-10 md:h-14 border-l-2 border-t-2 border-red-500/40" />
        </div>
        <div className="absolute top-4 right-4 md:top-6 md:right-6 pointer-events-none">
          <div className="w-10 md:w-14 h-10 md:h-14 border-r-2 border-t-2 border-red-500/40" />
        </div>
        <div className="absolute bottom-4 left-4 md:bottom-6 md:left-6 pointer-events-none">
          <div className="w-10 md:w-14 h-10 md:h-14 border-l-2 border-b-2 border-red-500/40" />
        </div>
        <div className="absolute bottom-4 right-4 md:bottom-6 md:right-6 pointer-events-none">
          <div className="w-10 md:w-14 h-10 md:h-14 border-r-2 border-b-2 border-red-500/40" />
        </div>
      </main>
    </>
  )
}
