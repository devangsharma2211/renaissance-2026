import React, { useState, useEffect, useRef } from "react";
import { lazy, Suspense } from "react";
import { Modal } from "./Modals.jsx";
import { 
  Box, Atom, Search, Blocks, Rocket, Clock, Navigation, Bot, Glasses, 
  Megaphone, Paintbrush, Car, Radar, Power, Cpu, Move, Puzzle, Recycle, 
  ChefHat, MicVocal, Drum, Speaker, Guitar, Drama, Sparkles, Gem, 
  ScrollText, Handshake, BicepsFlexed, Film, PackageSearch, Volleyball, 
  Medal, Crown, MoveHorizontal, FlagTriangleRight, Trophy, RotateCcw, 
  Zap, Code, Brain 
} from "lucide-react";
import ScrollDownIndicator from "./ScrollDownIndicator.jsx";
import "./PrismaticBurst.css";
import { getAsset } from "../../config";
const TiltCard = lazy(() => import("./tiltcard"));

export default function Events() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [selectedCard, setSelectedCard] = useState(null);
  const [cards, setCards] = useState([]);
  const [hoveredCardRect, setHoveredCardRect] = useState(null);
  const [activeFilter, setActiveFilter] = useState(null); // Set a default filter
  const [activeDay, setActiveDay] = useState(null);       // Set a default day
  const [hoveredCardIndex, setHoveredCardIndex] = useState(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const [priceFilter, setPriceFilter] = useState("all"); // Options: 'all', 'paid', 'free'
  const [showTokenCard, setShowTokenCard] = useState(true);
  const tokenTimerRef = useRef(null);
  
  // Use local events.js as requested
  // const [cards] = useState(events);


  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch("https://ren-old.onrender.com/api/events/list", {
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) {
          throw new Error(`Failed to fetch events.json (${res.status})`);
        }

        const data = await res.json();

        // SAFETY CHECK (same as old file logic)
        if (Array.isArray(data)) {
          setCards(data);
        } else {
          console.error("events.json is not an array:", data);
          setCards([]);
        }
      } catch (error) {
        console.error("Failed to fetch events.json:", error);
        setCards([]); // prevent UI crash
      }
    };

    fetchEvents();
  }, []);

  useEffect(() => {
    setShowTokenCard(true);
    tokenTimerRef.current = setTimeout(() => {
      setShowTokenCard(false);
    }, 10000);
    return () => {
      if (tokenTimerRef.current) {
        clearTimeout(tokenTimerRef.current);
      }
    };
  }, []);


  // General Mouse Tracking
  useEffect(() => {
    let timeoutId;
    const handleMouseMove = (e) => {
      if (!timeoutId) {
        timeoutId = setTimeout(() => {
          setMousePosition({ x: e.clientX, y: e.clientY });
          timeoutId = null;
        }, 16); // Throttled to ~60fps
      }
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      clearTimeout(timeoutId);
    };
  }, []);

  // Hide torch while scrolling
  useEffect(() => {
    let scrollTimer;
    const onScroll = () => {
      setIsScrolling(true);
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => setIsScrolling(false), 150);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      clearTimeout(scrollTimer);
    };
  }, []);

  // Particle cleanup (from your updated frontend logic)
  useEffect(() => {
    const particlesElement = document.querySelector('div.fixed.inset-0.bg-black');
    if (particlesElement) particlesElement.style.display = 'none';
    return () => {
      if (particlesElement) particlesElement.style.display = '';
    };
  }, []);

  const iconMap = {
    MicVocal, ChefHat, Drum, Clock, Blocks, Car, Search, Navigation, 
    Speaker, Guitar, Rocket, Drama, Sparkles, Gem, Cpu, Atom, Power, 
    Glasses, ScrollText, Handshake, BicepsFlexed, Film, Bot, 
    PackageSearch, Volleyball, Medal, Move, Crown, Megaphone, 
    Paintbrush, MoveHorizontal, FlagTriangleRight, Trophy, RotateCcw, 
    Code, Zap, Brain, Box, Radar, Puzzle, Recycle
  };

  const normalizeCategory = (cat) => {
    const c = (cat || "").toLowerCase().trim();
    return c === "culture" ? "cultural" : c;
  };

const filteredCards = Array.isArray(cards)
    ? cards.filter((card) => {
        // 1. Day Check
        const cardDayStr = card.day?.toString().includes("day") 
          ? card.day 
          : `day${card.day}`;
        const matchesDay = !activeDay || cardDayStr === activeDay;

        // 2. Category Check
        const category = normalizeCategory(card.category);
        const matchesCategory = !activeFilter || category === activeFilter;

        // 3. Price Check (Updated logic)
        const isPaid =
          typeof card.isPaid === "boolean"
            ? card.isPaid
            : typeof card.Paid === "boolean"
            ? card.Paid
            : false;

        let matchesPrice = true;
        if (priceFilter === "free") matchesPrice = !isPaid;
        else if (priceFilter === "paid") matchesPrice = isPaid;

        return matchesDay && matchesCategory && matchesPrice;
      })
    : [];

  const handleCardHover = (index, rect) => {
    setHoveredCardIndex(index);
    setHoveredCardRect(rect);
  };

  const handleCardLeave = () => {
    setHoveredCardIndex(null);
    setHoveredCardRect(null);
  };

  const handleCloseTokenCard = () => {
    setShowTokenCard(false);
    if (tokenTimerRef.current) {
      clearTimeout(tokenTimerRef.current);
      tokenTimerRef.current = null;
    }
  };

  const LoadingCards = () => (
    <div className="flex flex-wrap justify-center gap-10">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="h-96 w-72 rounded-xl bg-white/10 border border-white/10 shadow-xl animate-pulse"
        >
          <div className="h-full w-full rounded-xl bg-gradient-to-b from-white/5 via-white/10 to-white/5" />
        </div>
      ))}
    </div>
  );

  const selectedPaid =
    typeof selectedCard?.isPaid === "boolean"
      ? selectedCard.isPaid
      : typeof selectedCard?.Paid === "boolean"
      ? selectedCard.Paid
      : undefined;

  return (
    <div 
      className="min-h-screen w-full py-20 px-4 relative overflow-hidden"
      style={{
      backgroundImage: `url(${getAsset("/teams/bg.webp")})`, // Replace with your image path
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed' // Keeps the background static while scrolling
      }}
    >
      <div className="prismatic-burst"></div>

      {showTokenCard && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={handleCloseTokenCard}
          />
          <div className="relative z-[121] w-full max-w-md rounded-2xl border border-yellow-400/30 bg-gradient-to-br from-orange-900/70 via-slate-900/95 to-slate-900/95 p-5 shadow-2xl">
            <button
              onClick={handleCloseTokenCard}
              className="absolute right-3 top-2 text-yellow-200/80 hover:text-yellow-100"
              aria-label="Close"
            >
              ×
            </button>
            <div className="font-bold text-sm sm:text-base text-center">
              <div className="text-yellow-300 tracking-wide">TOKEN BASED REGISTRATIONS ARE CLOSED</div>
              <ul className="mt-3 list-disc pl-5 text-left text-white/90">
                {/* <li>1 free technical event</li>
                <li>1 free splash event</li>
                <li>1 BGMI Event</li> */}
                <h3>All events can only be registered offline to respective POC, by paying the registration fee.</h3>
                {/* <li className="text-white/60 text-sm pt-1 list-none -ml-5"> */}
              </ul>
            </div>
          </div>
        </div>
      )}
      
      {/* Background Section
      <div className="relative w-full h-screen z-10">
        <img 
          src={getAsset("/teams/bg.webp")}
          alt="Itinerary Heading"
          className="relative w-full h-full object-contain"
        />
        <ScrollDownIndicator />
      </div> */}

      {/* --- START UPDATED ANIMATION LOGIC (Torch & Beams) --- */}
      {hoveredCardRect && !isScrolling && (
        <div className="fixed pointer-events-none z-40" style={{ top: 0, left: 0, width: '100vw', height: '100vh' }}>
          <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
            <defs>
              {/* Main Soft Beam */}
              <linearGradient id="beamGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="rgba(255, 214, 100, 0.7)" />
                <stop offset="100%" stopColor="rgba(255, 100, 0, 0)" />
              </linearGradient>
              {/* Core Sharp Beam */}
              <linearGradient id="coreGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="rgba(255, 255, 255, 0.4)" />
                <stop offset="80%" stopColor="rgba(255, 255, 255, 0)" />
              </linearGradient>
            </defs>
            {(() => {
              const torchX = window.innerWidth / 2;
              const { left, right, top } = hoveredCardRect;

              return (
                <g className="animate-pulse" style={{ animationDuration: '2s' }}>
                  {/* Outer Glow Beam */}
                  <polygon
                    points={`${torchX - 15},0 ${torchX + 15},0 ${right + 10},${top} ${left - 10},${top}`}
                    fill="url(#beamGradient)"
                    filter="blur(8px)"
                  />
                  {/* Inner Core Beam */}
                  <polygon
                    points={`${torchX - 5},0 ${torchX + 5},0 ${right - 20},${top} ${left + 20},${top}`}
                    fill="url(#coreGradient)"
                    filter="blur(2px)"
                  />
                </g>
              );
            })()}
          </svg>
        </div>
      )}
      {/* --- END UPDATED ANIMATION LOGIC --- */}

      <div className="mx-auto max-w-6xl z-10 relative">
        {/* Filter UI */}
        <div className="grid grid-cols-2 gap-4 mb-8 sm:mb-4 md:flex md:flex-row md:justify-center md:gap-4">
          {["all", "technical", "splash", "cultural"].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveFilter(cat === "all" ? null : cat)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                (activeFilter === cat || (!activeFilter && cat === "all")) 
                ? "bg-yellow-400 text-black" : "bg-orange-700 text-yellow-400"
              }`}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
          {/* <div className="relative group">
  <select
    value={priceFilter}
    onChange={(e) => setPriceFilter(e.target.value)}
    className="appearance-none px-5 py-2 pr-10 rounded-xl 
               bg-blue-900/30 backdrop-blur-md border border-blue-400/30 
               text-yellow-400 font-bold tracking-wide shadow-lg
               outline-none cursor-pointer transition-all duration-300
               hover:bg-blue-800/40 hover:border-blue-300/50 hover:shadow-blue-500/20"
  >
    <option value="all" className="bg-slate-900 text-yellow-400">All Events</option>
    <option value="paid" className="bg-slate-900 text-yellow-400">Paid Events</option>
    <option value="free" className="bg-slate-900 text-yellow-400">Free Events</option>
  </select>
  
  <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-yellow-400 text-xs transition-transform group-hover:scale-110">
    ▼
  </span>
</div> */}
        </div>

        {/* Day UI */}
        <div className="sticky top-0 mb-8 z-20">
          <div className="flex justify-center gap-4 py-2 bg-transparent">
            {/* Added All Days Button */}
            <button
              onClick={() => setActiveDay(null)}
              className={`px-4 py-2 rounded-lg ${!activeDay ? "bg-yellow-400 text-black" : "bg-orange-700 text-yellow-400"}`}
            >
              All Days
            </button>

            {["day1", "day2", "day3"].map((day) => (
              <button
                key={day}
                onClick={() => setActiveDay(day)}
                className={`px-4 py-2 rounded-lg ${activeDay === day ? "bg-yellow-400 text-black" : "bg-orange-700 text-yellow-400"}`}
              >
                Day {day.slice(-1)}
              </button>
            ))}
          </div>


        {/* 2. Minimalist Filter Dropdown (Rightmost on Mobile AND Desktop) */}
    {/* Added 'w-full flex justify-end' to force right alignment on mobile */}
    <div className=" mt-4 w-full flex justify-end md:w-auto md:mt-3 md:absolute right-0 md:right-[7vw] z-30">
      <div className="relative inline-block">
        <select
          value={priceFilter}
          onChange={(e) => setPriceFilter(e.target.value)}
          className="appearance-none pl-3 pr-5 py-1.5 rounded-full 
                     bg-transparent text-black font-semibold text-xs md:text-sm
                     border border-gray-300 shadow-sm
                     cursor-pointer outline-none transition-all
                     hover:bg-gray-100 focus:ring-2 focus:ring-yellow-400"
        >
          <option value="all">All Events</option>
          <option value="paid">Paid Events</option>
          <option value="free">Free Events</option>
        </select>
        
        {/* Tiny Chevron Icon (Black) */}
        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-black/60 text-[10px]">
          ▼
        </span>
      </div>
    </div>


        </div>

        {/* Cards Grid */}
        <Suspense fallback={<LoadingCards />}>
          <div className="md:mt-20 flex flex-wrap justify-center gap-10">
            {filteredCards.length === 0 ? (
  /* --- 1. The Empty State (No Free Events) --- */
  <div className="flex h-[50vh] w-full items-center justify-center">
    <h2 className="text-3xl opacity-[40%] text-black uppercase tracking-widest md:text-5xl">
      No Free Events
    </h2>
  </div>
) : (
  /* --- 2. The Existing Card Grid --- */
  <div className="flex flex-wrap justify-center gap-10">
    {filteredCards.map((card, index) => {
      const IconComponent = iconMap[card.icon];
      return (
        <TiltCard
          key={index}
          index={index}
          {...card}
          icon={IconComponent ? <IconComponent className={card.iconColor} /> : null}
          mouseX={mousePosition.x}
          mouseY={mousePosition.y}
          onClick={() => setSelectedCard(card)}
          isHovered={hoveredCardIndex === index}
          onHover={(rect) => handleCardHover(index, rect)}
          onLeave={handleCardLeave}
          anyCardHovered={hoveredCardIndex !== null}
        />
      );
    })}
  </div>
)}
          </div>
        </Suspense>
      </div>


      <Modal
    isOpen={selectedCard !== null}
    onClose={() => setSelectedCard(null)}
    title={selectedCard?.title ?? ""}
    description={selectedCard?.description ?? ""}
    image={selectedCard?.image ?? ""}
    actionLabel={selectedCard?.actionLabel ?? ""}
    eventID={selectedCard?._id ?? ""}
    category={selectedCard?.category ?? ""}
    isPaid={selectedPaid}
    onAction={() => {
      selectedCard?.onAction();
      setSelectedCard(null);
    }}
  />
  <style>{`
    @keyframes torchFlicker {
      0% { transform: scaleY(1) scaleX(1); opacity: 1; }
      100% { transform: scaleY(1.15) scaleX(0.92); opacity: 0.92; }
    }
  `}</style>
    </div>
  );
}