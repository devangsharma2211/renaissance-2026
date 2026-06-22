import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLoading } from "./LoadingContext.jsx";
import "./preloader.css";

export default function Preloader() {
  const { setIsLoading } = useLoading();
  const [isReadyToPlay, setIsReadyToPlay] = useState(false);
  const [videoSrc, setVideoSrc] = useState("");
  const videoRef = useRef(null);

  const mobileUrl = "https://ren2026-assests.b-cdn.net/preloader.mp4";
  const desktopUrl = "https://ren2026-assests.b-cdn.net/preloaderDesktop.mp4";

  // Detect mobile vs desktop
  useEffect(() => {
    const updateVideoSrc = () => {
      if (window.innerWidth <= 768) {
        // Mobile
        setVideoSrc("https://ren2026-assests.b-cdn.net/preloader.mp4");
      } else {
        // Desktop / Laptop
        setVideoSrc("https://ren2026-assests.b-cdn.net/preloaderDesktop.mp4");
      }
    };

    updateVideoSrc();
    window.addEventListener("resize", updateVideoSrc);

    return () => window.removeEventListener("resize", updateVideoSrc);
  }, []);

  const handleStart = () => {
    sessionStorage.setItem("hasVisited", "true");
    setIsReadyToPlay(true);
  };

useEffect(() => {
  if (isReadyToPlay && videoRef.current && videoSrc) {
    const video = videoRef.current;
    
    video.muted = true; // Start muted to ensure the play promise is granted
    video.load(); 
    
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          // Flip muted to false ONLY after play() has successfully started
          video.muted = false; 
          video.volume = 1.0;
        })
        .catch((err) => {
          console.error("Video play failed:", err);
          setIsLoading(false);
        });
    }
  }
}, [isReadyToPlay, videoSrc, setIsLoading]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.2, ease: "easeInOut" }}
      className="futuristic-preloader-container"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        backgroundColor: "#000",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <AnimatePresence mode="wait">
        {!isReadyToPlay ? (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ textAlign: "center", color: "white", zIndex: 10 }}
          >
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleStart}
              style={{
                padding: "15px 40px",
                fontSize: "1.2rem",
                background: "transparent",
                color: "cyan",
                border: "2px solid cyan",
                cursor: "pointer",
                fontFamily: "monospace",
                textTransform: "uppercase",
                letterSpacing: "2px",
                boxShadow: "0 0 15px cyan",
              }}
            >
              Initialize Experience
            </motion.button>
          </motion.div>
        ) : (
          <motion.div
            key="video"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              width: "100%",
              height: "100%",
              position: "absolute",
              inset: 0,
            }}
          >
            <video
  ref={videoRef}
  key={videoSrc} // Forces re-mount to clear Safari's internal cache
  playsInline
  autoPlay
   // Must be present in the HTML for autoplay to be allowed
  preload="auto"
  src={videoSrc} // This is the ONLY source definition you need
  onEnded={() => setIsLoading(false)} // This redirects to Home Page
  onError={() => setIsLoading(false)} // Failsafe redirection
  style={{ width: "100%" }}
>
            {/* Using source tags with media queries is more performant than state-based switching */}
            <source src={desktopUrl} media="(min-width: 769px)" />
            <source src={mobileUrl} media="(max-width: 768px)" />
          </video>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
