import React, { useState, useEffect, useRef, useCallback } from "react";
import { ChevronDown, Loader2Icon } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** --- UTILS --- **/
function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/** --- HOOKS --- **/
function useScrollAnimation(speed = 1) {
  const ref = useRef(null);
  const [progress, setProgress] = useState(0.5);
  const [isInView, setIsInView] = useState(false);
  const [offset, setOffset] = useState(0);

  const updateProgress = useCallback(() => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const elementCenter = rect.top + rect.height / 2;
    const viewportProgress = 1 - elementCenter / windowHeight;
    const clampedProgress = Math.max(0, Math.min(1, viewportProgress));
    const calculatedOffset = (clampedProgress - 0.5) * 100 * speed;

    setProgress(clampedProgress);
    setOffset(calculatedOffset);
    setIsInView(rect.bottom > 0 && rect.top < windowHeight);
  }, [speed]);

  useEffect(() => {
    updateProgress();
    const handleScroll = () => requestAnimationFrame(updateProgress);
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [updateProgress]);

  return { ref, progress, isInView, offset };
}

/** --- COMPONENTS --- **/

// Digital Clock Component
export  function DigitalClock() {
  const [time, setTime] = useState(null);
  useEffect(() => {
    setTime(new Date());
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!time) return <div className="font-mono text-2xl opacity-50">--:--:--</div>;

  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const targetDate = new Date("2026-02-03T14:30:00").getTime();
  const difference = targetDate - time.getTime();

  const pad = (num) => num.toString().padStart(2, "0");
  const d = pad(Math.floor(difference / (1000 * 60 * 60 * 24)));
  const h = pad(Math.floor((difference / (1000 * 60 * 60)) % 24));
  const m = pad(Math.floor((difference / 1000 / 60) % 60));
  const s = pad(Math.floor((difference / 1000) % 60));

  return (
    <div className="relative font-mono text-xl sm:text-2xl md:text-4xl tracking-widest">
      <div className="flex gap-2 justify-center mb-6">
        {days.map((day, i) => (
          <div key={day} className={cn("text-xs px-2 py-1 rounded border", i === time.getDay() ? "bg-red-500/40 text-red-300 border-red-400" : "text-red-400/30 border-red-500/20")}>
            {day}
          </div>
        ))}
      </div>
      <div className="flex gap-4 items-center justify-center">
        {[d, h, m, s].map((val, i) => (
          <React.Fragment key={i}>
            <div className="bg-black/50 p-4 border border-red-500/40 rounded-xl text-red-400 font-bold">{val}</div>
            {i < 3 && <div className="flex flex-col gap-2"><div className="w-2 h-2 rounded-full bg-red-400 animate-pulse"/><div className="w-2 h-2 rounded-full bg-red-500 animate-pulse delay-500"/></div>}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

// Background Grid
function CursorDotGrid() {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const dotsRef = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const spacing = 40;
    
    const init = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const dots = [];
      for (let x = spacing/2; x < canvas.width; x += spacing) {
        for (let y = spacing/2; y < canvas.height; y += spacing) {
          dots.push({ x, y, baseX: x, baseY: y });
        }
      }
      dotsRef.current = dots;
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      dotsRef.current.forEach(dot => {
        const dx = mouseRef.current.x - dot.baseX;
        const dy = mouseRef.current.y - dot.baseY;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < 200) {
          const force = (1 - dist/200) * 60;
          const angle = Math.atan2(dy, dx);
          dot.x = dot.baseX - Math.cos(angle) * force;
          dot.y = dot.baseY - Math.sin(angle) * force;
        } else {
          dot.x += (dot.baseX - dot.x) * 0.08;
          dot.y += (dot.baseY - dot.y) * 0.08;
        }
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, 2.5, 0, Math.PI*2);
        ctx.fillStyle = `rgba(155, 100, 100, ${dist < 200 ? 1 : 0.6})`;
        ctx.fill();
      });
      requestAnimationFrame(animate);
    };

    init();
    window.addEventListener("mousemove", (e) => mouseRef.current = { x: e.clientX, y: e.clientY });
    window.addEventListener("resize", init);
    animate();
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />;
}

// Preloader
function Preloader({ onComplete }) {
  const [scale, setScale] = useState(1);
  const [displayText, setDisplayText] = useState("RENAISSANCE");

  useEffect(() => {
    const timer = setTimeout(() => {
      setScale(50);
      setTimeout(onComplete, 1000);
    }, 3000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#EF4444] transition-opacity duration-1000">
      <h1 className="text-8xl font-bold transition-transform duration-[2.5s] ease-in-out" style={{ transform: `scale(${scale})` }}>
        {displayText}
      </h1>
    </div>
  );
}

// Main Page
export default function ComingSoonPage() {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="bg-[#0B0B0F] min-h-screen text-white overflow-x-hidden selection:bg-red-500">
      {!loaded && <Preloader onComplete={() => setLoaded(true)} />}
      <CursorDotGrid />
      
      <main className={cn("relative z-10 flex flex-col items-center justify-center min-h-screen transition-opacity duration-1000", loaded ? "opacity-100" : "opacity-0")}>
        <div className="text-center space-y-8">
          <h1 className="text-7xl md:text-9xl font-black tracking-tighter">
            <span className="bg-gradient-to-r from-red-400 via-red-500 to-red-400 bg-clip-text text-transparent animate-pulse">
              RENAISSANCE
            </span>
          </h1>
          <h2 className="text-xl md:text-3xl tracking-[0.5em] text-red-300">COMING SOON</h2>
          <DigitalClock />
          <p className="max-w-md mx-auto text-sm font-mono text-red-400/80 tracking-widest">
            SOMETHING EXTRAORDINARY IS ON THE HORIZON
          </p>
        </div>
      </main>
    </div>
  );
}