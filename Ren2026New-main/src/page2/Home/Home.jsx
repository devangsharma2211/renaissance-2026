import React, { useRef, lazy, Suspense } from 'react';
// import React, { useRef, lazy, Suspense } from 'react';
import { useScroll, useTransform, motion } from 'framer-motion';
import Hero from '../../components/heroSection/Hero.jsx'; 
// import Celebs from '../../components/celebs/Celebs.jsx';
// import MiniGallery from '../../components/mini-gallery/MiniGallery.jsx';
import Cube from '../../components/sponsers/cube.jsx';
import { getAsset } from '../../config';
import Login from '../../components/login/login.jsx';


const Celebs = lazy(() => import('../../components/celebs/Celebs.jsx'));
const MiniGallery = lazy(() => import('../../components/mini-gallery/MiniGallery.jsx'));
const Truck = lazy(() => import('../../components/truck/truck.jsx'));


export default function Home() {
    const celebsRef = useRef(null);

    // Scroll logic for Celebs content
    const { scrollYProgress } = useScroll({
        target: celebsRef,
        offset: ["start start", "end end"]
    });

    // --- RESPONSIVE CURTAIN LOGIC ---
    // "start end" = when top of celebs hits bottom of screen
    // "start start" = when top of celebs hits top of screen
    const { scrollYProgress: entryProgress } = useScroll({
        target: celebsRef,
        offset: ["start end", "start start"]
    });

    // Map progress to curtain position
    // 0 -> -100% (Hidden above)
    // 1 -> 0% (Fully covering screen)
    // Adjusted easing for smoother laptop experience
    const curtainY = useTransform(entryProgress, [0, 1], ["-100%", "0%"]);

    return ( 
        <>
            {/* Curtain Layer - Fixed to viewport */}
            <motion.div
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100vh',
                    zIndex: 5, // Above Hero (0), Below Celebs Content (10)
                    y: curtainY,
                    pointerEvents: 'none'
                }}
            >
                <img 
                    src={getAsset("/Celebs/festival-bg.webp")} 
                    alt="Curtain BG" 
                    loading="lazy"
                    decoding="async"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }} 
                />
            </motion.div>

            {/* Hero Section - Sticky effect */}
            {/* Changed top to 0 to prevent cutting off top of Hero image on laptops */}
<div style={{ position: 'sticky', top: 0, zIndex: 1, width: '100%', height: '100vh' }}>
                <Hero />
            </div>

            {/* Content Container */}
            <div style={{ position: 'relative', zIndex: 10 }}>
                
                {/* Celebs Scroll Track */}
                <div 
                    ref={celebsRef} 
                    style={{ 
                        // Increase track height for slower, smoother curtain reveal
                        height: '200vh', 
                        position: 'relative', 
                    }}
                >
                    <div style={{ position: 'sticky', top: 0, overflow: 'hidden' }}>
                        <Suspense fallback={null}>
                          <Celebs scrollProgress={scrollYProgress} />
                        </Suspense>
                    </div>
                </div>

                {/* Other Components */}
                <div style={{ position: 'relative' }}>
                    <Suspense fallback={null}>
                      <MiniGallery />
                    </Suspense>
                    <Cube />
                    <Suspense fallback={null}>
                      <Truck/>
                    </Suspense>
                </div>
            </div>
        </>
    );
}


// import React, { useRef } from 'react';
// import { useScroll, useTransform, motion } from 'framer-motion';
// import Hero from '../../components/heroSection/Hero.jsx'; 
// import Celebs from '../../components/celebs/Celebs.jsx';
// import MiniGallery from '../../components/mini-gallery/MiniGallery.jsx';
// import Cube from '../../components/sponsers/cube.jsx';
// import Truck from '../../components/truck/truck.jsx';
// import { getAsset } from '../../config';
// export default function Home() {
//     const celebsRef = useRef(null);

//     // Scroll logic for Celebs content
//     const { scrollYProgress } = useScroll({
//         target: celebsRef,
//         offset: ["start start", "end end"]
//     });

//     // --- RESPONSIVE CURTAIN LOGIC ---
//     // "start end" = when top of celebs hits bottom of screen
//     // "start start" = when top of celebs hits top of screen
//     const { scrollYProgress: entryProgress } = useScroll({
//         target: celebsRef,
//         offset: ["start end", "start start"]
//     });

//     // Map progress to curtain position
//     // 0 -> -100% (Hidden above)
//     // 1 -> 0% (Fully covering screen)
//     // Adjusted easing for smoother laptop experience
//    const curtainY = useTransform(entryProgress, [0, 1], ["-105%", "0%"]);

//     return ( 
//     <>
//         {/* 1. Hero Section - Set to zIndex 1 and fix position */}
//         <div style={{ position: 'sticky', top: 0, zIndex: 1, width: '100%', height: '100vh' }}>
//             <Hero />
//         </div>

//         {/* 2. Curtain Layer - Set to zIndex 2 (Above Hero, Below Content) */}
//         <motion.div
//             style={{
//                 position: 'fixed',
//                 top: 0,
//                 left: 0,
//                 width: '100%',
//                 height: '100vh',
//                 zIndex: 2, 
//                 y: curtainY,
//                 pointerEvents: 'none'
//             }}
//         >
//             <img 
//                 src={getAsset("/Celebs/festival-bg.webp")} 
//                 alt="Curtain BG" 
//                 style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
//             />
//         </motion.div>

//         {/* 3. Content Container - Set to zIndex 10 */}
//         <div style={{ position: 'relative', zIndex: 10 }}>
//             <div 
//                 ref={celebsRef} 
//                 style={{ height: '200vh', position: 'relative' }}
//             >
//                 <div style={{ position: 'sticky', top: 0, overflow: 'hidden' }}>
//                     <Celebs scrollProgress={scrollYProgress} />
//                 </div>
//             </div>

//             <div style={{ position: 'relative', backgroundColor: '#000' }}>
//                 <MiniGallery />
//                 <Cube />
//                 <Truck/>
//             </div>
//         </div>
//     </>
//     );
// }
