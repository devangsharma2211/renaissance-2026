import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Link} from 'react-router-dom';
import { GraduationCap, Users, Rocket, Heart, Star, Sparkles, Zap } from "lucide-react"
import { getAsset } from "../../config"
// Floating Desi Elements Component
function FloatingElements() {
  const elements = [
    // Mirchi (Chillies)
    { type: 'mirchi', x: '5%', y: '20%', rotate: -15, delay: 0 },
    { type: 'mirchi', x: '92%', y: '35%', rotate: 25, delay: 0.3 },
    { type: 'mirchi', x: '8%', y: '70%', rotate: -30, delay: 0.6 },
    // Marigold flowers
    { type: 'marigold', x: '95%', y: '15%', rotate: 10, delay: 0.2 },
    { type: 'marigold', x: '3%', y: '45%', rotate: -20, delay: 0.5 },
    { type: 'marigold', x: '90%', y: '75%', rotate: 15, delay: 0.8 },
    // Stars
    { type: 'star', x: '15%', y: '10%', rotate: 0, delay: 0.1 },
    { type: 'star', x: '85%', y: '55%', rotate: 45, delay: 0.4 },
    { type: 'star', x: '12%', y: '85%', rotate: 20, delay: 0.7 },
    // Chai cups
    { type: 'chai', x: '88%', y: '88%', rotate: -5, delay: 0.9 },
    { type: 'chai', x: '6%', y: '55%', rotate: 10, delay: 0.4 },
  ]

  return (
    <div className="fixed inset-0 pointer-events-none z-20 overflow-hidden"
    
    >
      {elements.map((el, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{ left: el.x, top: el.y }}
          initial={{ opacity: 0, scale: 0, rotate: el.rotate - 20 }}
          animate={{ opacity: 1, scale: 1, rotate: el.rotate }}
          transition={{ delay: el.delay + 0.5, duration: 0.5, type: 'spring' }}
        >
          <motion.div
            animate={{ y: [-5, 5, -5], rotate: [el.rotate - 3, el.rotate + 3, el.rotate - 3] }}
            transition={{ duration: 3 + i * 0.3, repeat: Infinity, ease: 'easeInOut' }}
          >
            {el.type === 'mirchi' && (
              <svg width="50" height="60" viewBox="0 0 50 60" className="drop-shadow-lg">
                <path d="M25 5 C15 15, 10 35, 15 50 C18 55, 25 58, 30 55 C40 45, 38 20, 30 8 C28 5, 25 5, 25 5" fill="#E53935" stroke="#8B0000" strokeWidth="2"/>
                <path d="M23 2 C23 2, 25 -2, 28 2 C28 5, 25 8, 25 8" fill="#2E7D32" stroke="#1B5E20" strokeWidth="1.5"/>
                <ellipse cx="22" cy="20" rx="4" ry="8" fill="#FF6B6B" opacity="0.6"/>
              </svg>
            )}
            {el.type === 'marigold' && (
              <svg width="55" height="55" viewBox="0 0 55 55" className="drop-shadow-lg">
                {[...Array(12)].map((_, j) => (
                  <ellipse
                    key={j}
                    cx="27.5"
                    cy="12"
                    rx="8"
                    ry="14"
                    fill={j % 2 === 0 ? '#FFB800' : '#FF8F00'}
                    stroke="#E65100"
                    strokeWidth="1"
                    transform={`rotate(${j * 30} 27.5 27.5)`}
                  />
                ))}
                <circle cx="27.5" cy="27.5" r="10" fill="#FF6D00" stroke="#E65100" strokeWidth="2"/>
                <circle cx="27.5" cy="27.5" r="5" fill="#FFB800"/>
              </svg>
            )}
            {el.type === 'star' && (
              <svg width="45" height="45" viewBox="0 0 45 45" className="drop-shadow-lg">
                <polygon
                  points="22.5,2 28,17 44,17 31,27 36,43 22.5,33 9,43 14,27 1,17 17,17"
                  fill="#FFD700"
                  stroke="#FF8F00"
                  strokeWidth="2"
                />
                <polygon
                  points="22.5,8 26,17 35,17 28,23 31,33 22.5,27 14,33 17,23 10,17 19,17"
                  fill="#FFEB3B"
                />
              </svg>
            )}
            {el.type === 'chai' && (
              <svg width="50" height="55" viewBox="0 0 50 55" className="drop-shadow-lg">
                <path d="M10 15 L10 45 C10 50, 40 50, 40 45 L40 15 Z" fill="#FFF8E7" stroke="#8B4513" strokeWidth="3"/>
                <ellipse cx="25" cy="15" rx="15" ry="5" fill="#D2691E" stroke="#8B4513" strokeWidth="2"/>
                <path d="M40 20 C50 20, 50 35, 40 35" fill="none" stroke="#8B4513" strokeWidth="3"/>
                <path d="M15 25 C18 22, 22 28, 25 22 C28 28, 32 22, 35 25" fill="none" stroke="#FFF" strokeWidth="2" opacity="0.6"/>
              </svg>
            )}
          </motion.div>
        </motion.div>
      ))}
    </div>
  )
}

// Rangoli Pattern Border
function RangoliBorder() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
      {/* Top border */}
      <div className="absolute top-0 left-0 right-0 h-8 flex">
        {[...Array(30)].map((_, i) => (
          <div key={i} className="flex-1 flex items-center justify-center">
            <div 
              className="w-6 h-6 rotate-45" 
              style={{ backgroundColor: i % 3 === 0 ? '#E91E63' : i % 3 === 1 ? '#FFB800' : '#0066FF' }}
            />
          </div>
        ))}
      </div>
      {/* Bottom border */}
      <div className="absolute bottom-0 left-0 right-0 h-8 flex">
        {[...Array(30)].map((_, i) => (
          <div key={i} className="flex-1 flex items-center justify-center">
            <div 
              className="w-6 h-6 rotate-45" 
              style={{ backgroundColor: i % 3 === 0 ? '#0066FF' : i % 3 === 1 ? '#E91E63' : '#FFB800' }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function AboutJECRC() {
  const [showScrollIndicator, setShowScrollIndicator] = useState(true)

  useEffect(() => {
    const handleScroll = () => {
      // Hide indicator once user scrolls more than 50px
      if (window.scrollY > 50) {
        setShowScrollIndicator(false)
      } else {
        setShowScrollIndicator(true)
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const features = [
    {
      icon: GraduationCap,
      title: "Academic Excellence",
      titleHindi: "शिक्षा",
      description: "Two decades of nurturing future leaders",
      bgColor: "#E91E63",
    },
    {
      icon: Rocket,
      title: "Innovation Hub",
      titleHindi: "नवाचार",
      description: "State-of-the-art labs & research",
      bgColor: "#0066FF",
    },
    {
      icon: Users,
      title: "Vibrant Community",
      titleHindi: "समुदाय",
      description: "Cultural & tech clubs for all",
      bgColor: "#FFB800",
      dark: true,
    },
    {
      icon: Heart,
      title: "Social Impact",
      titleHindi: "सेवा",
      description: "Creating positive change",
      bgColor: "#E53935",
    },
  ]

  return (
    <div className="min-h-screen overflow-hidden relative">
      {/* Collage Background Images */}
      <div className="fixed inset-0 z-0">
        {/* Top Section - Yellow Collage */}
        <div 
          className="absolute top-0 left-0 right-0 h-[50vh]"
          style={{
            backgroundImage: `url(${getAsset("/about/topImage.webp")})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center bottom',
          }}
        />
        
        {/* Bottom Section - Coral/Orange Collage */}
        <div 
          className="absolute bottom-0 left-0 right-0 h-[50vh]"
          style={{
            backgroundImage: `url(${getAsset("/about/bottomImage.webp")})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center top',
          }}
        />
        
        {/* Gradient blend between images */}
        <div 
          className="absolute top-[35vh] left-0 right-0 h-[35vh]"
          style={{
            background: 'linear-gradient(to bottom, rgba(255,184,0,0) 0%, rgba(255,184,0,0.95) 25%, #FFB800 40%, #E8751A 60%, rgba(211,84,0,0.95) 75%, rgba(211,84,0,0) 100%)',
          }}
        />
      </div>

      {/* Floating Desi Elements */}
      <FloatingElements />

      {/* Scroll Indicator - Truck Art Style - Only visible at top */}
      <AnimatePresence>
        {showScrollIndicator && (
          <motion.div 
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="relative">
              <div 
                className="px-6 py-2 border-4 border-[#5D1A1A]"
                style={{ 
                  backgroundColor: '#E91E63',
                  boxShadow: '4px 4px 0 #5D1A1A'
                }}
              >
                <span className="text-white font-black text-sm tracking-[0.3em]">SCROLL DOWN</span>
              </div>
              <div className="flex justify-center mt-2 gap-1">
                {[0, 1, 2].map(i => (
                  <motion.div
                    key={i}
                    className="w-3 h-3 rotate-45"
                    style={{ backgroundColor: '#FFB800', border: '2px solid #5D1A1A' }}
                    animate={{ y: [0, 5, 0] }}
                    transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="relative z-30 px-4 py-24 md:py-32">
        <div className="max-w-5xl mx-auto">
          
          {/* Hero Title Card - Bollywood Poster Style */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, rotate: -3 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 0.7, type: 'spring' }}
            className="relative mb-10"
          >
            {/* Multiple stacked layers for depth */}
            <div className="absolute -inset-4 bg-[#E53935]" style={{ transform: 'rotate(3deg)' }} />
            <div className="absolute -inset-4 bg-[#0066FF]" style={{ transform: 'rotate(1.5deg)' }} />
            <div className="absolute -inset-4 bg-[#FFB800]" style={{ transform: 'rotate(-1deg)' }} />
            <div className="absolute -inset-4 bg-[#E91E63]" style={{ transform: 'rotate(-2deg)' }} />
            
            <div 
              className="relative p-8 md:p-12 border-[10px] border-[#5D1A1A]"
              style={{ backgroundColor: '#FFF8E7' }}
            >
              {/* Corner decorations - Lotus motifs */}
              {[
                { pos: '-top-6 -left-6 rotate-0', bg: '#E91E63' },
                { pos: '-top-6 -right-6 rotate-90', bg: '#0066FF' },
                { pos: '-bottom-6 -left-6 -rotate-90', bg: '#FFB800' },
                { pos: '-bottom-6 -right-6 rotate-180', bg: '#E53935' },
              ].map((corner, i) => (
                <div key={i} className={`absolute ${corner.pos}`}>
                  <svg width="50" height="50" viewBox="0 0 50 50">
                    <circle cx="25" cy="25" r="20" fill={corner.bg} stroke="#5D1A1A" strokeWidth="3"/>
                    {[...Array(8)].map((_, j) => (
                      <ellipse key={j} cx="25" cy="10" rx="5" ry="10" fill="#FFF8E7" transform={`rotate(${j * 45} 25 25)`}/>
                    ))}
                    <circle cx="25" cy="25" r="8" fill="#FFB800" stroke="#5D1A1A" strokeWidth="2"/>
                  </svg>
                </div>
              ))}

              {/* Top ribbon label */}
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.4 }}
                className="absolute -top-8 left-1/2 -translate-x-1/2"
              >
                <div className="relative">
                  <div 
                    className="px-10 py-3 border-4 border-[#5D1A1A]"
                    style={{ backgroundColor: '#E91E63' }}
                  >
                    <span className="text-white font-black text-lg tracking-[0.5em]">PRESENTING</span>
                  </div>
                  {/* Ribbon tails */}
                  <div className="absolute -left-4 top-0 w-0 h-0 border-t-[24px] border-r-[16px] border-t-[#C2185B] border-r-transparent" />
                  <div className="absolute -right-4 top-0 w-0 h-0 border-t-[24px] border-l-[16px] border-t-[#C2185B] border-l-transparent" />
                </div>
              </motion.div>

              {/* Main Title with heavy drop shadow */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-center mt-6"
              >
                <h1
                  className="text-7xl md:text-[10rem] font-black tracking-tight leading-none"
                  style={{ 
                    color: '#5D1A1A',
                    textShadow: '8px 8px 0 #FFB800, 16px 16px 0 #E91E63, 24px 24px 0 #0066FF',
                    WebkitTextStroke: '3px #5D1A1A'
                  }}
                >
                  JECRC
                </h1>
              </motion.div>

              {/* Hindi subtitle */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="text-center text-2xl md:text-4xl font-bold mt-2"
                style={{ color: '#E91E63' }}
              >
               जयपुर इंजीनियरिंग कॉलेज एंड रिसर्च सेंटर
              </motion.p>

              {/* Decorative line with diamonds */}
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.8 }}
                className="flex items-center justify-center gap-3 mt-6"
              >
                <div className="h-3 w-20 md:w-32 bg-[#E91E63] border-3 border-[#5D1A1A]" style={{ borderWidth: '3px' }} />
                <div className="w-6 h-6 bg-[#FFB800] rotate-45 border-3 border-[#5D1A1A]" style={{ borderWidth: '3px' }} />
                <div className="h-3 w-20 md:w-32 bg-[#0066FF] border-3 border-[#5D1A1A]" style={{ borderWidth: '3px' }} />
                <div className="w-6 h-6 bg-[#E53935] rotate-45 border-3 border-[#5D1A1A]" style={{ borderWidth: '3px' }} />
                <div className="h-3 w-20 md:w-32 bg-[#E91E63] border-3 border-[#5D1A1A]" style={{ borderWidth: '3px' }} />
              </motion.div>

              {/* Full name banner */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
                className="mt-8 -mx-8 md:-mx-12 py-4 border-y-[6px] border-[#5D1A1A]"
                style={{ backgroundColor: '#0066FF' }}
              >
                <p className="text-center text-lg md:text-2xl font-black tracking-wider text-white">
                  JAIPUR ENGINEERING COLLEGE & RESEARCH CENTER
                </p>
              </motion.div>

              {/* Established badge */}
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: -5 }}
                transition={{ delay: 1.1, type: 'spring' }}
                className="absolute -bottom-10 -right-6 md:-right-10"
              >
                <div 
                  className="w-24 h-24 md:w-28 md:h-28 rounded-full border-[6px] border-[#5D1A1A] flex flex-col items-center justify-center"
                  style={{ backgroundColor: '#FFB800' }}
                >
                  <span className="text-xs font-black text-[#5D1A1A]">EST.</span>
                  <span className="text-2xl md:text-3xl font-black text-[#5D1A1A]">2000</span>
                  <Sparkles className="w-5 h-5 text-[#E91E63]" />
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* About Content - Magazine Cutout Style */}
          <div className="grid md:grid-cols-2 gap-8 mb-10 mt-16">
            {/* Left Card */}
            <motion.div
              initial={{ opacity: 0, x: -50, rotate: -5 }}
              animate={{ opacity: 1, x: 0, rotate: 0 }}
              transition={{ delay: 1.2, type: 'spring' }}
              className="relative"
            >
              <div className="absolute -inset-3 bg-[#0066FF]" style={{ transform: 'rotate(3deg)' }} />
              <div className="absolute -inset-3 bg-[#E91E63]" style={{ transform: 'rotate(1.5deg)' }} />
              <div 
                className="relative p-6 md:p-8 border-[8px] border-[#5D1A1A]"
                style={{ backgroundColor: '#FFF8E7' }}
              >
                {/* Label badge */}
                <div className="absolute -top-6 left-6">
                  <div 
                    className="px-6 py-2 border-4 border-[#5D1A1A]"
                    style={{ backgroundColor: '#FFB800', boxShadow: '3px 3px 0 #5D1A1A' }}
                  >
                    <span className="text-sm font-black tracking-wider text-[#5D1A1A]">ABOUT US</span>
                  </div>
                </div>

                {/* Decorative corner */}
                <div className="absolute top-4 right-4">
                  <Zap className="w-8 h-8 text-[#E91E63]" fill="#E91E63" />
                </div>
                
                <p className="text-[#5D1A1A] leading-relaxed mt-6 text-lg md:text-xl">
                  <span 
                    className="text-4xl md:text-5xl font-black"
                    style={{ color: '#E91E63', textShadow: '3px 3px 0 #FFB800' }}
                  >
                    JECRC
                  </span>{" "}
                  stands as a beacon of{" "}
                  <span className="inline-block px-2 py-1 bg-[#FFB800] font-black border-3 border-[#5D1A1A] -rotate-1" style={{ borderWidth: '3px' }}>
                    academic excellence
                  </span>,{" "}
                  <span className="inline-block px-2 py-1 bg-[#0066FF] text-white font-black border-3 border-[#5D1A1A] rotate-1" style={{ borderWidth: '3px' }}>
                    innovation
                  </span>, and{" "}
                  <span className="inline-block px-2 py-1 bg-[#E53935] text-white font-black border-3 border-[#5D1A1A] -rotate-2" style={{ borderWidth: '3px' }}>
                    holistic development
                  </span>.
                </p>
                <p className="text-[#5D1A1A] leading-relaxed mt-4 text-base md:text-lg font-medium">
                  With a legacy spanning over{" "}
                  <span className="text-3xl font-black text-[#E91E63]">TWO DECADES</span>, 
                  we have established ourselves as one of {"Rajasthan's"} premier institutions!
                </p>

                {/* Bottom decoration */}
                <div className="flex gap-2 mt-6">
                  {[...Array(8)].map((_, i) => (
                    <div 
                      key={i} 
                      className="w-4 h-4 rotate-45 border-2 border-[#5D1A1A]" 
                      style={{ backgroundColor: i % 2 === 0 ? '#E91E63' : '#FFB800' }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Right Card */}
            <motion.div
              initial={{ opacity: 0, x: 50, rotate: 5 }}
              animate={{ opacity: 1, x: 0, rotate: 0 }}
              transition={{ delay: 1.3, type: 'spring' }}
              className="relative"
            >
              <div className="absolute -inset-3 bg-[#E53935]" style={{ transform: 'rotate(-3deg)' }} />
              <div className="absolute -inset-3 bg-[#0066FF]" style={{ transform: 'rotate(-1.5deg)' }} />
              <div 
                className="relative p-6 md:p-8 border-[8px] border-[#5D1A1A]"
                style={{ backgroundColor: '#FFB800' }}
              >
                {/* Label badge */}
                <div className="absolute -top-6 right-6">
                  <div 
                    className="px-6 py-2 border-4 border-[#5D1A1A]"
                    style={{ backgroundColor: '#E91E63', boxShadow: '3px 3px 0 #5D1A1A' }}
                  >
                    <span className="text-sm font-black tracking-wider text-white">OUR VIBE</span>
                  </div>
                </div>

                {/* Decorative corner */}
                <div className="absolute top-4 left-4">
                  <Star className="w-8 h-8 text-[#E53935]" fill="#E53935" />
                </div>
                
                <p className="text-[#5D1A1A] leading-relaxed mt-6 text-lg md:text-xl font-semibold">
                  Our{" "}
                  <span 
                    className="text-3xl font-black"
                    style={{ textShadow: '2px 2px 0 #FFF8E7' }}
                  >
                    VIBRANT COMMUNITY
                  </span>{" "}
                  extends education beyond classrooms, fostering{" "}
                  <span className="inline-block px-2 py-1 bg-[#FFF8E7] font-black border-3 border-[#5D1A1A] rotate-1" style={{ borderWidth: '3px' }}>
                    creativity
                  </span>,{" "}
                  <span className="inline-block px-2 py-1 bg-[#E91E63] text-white font-black border-3 border-[#5D1A1A] -rotate-1" style={{ borderWidth: '3px' }}>
                    research
                  </span>, and{" "}
                  <span className="inline-block px-2 py-1 bg-[#0066FF] text-white font-black border-3 border-[#5D1A1A] rotate-2" style={{ borderWidth: '3px' }}>
                    industry-driven learning
                  </span>.
                </p>
                <p className="text-[#5D1A1A] leading-relaxed mt-4 text-base md:text-lg">
                  We continuously evolve to meet the{" "}
                  <span className="text-2xl font-black text-[#E53935]">DYNAMIC DEMANDS</span>{" "}
                  of the modern world!
                </p>

                {/* Bottom decoration */}
                <div className="flex gap-2 mt-6">
                  {[...Array(8)].map((_, i) => (
                    <div 
                      key={i} 
                      className="w-4 h-4 rotate-45 border-2 border-[#5D1A1A]" 
                      style={{ backgroundColor: i % 2 === 0 ? '#0066FF' : '#E53935' }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Mission Quote - Ticket/Stamp Style */}
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 1.4, type: 'spring' }}
            className="relative mb-12 mx-auto max-w-4xl"
          >
            <div className="absolute -inset-3 bg-[#0066FF]" style={{ transform: 'rotate(1deg)' }} />
            <div className="absolute -inset-3 bg-[#E53935]" style={{ transform: 'rotate(-1deg)' }} />
            <div 
              className="relative p-8 md:p-10 border-[8px] border-[#5D1A1A]"
              style={{ 
                backgroundColor: '#FFF8E7',
                borderStyle: 'dashed',
              }}
            >
              {/* Mission stamp */}
              <div className="absolute -top-8 left-1/2 -translate-x-1/2">
                <div 
                  className="px-10 py-3 border-4 border-[#5D1A1A] rotate-[-3deg]"
                  style={{ backgroundColor: '#E53935', boxShadow: '4px 4px 0 #5D1A1A' }}
                >
                  <span className="text-xl font-black tracking-[0.4em] text-white">MISSION</span>
                </div>
              </div>
              
              <p 
                className="text-center text-xl md:text-3xl font-bold mt-6 leading-relaxed"
                style={{ color: '#5D1A1A' }}
              >
                <span className="text-[#E91E63]">{"\""}</span>
                A place where{" "}
                <span className="bg-[#FFB800] px-2 border-2 border-[#5D1A1A]">aspirations</span>{" "}
                turn into{" "}
                <span className="bg-[#E91E63] text-white px-2 border-2 border-[#5D1A1A]">achievements</span>{" "}
                and students transform into{" "}
                <span className="bg-[#0066FF] text-white px-2 border-2 border-[#5D1A1A]">professionals</span>{" "}
                equipped to lead the future.
                <span className="text-[#E91E63]">{"\""}</span>
              </p>
              
              {/* Star rating */}
              <div className="flex justify-center gap-3 mt-8">
                {[...Array(5)].map((_, i) => (
                  <motion.div 
                    key={i}
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 1.6 + i * 0.1 }}
                    className="w-10 h-10 border-3 border-[#5D1A1A] flex items-center justify-center"
                    style={{ backgroundColor: '#FFB800', borderWidth: '3px' }}
                  >
                    <Star className="w-6 h-6 text-[#E53935]" fill="#E53935" />
                  </motion.div>
                ))}
              </div>

              {/* Side decorations */}
              <div className="absolute left-4 top-1/2 -translate-y-1/2 hidden md:flex flex-col gap-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="w-3 h-3 rounded-full bg-[#E91E63] border-2 border-[#5D1A1A]" />
                ))}
              </div>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 hidden md:flex flex-col gap-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="w-3 h-3 rounded-full bg-[#0066FF] border-2 border-[#5D1A1A]" />
                ))}
              </div>
            </div>
          </motion.div>

          {/* Feature Cards - Bold Pop Art Grid */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12"
          >
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, scale: 0.5, rotate: index % 2 === 0 ? -15 : 15, y: 50 }}
                animate={{ opacity: 1, scale: 1, rotate: 0, y: 0 }}
                transition={{ delay: 1.6 + index * 0.15, type: 'spring', stiffness: 200, damping: 15 }}
                whileHover={{ 
                  scale: 1.15, 
                  rotate: 0, 
                  zIndex: 50,
                  y: -10,
                  transition: { type: 'spring', stiffness: 400, damping: 10 }
                }}
                whileTap={{ scale: 0.95 }}
                className="relative cursor-pointer group"
              >
                {/* Multiple stacked shadow layers for depth */}
                <motion.div 
                  className="absolute inset-0 rounded-lg"
                  style={{ backgroundColor: '#1a1a2e', transform: 'translate(12px, 12px)' }}
                  whileHover={{ transform: 'translate(16px, 16px)' }}
                />
                <motion.div 
                  className="absolute inset-0 rounded-lg"
                  style={{ backgroundColor: '#5D1A1A', transform: 'translate(8px, 8px)' }}
                  whileHover={{ transform: 'translate(12px, 12px)' }}
                />
                <motion.div 
                  className="absolute inset-0 rounded-lg"
                  style={{ backgroundColor: index % 2 === 0 ? '#FFB800' : '#E91E63', transform: 'translate(4px, 4px)' }}
                  whileHover={{ transform: 'translate(6px, 6px)' }}
                />
                
                <motion.div 
                  className="relative p-5 md:p-6 border-[6px] border-[#5D1A1A] rounded-lg overflow-hidden"
                  style={{ backgroundColor: feature.bgColor }}
                >
                  {/* Animated background pattern on hover */}
                  <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-300"
                    style={{
                      backgroundImage: `radial-gradient(circle, ${feature.dark ? '#5D1A1A' : '#ffffff'} 2px, transparent 2px)`,
                      backgroundSize: '12px 12px'
                    }}
                  />

                  {/* Icon with pop animation */}
                  <motion.div 
                    className="mb-4 relative"
                    whileHover={{ scale: 1.2, rotate: [0, -10, 10, 0] }}
                    transition={{ duration: 0.4 }}
                  >
                    {/* Icon glow effect */}
                    <div 
                      className="absolute inset-0 blur-lg opacity-0 group-hover:opacity-60 transition-opacity"
                      style={{ backgroundColor: feature.dark ? '#E91E63' : '#FFB800' }}
                    />
                    <feature.icon 
                      className={`relative w-14 h-14 md:w-16 md:h-16 ${feature.dark ? 'text-[#5D1A1A]' : 'text-white'} drop-shadow-lg`} 
                      strokeWidth={2.5} 
                    />
                  </motion.div>

                  {/* Hindi title with slide-in effect */}
                  <motion.p 
                    className={`text-sm font-bold mb-1 ${feature.dark ? 'text-[#5D1A1A]' : 'text-white/90'}`}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 1.8 + index * 0.15 }}
                  >
                    {feature.titleHindi}
                  </motion.p>

                  {/* English title - 3D text effect */}
                  <h3 
                    className={`text-xl md:text-2xl font-black mb-2 ${feature.dark ? 'text-[#5D1A1A]' : 'text-white'} group-hover:tracking-wide transition-all`}
                    style={{ 
                      textShadow: feature.dark 
                        ? '2px 2px 0 #FFB800, 4px 4px 0 #E91E63' 
                        : '2px 2px 0 rgba(0,0,0,0.3), 4px 4px 0 rgba(0,0,0,0.2)'
                    }}
                  >
                    {feature.title}
                  </h3>
                  
                  {/* Description */}
                  <p className={`text-xs md:text-sm font-semibold leading-relaxed ${feature.dark ? 'text-[#5D1A1A]/80' : 'text-white/90'}`}>
                    {feature.description}
                  </p>
                  
                  {/* Corner decoration - animated */}
                  <motion.div 
                    className="absolute -top-4 -right-4 w-10 h-10 border-4 border-[#5D1A1A]"
                    style={{ backgroundColor: feature.dark ? '#E91E63' : '#FFB800' }}
                    animate={{ rotate: [0, 10, 0] }}
                    whileHover={{ rotate: 180, scale: 1.2 }}
                    transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }}
                  />

                  {/* Bottom corner star */}
                  <motion.div 
                    className="absolute -bottom-3 -left-3 w-8 h-8 flex items-center justify-center"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                  >
                    <Sparkles className={`w-6 h-6 ${feature.dark ? 'text-[#0066FF]' : 'text-white'}`} fill="currentColor" />
                  </motion.div>

                  {/* Sound burst effect on hover - like the megaphone in reference */}
                  <div className="absolute top-1/2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {[...Array(3)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute w-4 h-1 rounded-full"
                        style={{ 
                          backgroundColor: feature.dark ? '#FFB800' : '#ffffff',
                          top: `${(i - 1) * 8}px`,
                          right: `${i * 4}px`
                        }}
                        initial={{ scaleX: 0, opacity: 0 }}
                        whileInView={{ scaleX: 1, opacity: 1 }}
                        transition={{ delay: i * 0.1 }}
                      />
                    ))}
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </motion.div>

          {/* Renaissance Event Section */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.8 }}
            className="mt-16 mb-12"
          >
            <div className="relative">
              <div className="absolute -inset-4 bg-[#E91E63]" style={{ transform: 'rotate(2deg)' }} />
              <div className="absolute -inset-4 bg-[#0066FF]" style={{ transform: 'rotate(-2deg)' }} />
              
              <div className="relative p-8 md:p-12 border-[10px] border-[#5D1A1A]" style={{ backgroundColor: '#FFF8E7' }}>
                {/* Top label */}
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 1.9 }}
                  className="absolute -top-8 left-1/2 -translate-x-1/2"
                >
                  <div className="relative">
                    <div 
                      className="px-10 py-3 border-4 border-[#5D1A1A]"
                      style={{ backgroundColor: '#E91E63' }}
                    >
                      <span className="text-white font-black text-lg tracking-[0.3em]">RENAISSANCE</span>
                    </div>
                  </div>
                </motion.div>

                <h2 className="text-5xl md:text-6xl font-black mt-6 mb-6" style={{ color: '#5D1A1A', textShadow: '4px 4px 0 #FFB800' }}>
                  The Annual Tech-Cultural Fest ✨
                </h2>

                <div className="space-y-4 text-[#5D1A1A] text-base md:text-lg leading-relaxed">
                  <p>
                    <span className="inline-block px-2 py-1 bg-[#FFB800] font-black border-3 border-[#5D1A1A] -rotate-1" style={{ borderWidth: '3px' }}>
                      Renaissance
                    </span>
                    {" "}is the prestigious Annual Techno-Cultural Youth Fest of Jaipur Engineering College & Research Center (JECRC), one of the{" "}
                    <span className="inline-block px-2 py-1 bg-[#0066FF] text-white font-black border-3 border-[#5D1A1A] rotate-1" style={{ borderWidth: '3px' }}>
                      largest college festivals
                    </span>
                    {" "}in Rajasthan, spanning three exhilarating days each year.
                  </p>

                  <p>
                    As a nationally recognized platform, it showcases exceptional talent in{" "}
                    <span className="inline-block px-2 py-1 bg-[#E91E63] text-white font-black border-3 border-[#5D1A1A] -rotate-1" style={{ borderWidth: '3px' }}>
                      music, dance, drama
                    </span>,{" "}
                    <span className="inline-block px-2 py-1 bg-[#E53935] text-white font-black border-3 border-[#5D1A1A] rotate-1" style={{ borderWidth: '3px' }}>
                      coding & competitions
                    </span>, fostering creativity and innovation among students.
                  </p>

                  <p className="font-semibold">
                    📅 <span className="text-2xl font-black text-[#E91E63]">2026 DATES:</span> 23-25 February
                  </p>
                </div>

                {/* Bottom decoration */}
                <div className="flex gap-2 mt-8 flex-wrap">
                  {[...Array(12)].map((_, i) => (
                    <motion.div 
                      key={i}
                      initial={{ scale: 0, rotate: -90 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: 2.0 + i * 0.05 }}
                      className="w-5 h-5 rotate-45 border-3 border-[#5D1A1A]" 
                      style={{ backgroundColor: i % 3 === 0 ? '#E91E63' : i % 3 === 1 ? '#FFB800' : '#0066FF' }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Renaissance Highlights Grid */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.1 }}
            className="grid md:grid-cols-2 gap-8 mb-12"
          >
            {/* Highlights Card 1 */}
            <motion.div
              initial={{ opacity: 0, x: -50, rotate: -5 }}
              animate={{ opacity: 1, x: 0, rotate: 0 }}
              transition={{ delay: 2.2, type: 'spring' }}
              className="relative"
            >
              <div className="absolute -inset-3 bg-[#0066FF]" style={{ transform: 'rotate(3deg)' }} />
              <div className="absolute -inset-3 bg-[#FFB800]" style={{ transform: 'rotate(1.5deg)' }} />
              <div 
                className="relative p-6 md:p-8 border-[8px] border-[#5D1A1A]"
                style={{ backgroundColor: '#FFF8E7' }}
              >
                <div className="absolute -top-6 left-6">
                  <div 
                    className="px-6 py-2 border-4 border-[#5D1A1A]"
                    style={{ backgroundColor: '#E91E63', boxShadow: '3px 3px 0 #5D1A1A' }}
                  >
                    <span className="text-sm font-black tracking-wider text-white">EVENT STATS</span>
                  </div>
                </div>

                <h3 className="text-2xl md:text-3xl font-black mb-6 mt-4" style={{ color: '#E91E63', textShadow: '2px 2px 0 #FFB800' }}>
                  📊 By The Numbers
                </h3>

                <div className="space-y-3">
                  {[
                    { stat: '3', label: 'Days of Non-Stop Fun' },
                    { stat: '25+', label: 'Competitions & Events' },
                    { stat: '5000+', label: 'Expected Participants' },
                    { stat: '50L+', label: 'Prize Pool' },
                    { stat: '50+', label: 'Colleges Participating' },
                  ].map((item, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 2.3 + idx * 0.08 }}
                      className="flex items-center justify-between p-3 border-b-3 border-[#5D1A1A]"
                    >
                      <span className="text-2xl font-black" style={{ color: '#0066FF' }}>{item.stat}</span>
                      <span className="font-bold text-[#5D1A1A]">{item.label}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Highlights Card 2 */}
            <motion.div
              initial={{ opacity: 0, x: 50, rotate: 5 }}
              animate={{ opacity: 1, x: 0, rotate: 2 }}
              transition={{ delay: 2.3, type: 'spring' }}
              className="relative"
            >
              <div className="absolute -inset-3 bg-[#E53935]" style={{ transform: 'rotate(-3deg)' }} />
              <div className="absolute -inset-3 bg-[#E91E63]" style={{ transform: 'rotate(-1.5deg)' }} />
              <div 
                className="relative p-6 md:p-8 border-[8px] border-[#5D1A1A]"
                style={{ backgroundColor: '#FFB800' }}
              >
                <div className="absolute -top-6 right-6">
                  <div 
                    className="px-6 py-2 border-4 border-[#5D1A1A]"
                    style={{ backgroundColor: '#0066FF', boxShadow: '3px 3px 0 #5D1A1A' }}
                  >
                    <span className="text-sm font-black tracking-wider text-white">CATEGORIES</span>
                  </div>
                </div>

                <h3 className="text-2xl md:text-3xl font-black mb-6 mt-4" style={{ color: '#5D1A1A', textShadow: '2px 2px 0 #FFF8E7' }}>
                  🎭 What to Expect
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { emoji: '🎵', name: 'Music Fest' },
                    { emoji: '💃', name: 'Dance Battles' },
                    { emoji: '🎬', name: 'Drama Night' },
                    { emoji: '💻', name: 'Hackathons' },
                    { emoji: '🎨', name: 'Art Shows' },
                    { emoji: '⚡', name: 'Tech Events' },
                    { emoji: '🏆', name: 'Competitions' },
                    { emoji: '🎤', name: 'Celebrity Act' },
                  ].map((cat, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, scale: 0.3, rotate: -45 }}
                      animate={{ opacity: 1, scale: 1, rotate: 0 }}
                      transition={{ delay: 2.4 + idx * 0.08 }}
                      className="p-3 border-4 border-[#5D1A1A] text-center rounded-lg"
                      style={{ backgroundColor: '#5D1A1A', opacity: 0.9 }}
                    >
                      <div className="text-2xl">{cat.emoji}</div>
                      <div className="text-xs font-black text-white mt-1">{cat.name}</div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Register CTA */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 2.5 }}
            className="mb-12 text-center"
          >
            <div className="relative inline-block">
              <div className="absolute -inset-4 bg-[#E91E63]" style={{ transform: 'rotate(3deg)' }} />
              <div className="absolute -inset-4 bg-[#0066FF]" style={{ transform: 'rotate(-3deg)' }} />
              <Link to="/login" className="no-underline">
              <motion.button
                // onClick={() => navigate('/login')}
                whileHover={{ scale: 1.12, rotate: 2 }}
                whileTap={{ scale: 0.95 }}
                className="relative px-12 py-4 border-[8px] border-[#5D1A1A] text-2xl md:text-3xl font-black tracking-wider cursor-pointer rounded-lg"
                style={{ backgroundColor: '#FFB800', color: '#5D1A1A', boxShadow: '8px 8px 0 #5D1A1A' }}
              >
                🚀 REGISTER NOW! 🚀
              </motion.button>
              </Link>
            </div>
          </motion.div>

          {/* Color palette footer */}
          <div className="flex justify-center gap-2 md:gap-4 mt-12 flex-wrap pb-8">
            {[
              { bg: '#E91E63', label: 'PINK' },
              { bg: '#FFB800', label: 'HALDI' },
              { bg: '#0066FF', label: 'BLUE' },
              { bg: '#E53935', label: 'LAL' },
              { bg: '#5D1A1A', label: 'MAROON' },
              { bg: '#FF6B35', label: 'ORANGE' },
              { bg: '#00D4FF', label: 'CYAN' },
              { bg: '#00FF88', label: 'GREEN' },
              { bg: '#FFD60A', label: 'GOLD' },
              { bg: '#FF1654', label: 'CRIMSON' },
              { bg: '#4D96FF', label: 'SKY' },
              { bg: '#8338EC', label: 'PURPLE' },
            ].map((swatch, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20, rotate: -10 }}
                animate={{ opacity: 1, y: 0, rotate: (i - 5) * 6 }}
                transition={{ delay: 2.6 + i * 0.08 }}
                className="flex flex-col items-center"
              >
                <div 
                  className="w-8 h-8 md:w-10 md:h-10 border-4 border-[#5D1A1A] cursor-pointer transform hover:scale-110 transition-transform"
                  style={{ backgroundColor: swatch.bg }}
                />
                <span className="text-[7px] md:text-[9px] font-black text-[#5D1A1A] mt-1 text-center">{swatch.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </main>
    </div>
  ) 
}