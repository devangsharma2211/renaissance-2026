import React, { useState } from "react";
import teamData from "./teams"; 
import { Bot, Linkedin, Mail } from "lucide-react";
import ScrollDownIndicator from "./ScrollDownIndicator";
import { getAsset } from "../../config";


const cardFrameImage = getAsset("/teams/card-bg.webp");

function Team({ team, description, teamdata }) {
  const [activeCard, setActiveCard] = useState(null);

  return (
    <div className="max-w-7xl mx-auto mb-24">
      {/* Sub-Team Title (e.g. Web Team) */}
      <div className="relative mb-12 flex flex-col items-center">
        <h2 className="text-[40px] md:text-[50px] font-black text-center text-white tracking-widest uppercase drop-shadow-lg">
          {team}
        </h2>
        <div className="h-1 w-24 bg-yellow-400 rounded-full mt-2"></div>
      </div>

      <div className="px-4 sm:px-6 md:px-12 lg:px-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-16 gap-x-12">
          {teamdata.map((card, index) => (
            <div
              key={index}
              className="group relative h-[480px] w-full cursor-pointer transition-transform duration-500 hover:-translate-y-3"
              onClick={() => setActiveCard(activeCard === index ? null : index)}
            >
              {/* 1. THE FRAME (Background) */}
              <div className="absolute inset-0 z-10 pointer-events-none drop-shadow-2xl">
                <img
                  src={cardFrameImage}
                  alt="Card Frame"
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-fill"
                />
              </div>

              {/* 2. THE PERSON IMAGE (Inside the frame) */}
              {/* Note: Z-index is 20 to stay in front of the frame border */}
              <div className="absolute top-[10%] left-[10%] right-[10%] bottom-[22%] z-20 overflow rounded-xl bg-transparent">
                <img
                  src={card.image}
                  alt={card.title}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                />
                
                {/* Gradient Fade for Text Readability */}
                <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-white via-white/60 to-transparent opacity-0"></div>
              </div>

              {/* 3. TEXT & SOCIALS */}
              <div className="absolute bottom-[28px] left-[13%] right-[13%] z-30 flex flex-col justify-end">
                
                {/* Name */}
                <h3 className="text-3xl font-black text-gray-900 uppercase tracking-tighter leading-none mb-1 font-sans">
                  {card.title}
                </h3>
                
                <div className="flex justify-between items-end border-t border-gray-900/20 pt-2 mt-1">
                  {/* Role */}
                  <p className="text-sm font-bold text-gray-800 uppercase tracking-wider font-sans leading-tight max-w-[70%]">
                    {card.description}
                  </p>

                  {/* Social Buttons */}
                  <div className={`flex space-x-2 transition-all duration-300 transform ${activeCard === index ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0'}`}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(`https://www.linkedin.com/in/${card.linkedin}`, "_blank");
                      }}
                      className="p-1.5 bg-gray-900 text-white rounded-full hover:bg-gray-700 hover:scale-110 transition-all"
                    >
                      <Linkedin className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(`mailto:${card.mail}`);
                      }}
                      className="p-1.5 bg-gray-900 text-white rounded-full hover:bg-red-500 hover:scale-110 transition-all"
                    >
                      <Mail className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
function Teams() {
  return (
    <div className="relative w-full">
      
      {/* 1. FIXED BACKGROUND */}
      <div className="fixed inset-0 -z-10 w-full h-full">
        <img
          src={getAsset("/teams/bg.webp")}
          alt="Background"
          loading="eager"
          decoding="sync"
          className="w-full h-full object-cover" 
        />
        {/* Dark overlay for better text contrast */}
        <div className="absolute inset-0 bg-black/60"></div> 
      </div>

      {/* 2. HERO SECTION (100vh height) */}
      <div className="relative h-screen w-full flex flex-col items-center justify-center px-4"> 
        {/* Added px-4 to prevent text touching edges on small screens */}
        
        {/* Main Title */}
        <div className="relative z-10 flex flex-col items-center animate-fade-in-up w-full">
           <h1 className="text-[15vw] md:text-[12vw] font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400 tracking-tighter uppercase drop-shadow-2xl leading-[0.8] text-center">
             Teams
           </h1>
           
           {/* --- FIX APPLIED HERE --- */}
           {/* 1. Changed tracking-[1em] to tracking-[0.2em] on mobile, keeping 1em for desktop */}
           {/* 2. Added text-center */}
           {/* 3. Added pl-[0.2em] md:pl-[1em] (Padding Left) to balance the letter spacing visually */}
           <span className="text-white/80 text-lg md:text-2xl tracking-[0.2em] md:tracking-[1em] uppercase mt-4 font-light text-center pl-[0.2em] md:pl-[1em]">
             Meet the Creators
           </span>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-10 animate-bounce">
           <ScrollDownIndicator />
        </div>
      </div>

      {/* 3. CONTENT SECTION */}
      <div
        className="relative z-10 pb-20 pt-10"
        style={{ contentVisibility: 'auto', containIntrinsicSize: '1200px' }}
      >
        {Object.entries(teamData).map(([teamname, teamdata]) => (
          <Team
            key={teamname}
            team={teamname}
            description="Lorem ipsum dolor sit amet."
            teamdata={teamdata}
          />
        ))}
      </div>

    </div>
  );
}

export default Teams;
