//tilt hata diya h maine mobile se 
import React, { useRef } from 'react';
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useSpring,
} from 'framer-motion';

// ROTATION_RANGE = 35; // Disabled rotation

export const TiltCard = ({
  index,
  title,
  subtitle,
  icon,
  gradient,
  mouseX,
  mouseY,
  image,
  onClick,
  isHovered,
  onHover,
  onLeave,
  anyCardHovered,
}) => {
  const cardRef = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const [isMobile, setIsMobile] = React.useState(false);

  // Check for mobile device on mount and window resize
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768); // Adjust breakpoint as needed
    };

    // Initial check
    checkMobile();

    // Add resize listener
    window.addEventListener('resize', checkMobile);

    // Cleanup
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  React.useEffect(() => {
    // Disable tilt effect completely - keep cards static
    x.set(0);
    y.set(0);
  }, [mouseX, mouseY, isMobile]);

  const springConfig = { damping: 30, stiffness: 200 };
  const xSpring = useSpring(x, springConfig);
  const ySpring = useSpring(y, springConfig);

  const transform = useMotionTemplate`rotateX(${ySpring}deg) rotateY(${xSpring}deg)`;

  // Determine brightness based on hover state
  const getBrightness = () => {
    if (!anyCardHovered) return 'brightness-100'; // All bright initially
    if (isHovered) return 'brightness-130 scale-[1.02] z-30'; // Hovered card brighter and slightly scaled
    return 'brightness-[0.45] z-10'; // Other cards dimmed
  };

  const handleMouseEnter = () => {
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      onHover(rect);
    }
  };

  return (
    <motion.div
      ref={cardRef}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={onLeave}
      style={{
        transformStyle: 'preserve-3d',
        transform: 'none',
      }}
      className={`relative h-96 w-72 cursor-pointer rounded-xl ${gradient} transition-all duration-150 ease-out ${getBrightness()}`}
    >
      {/* Card content */}
      <div 
        className="absolute inset-0 rounded-xl overflow-hidden"
        style={{
          transform: 'translateZ(20px)',
          transformStyle: 'preserve-3d',
        }}
      >
        <img
          src={image}
          alt={title}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-200"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/50 to-slate-900/90" />
        <div className="absolute inset-0 bg-gradient-to-t from-transparent via-slate-900/30 to-slate-900/60" />
      </div>

      <div
        style={{ 
          transform: 'translateZ(20px)',
        }}
        className="absolute inset-0 rounded-xl opacity-20 [background-image:_linear-gradient(rgba(255,255,255,0.1)_1px,_transparent_1px),_linear-gradient(90deg,_rgba(255,255,255,0.1)_1px,_transparent_1px)] [background-size:_20px_20px]"
      />
      
      <div
        style={{
          transform: 'translateZ(75px)',
          transformStyle: 'preserve-3d',
        }}
        className="absolute inset-0 flex flex-col items-start justify-end p-6"
      >

        <div
          style={{
            transform: 'translateZ(50px)',
          }}
          className="text-left"
        >
          <h3 className="mb-2 text-xl font-bold tracking-wide text-white [text-shadow:_0_0_20px_rgba(255,255,255,0.5)]">
            {title}
          </h3>
          <p className="text-sm font-medium text-white/90 [text-shadow:_0_0_10px_rgba(255,255,255,0.3)]">
            {subtitle}
          </p>
        </div>
      </div>

      <div
        style={{ transform: 'translateZ(2px)' }}
        className="absolute inset-2 rounded-xl bg-gradient-to-b from-white/8 to-transparent"
      />
    </motion.div>
  );
};

export default TiltCard;
