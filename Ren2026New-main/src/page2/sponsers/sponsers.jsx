import React from 'react';
import { getAsset } from '../../config';

const ComicCubeLoader = () => {
  // =================================================================
  // 🎨 CONFIGURATION: YOUR IMAGE PATHS
  // =================================================================
  const images = {
    // Pair 1: Front & Back Faces
    pair1: "https://ren2026-assests.b-cdn.net/rlogo.webp",
    
    // Pair 2: Right & Left Faces
    pair2: "https://ren2026-assests.b-cdn.net/jecrc.webp",
    
    // Pair 3: Top & Bottom Faces (Now visible thanks to the new animation)
    pair3: "https://ren2026-assests.b-cdn.net/krafton.webp",
  };

  return (
    <div className=" relative w-full h-screen flex items-center justify-center overflow-hidden bg-[#ff4500] perspective-container">
      <style>{`
        .perspective-container {
          perspective: 1500px;
        }
        .preserve-3d {
          transform-style: preserve-3d;
        }
        .backface-visible {
          backface-visibility: visible;
        }
        
        /* Custom Animations */
        @keyframes raySpin {
          to { transform: rotate(360deg); }
        }

        /* UPDATED: The "Tumble" 
           This moves the stage so that the Top (-90deg) and Bottom (90deg)
           faces explicitly point at the camera for a moment.
        */
        @keyframes stageTumble {
          0%   { transform: scale(1) rotateX(0deg); }       /* Show Sides */
          20%  { transform: scale(1) rotateX(0deg); }       
          25%  { transform: scale(1.2) rotateX(-90deg); }   /* Snap to Top (Pair 3) */
          45%  { transform: scale(1.2) rotateX(-90deg); }   /* Hold Top */
          50%  { transform: scale(1) rotateX(0deg); }       /* Back to Sides */
          70%  { transform: scale(1) rotateX(0deg); }
          75%  { transform: scale(1.2) rotateX(90deg); }    /* Snap to Bottom (Pair 3) */
          95%  { transform: scale(1.2) rotateX(90deg); }    /* Hold Bottom */
          100% { transform: scale(1) rotateX(0deg); }       /* Reset */
        }

        /* UPDATED: The Spin
           Keeps spinning the Y axis so the sides rotate.
           When stageTumble is showing Top/Bottom, this spin turns them like a wheel.
        */
        @keyframes autoRotate {
          from { transform: rotateY(0deg); }
          to { transform: rotateY(360deg); }
        }
        
        @keyframes comicFlash {
          0%, 48%, 52%, 100% { opacity: 0; transform: scale(0.5) rotate(-20deg); }
          50% { opacity: 1; transform: scale(1.4) rotate(5deg); }
        }
        @keyframes shadowPulse {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(0.4); opacity: 0.1; }
        }
      `}</style>

      {/* Background Pattern */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-10"
        style={{
          backgroundImage: 'radial-gradient(#000000 1px, transparent 1px)',
          backgroundSize: '15px 15px'
        }}
      ></div>

      {/* Action Rays */}
      <div className="absolute w-[300vmax] h-[300vmax] -z-10 animate-[raySpin_20s_linear_infinite]"></div>

      {/* Pop Burst Word Effect */}
      <div className="absolute w-full h-full pointer-events-none flex items-center justify-center z-10">
        <div 
          className="absolute font-black text-[60px] text-white opacity-0"
          style={{
            WebkitTextStroke: '3px #000',
            textShadow: '8px 8px 0 #ff00ff',
            animation: 'comicFlash 4s cubic-bezier(0.85, 0, 0.15, 1) infinite'
          }}
        >
        </div>
      </div>

      {/* The 3D Stage - Controls the Tumble (Up/Down visibility) */}
      <div 
        className="relative w-[210px] h-[210px] preserve-3d"
        style={{ animation: 'stageTumble 8s ease-in-out infinite' }}
      >
        
        {/* The Rotating Cube - Controls the Spin (Left/Right visibility) */}
        <div 
          className="absolute inset-0 preserve-3d"
          style={{ animation: 'autoRotate 6s linear infinite' }}
        >
          {/* --- PAIR 1 (Sides) --- */}
          <CubeFace 
            bg="bg-[#00d2ff]" 
            transform="rotateY(0deg) translateZ(105px)" 
            imgSrc={images.pair1} 
            label="Imagine"
          />
          <CubeFace 
            bg="bg-[#ff00ff]" 
            transform="rotateY(180deg) translateZ(105px)" 
            imgSrc={images.pair1} 
            label="Imagine"
          />

          {/* --- PAIR 2 (Sides) --- */}
          <CubeFace 
            bg="bg-[#ffef00]" 
            transform="rotateY(90deg) translateZ(105px)" 
            imgSrc={images.pair2} 
            label="KTM"
          />
          <CubeFace 
            bg="bg-white" 
            transform="rotateY(-90deg) translateZ(105px)" 
            imgSrc={images.pair2} 
            label="KTM"
          />

          {/* --- PAIR 3 (Top & Bottom) --- */}
          {/* Note: Logic adjusted so these appear correctly when stage tilts */}
          <CubeFace 
            bg="bg-[#ff5252]" 
            transform="rotateX(90deg) translateZ(105px)" 
            imgSrc={images.pair3} 
            label="Enagic"
          />
          <CubeFace 
            bg="bg-[#00e676]" 
            transform="rotateX(-90deg) translateZ(105px)" 
            imgSrc={images.pair3} 
            label="Enagic"
          />
        </div>

        {/* Shadow Floor */}
        <div 
          className="absolute -bottom-[100px] w-[150px] h-[40px] bg-black/30 rounded-full blur-[10px]"
          style={{ animation: 'shadowPulse 8s ease-in-out infinite' }}
        ></div>
      </div>
    </div>
  );
};

// Helper Component for Cube Faces
const CubeFace = ({ bg, transform, label, imgSrc }) => {
  return (
    <div 
      className={`absolute w-full h-full ${bg} border-[5px] border-black flex flex-col items-center justify-center overflow-hidden backface-visible shadow-[12px_12px_0_#000] box-border`}
      style={{ transform }}
    >
      {imgSrc ? (
        <>
           <img 
             src={imgSrc} 
             alt={label || 'cube face'} 
             className="absolute inset-0 w-full h-full object-cover z-[1]" 
             loading="lazy"
             decoding="async"
           />
           <div className="absolute inset-0 bg-black/20 z-[1]"></div>
        </>
      ) : (
        <div className="absolute w-[150%] h-[20px] bg-black opacity-20 -rotate-45 -translate-y-[40px]"></div>
      )}
      
      {label && (
        <span className="font-black text-[12px] bg-black text-white px-2 py-[2px] mt-auto mb-2 uppercase z-[2] font-sans shadow-md transform rotate-0">
          {label}
        </span>
      )}
    </div>
  );
};

export default ComicCubeLoader;
