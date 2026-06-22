import React, { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Volume2, VolumeX, Maximize, Minimize, Loader2 } from 'lucide-react';
import { getAsset } from '../../config';

const TruckSection = () => {
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const videoWrapperRef = useRef(null);

  const [isFixed, setIsFixed] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [stopPosition, setStopPosition] = useState("30vw");
  const [isMuted, setIsMuted] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  useEffect(() => {
    const handleResize = () => {
      setStopPosition(window.innerWidth < 768 ? "15vw" : "15vw");
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleVideoPlayback = (shouldPlay) => {
    if (videoRef.current) {
      if (shouldPlay || document.fullscreenElement || document.webkitFullscreenElement) {
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.pause();
      }
    }
  };

  // Subscribe to scroll changes but avoid state churn by only updating
  // when crossing logical thresholds. Also avoid repeated play/pause calls.
  useEffect(() => {
    if (!scrollYProgress) return;

    const prevState = { current: null };
    const playingRef = { current: false };

    const onChange = (latest) => {
      const newState = latest > 0 && latest < 1 ? 'scrolling' : latest >= 1 ? 'finished' : 'idle';

      if (newState !== prevState.current) {
        prevState.current = newState;
        setIsFixed(newState === 'scrolling');
        setIsFinished(newState === 'finished');
      }

      const shouldPlay = latest > 0.3 && latest < 0.7;
      if (videoRef.current) {
        if (shouldPlay && !playingRef.current) {
          videoRef.current.play().catch(() => {});
          playingRef.current = true;
        } else if (!shouldPlay && playingRef.current) {
          videoRef.current.pause();
          playingRef.current = false;
        }
      }
    };

    const unsubscribe = scrollYProgress.on('change', onChange);
    return () => unsubscribe();
  }, [scrollYProgress]);

  // Keep video muted state in sync with `isMuted` boolean
  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = isMuted;
  }, [isMuted]);

  // --- FIXED FULLSCREEN LOGIC ---
  const toggleFullScreen = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const video = videoRef.current;
    if (!video) return;

    if (!document.fullscreenElement && !document.webkitFullscreenElement) {
      // ENTER FULLSCREEN
      if (video.requestFullscreen) {
        video.requestFullscreen();
      } else if (video.webkitRequestFullscreen) {
        video.webkitRequestFullscreen(); // Chrome/Safari Desktop
      } else if (video.webkitEnterFullscreen) {
        video.webkitEnterFullscreen(); // iOS Safari specific
      }
    } else {
      // EXIT FULLSCREEN
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
    }
  };

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(!!(document.fullscreenElement || document.webkitFullscreenElement));
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    document.addEventListener("webkitfullscreenchange", onFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", onFullscreenChange);
    };
  }, []);

  const toggleMute = (e) => {
    e.stopPropagation();
    setIsMuted((prev) => {
      const next = !prev;
      if (videoRef.current) videoRef.current.muted = next;
      return next;
    });
  };

  const truckX = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], ["-100vw", stopPosition, stopPosition, "150vw"]);
  const videoOpacity = useTransform(scrollYProgress, [0.28, 0.3, 0.7, 0.72], [0, 1, 1, 0]);

  const getContainerClass = () => {
    if (isFinished) return "absolute bottom-0 left-0 w-full h-screen";
    if (isFixed) return "fixed top-0 left-0 w-full h-screen";
    return "absolute top-0 left-0 w-full h-screen";
  };

  return (
    <section ref={containerRef} className="relative h-[400vh] w-full overflow-hidden">
      <div className={getContainerClass()}>
        <div className="absolute top-0 left-0 w-full h-full -z-10">
          <img
            src={getAsset("/truck/bg.webp")}
            alt="BG"
            className="w-full h-full object-cover"
            loading="lazy"
            decoding="async"
          />
        </div>

        <motion.div
          style={{ x: truckX, left: 0 }}
          className="absolute bottom-[0] md:bottom-[-25vh] z-[100] w-[80vw] min-w-[400px] max-w-[950px] flex justify-center items-center pointer-events-none"
        >
          <img
            src={getAsset("/truck/truck.webp")}
            alt="Truck"
            className="w-full h-auto"
            loading="lazy"
            decoding="async"
          />

          <motion.div
            ref={videoWrapperRef}
            style={{ opacity: videoOpacity }}
            className="truck absolute top-[24%] left-[6%] w-[51%] h-[32%] bg-black overflow-hidden group pointer-events-auto"
          >
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 z-10">
                <Loader2 className="text-white animate-spin" size={24} />
              </div>
            )}

            <div className="w-full h-full scale-[1]"> 
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                src="https://ren2026-assests.b-cdn.net/After.mp4"
                playsInline
                muted={isMuted}
                fetchpriority="high"
                loop
                preload="auto"
                onCanPlay={() => setIsLoading(false)}
                // This ensures NO native controls ever appear
                controls={false} 
              />
            </div>

            {/* CUSTOM UI CONTROLS */}
            <div className="absolute inset-0 z-50 pointer-events-none flex flex-col justify-between p-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300">
              <button
                onClick={toggleFullScreen}
                className="self-end bg-black/60 text-white p-2 rounded-full pointer-events-auto active:scale-90"
              >
                {isFullscreen ? <Minimize size={14} /> : <Maximize size={14} />}
              </button>

              <button
                onClick={toggleMute}
                className="self-end bg-black/60 text-white p-2 rounded-full pointer-events-auto active:scale-90"
              >
                {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
              </button>
            </div>
          </motion.div>
        </motion.div>

        <div className="absolute bottom-0 md:bottom-0 left-0 w-full z-40">
          <img
            src={getAsset("/truck/road.webp")}
            alt="Road"
            className="w-full h-40 object-cover"
            loading="lazy"
            decoding="async"
          />
        </div>
      </div>
    </section>
  );
};

export default TruckSection;
