import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import timelineData from "./timeline.js";
import { MapPin } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLayoutEffect } from "react"; 
import { getAsset } from "../../config";

const BIKE_IMAGE_PATH = getAsset("/itinerary/bike2.webp");
const BACKGROUND_IMAGE_PATH = getAsset("/itinerary/background.webp");

gsap.registerPlugin(ScrollTrigger);

const BikeAnimation = ({ timelineRef, isAnimating }) => {
  const bikeRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    if (!timelineRef.current || !bikeRef.current || !isAnimating) return;

    // Debounced animation setup
    const setupAnimation = () => {
      if (animationRef.current) {
        animationRef.current.kill();
      }

      const travelY = Math.max(
        0,
        timelineRef.current.offsetHeight - bikeRef.current.offsetHeight
      );

      animationRef.current = gsap.to(bikeRef.current, {
        y: () => {
    return timelineRef.current.offsetHeight - bikeRef.current.offsetHeight;
  },
  rotation: 4,
  ease: "none",
  scrollTrigger: {
    trigger: timelineRef.current,
    start: "top 20%",
    end: "bottom bottom",
    scrub: 0.5,
    fastScrollEnd: 3000,
    invalidateOnRefresh: true, // This is crucial for laptop/responsive shifts
  },
      });

      ScrollTrigger.refresh();
    };

    // Small delay to ensure DOM is ready
   const timer = setTimeout(() => {
      setupAnimation();
      ScrollTrigger.refresh();
    }, 100);
    window.addEventListener("load", () => ScrollTrigger.refresh());    // Cleanup
    const resizeObserver = new ResizeObserver(() => ScrollTrigger.refresh());
        resizeObserver.observe(timelineRef.current);
        return () => {
          clearTimeout(timer);
          if (animationRef.current) {
            animationRef.current.kill();
            animationRef.current = null;
          }
        };
      }, [timelineRef, isAnimating]);

  return (
    <div
      ref={bikeRef}
      className="absolute left-14 sm:left-1/2 top-0 w-24 h-36 sm:w-40 sm:h-64 z-30 transform -translate-x-1/2 pointer-events-none will-change-transform"
    >
      <img
        src={BIKE_IMAGE_PATH}
        alt="Bike"
        className="w-full h-full object-contain drop-shadow-[0_10px_10px_rgba(0,0,0,0.8)]"
        loading="eager"
        decoding="sync"
        fetchpriority="high"
      />
    </div>
  );
};

const TimelineEvent = React.memo(({ event, index, registerRef }) => {
  const isEven = index % 2 === 0;
  const sectionRef = useRef(null);

  useEffect(() => {
    if (sectionRef.current && registerRef) {
      registerRef(sectionRef.current, index);
    }
  }, [registerRef, index]);

  return (
    <div
      ref={sectionRef}
      className="relative flex items-center mb-32 last:mb-0"
    >
      <div
        className={`flex w-full items-center ${
          isEven ? "justify-start sm:justify-end" : "justify-start"
        }`}
      >
        <div
          className={`relative w-full z-10 group transition-transform duration-300 hover:scale-105 sm:w-[40%] pl-28 sm:pl-0 ${
            isEven ? "sm:pl-16" : "sm:pr-16"
          }`}
        >
          <div className="relative w-full">
            <img
              src={event.icon}
              alt="Event Background"
              className="w-full h-auto object-contain drop-shadow-2xl"
              loading="lazy"
              decoding="async"
            />

            <div className="absolute inset-0 flex flex-col justify-center items-center text-center p-6 sm:p-10">
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-1 uppercase tracking-wide drop-shadow-sm">
                {event.title}
              </h2>

              <p className="text-gray-900 text-xs sm:text-sm font-bold leading-tight drop-shadow-sm line-clamp-3">
                {event.content}
              </p>

              {event.location && (
                <div className="flex items-center justify-center gap-1 text-black mt-2 text-xs font-extrabold uppercase tracking-wider">
                  <MapPin className="w-3 h-3 text-black" />
                  {event.location}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div
        className="absolute left-4 sm:left-1/2 transform sm:-translate-x-1/2 -translate-y-1/2 z-20"
        style={{ top: "50%" }}
      >
        <div
          className={`hidden sm:block absolute top-1/2 h-[2px] bg-cyan-500/60 w-32 shadow-[0_0_8px_#0ff] ${
            isEven ? "left-full" : "right-full"
          }`}
        ></div>
      </div>
    </div>
  );
});

TimelineEvent.displayName = 'TimelineEvent';

const VerticalTimeline = ({ events }) => {
  const timelineRef = useRef(null);
  const cardAnimationsRef = useRef([]);
  const isAnimatingRef = useRef(false);

  // Register section ref for animation
  const registerSectionRef = useCallback((section, index) => {
    cardAnimationsRef.current[index] = section;
  }, []);

  useEffect(() => {
    if (!events.length) return;

    isAnimatingRef.current = true;

    // Single optimized animation setup for cards
    const setupCardAnimations = () => {
      cardAnimationsRef.current.forEach((section) => {
        if (section) {
          gsap.fromTo(
            section,
            { opacity: 0, y: 50, scale: 0.9 },
            {
              opacity: 1,
              y: 0,
              scale: 1,
              duration: 0.6,
              ease: "power3.out",
              scrollTrigger: {
                trigger: section,
                start: "top 85%",
                toggleActions: "play none none reverse",
                fastScrollEnd: true,
              },
            }
          );
        }
      });

      ScrollTrigger.refresh();
    };

    // Debounce the setup
    const timer = setTimeout(setupCardAnimations, 100);

    return () => {
      clearTimeout(timer);
      isAnimatingRef.current = false;
      
      // Cleanup GSAP animations
      ScrollTrigger.getAll().forEach(trigger => {
        if (trigger.trigger && trigger.trigger.parentElement) {
          trigger.kill();
        }
      });
      
      cardAnimationsRef.current = [];
    };
  }, [events]);

  return (
    <div className="min-h-screen px-2 sm:px-8 py-16 overflow-hidden">
      <div className="max-w-6xl mx-auto relative pb-32" ref={timelineRef}>
        
        {/* Road */}
        <div className="absolute left-4 sm:left-1/2 top-0 h-full w-20 sm:w-28 bg-[#1a1a1a] border-x-4 border-gray-700 transform sm:-translate-x-1/2 z-0 shadow-2xl">
          <div className="absolute left-1/2 top-0 h-full w-0 border-l-4 border-dashed border-white/40 transform -translate-x-1/2"></div>
        </div>

        {/* Bike Animation */}
        <BikeAnimation 
          timelineRef={timelineRef} 
          isAnimating={events.length > 0} 
        />

        {/* Events Loop */}
        {events.map((event, index) => (
          <TimelineEvent
            key={`${event.title}-${index}`}
            event={event}
            index={index}
            registerRef={registerSectionRef}
          />
        ))}
      </div>
    </div>
  );
};

const DayButton = React.memo(({ day, selectedDay, onClick }) => {
  const isSelected = selectedDay === day;
  
  return (
    <button
      onClick={() => onClick(day)}
      className={`px-8 py-3 rounded-full text-lg font-bold transition-all ${
        isSelected
          ? "bg-yellow-400 text-black shadow-[0_0_18px_rgba(250,204,21,0.9)]"
          : "bg-amber-900/60 text-amber-100 hover:bg-red-800/80"
      }`}
      aria-pressed={isSelected}
    >
      {day}
    </button>
  );
});

DayButton.displayName = 'DayButton';

const Itinerary = () => {
  const [selectedDay, setSelectedDay] = useState("Day 1");
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  const menuItems = useMemo(() => ["Day 1", "Day 2", "Day 3"], []);

  const handleDayChange = useCallback((day) => {
    if (day === selectedDay) return;
    
    setIsTransitioning(true);

    ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    
    setSelectedDay(day);
    
    // Allow time for cleanup before new animations
    setTimeout(() => {
      setIsTransitioning(false);
      ScrollTrigger.refresh();
    }, 50);
  }, [selectedDay]);

  const currentEvents = useMemo(() => 
    timelineData[selectedDay] || [], 
    [selectedDay]
  );
useEffect(() => {
    // When the component mounts, wait a beat then refresh all triggers
    const refreshTimer = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 500);

    return () => {
      clearTimeout(refreshTimer);
      // Clean up all triggers when leaving the page to prevent "ghost" scrolling
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, []);
  return (
    <div className="relative min-h-screen text-white">
      {/* Optimized Background */}
      <div className="fixed inset-0 z-0">
        <img
          src={BACKGROUND_IMAGE_PATH}
          alt="Background"
          className="w-full h-full object-cover"
          loading="eager"
          decoding="sync"
          fetchpriority="high"
        />
      </div>

      <div className="relative z-10">
        <div className="pt-32 pb-10 flex justify-center gap-6">
          {menuItems.map((day) => (
            <DayButton
              key={day}
              day={day}
              selectedDay={selectedDay}
              onClick={handleDayChange}
            />
          ))}
        </div>

        {!isTransitioning && (
          <VerticalTimeline events={currentEvents} />
        )}
      </div>
    </div>
  );
};

export default React.memo(Itinerary);
