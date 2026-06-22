import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';
import axios from "axios";


export const Modal = ({
  eventID,
  category,
  isPaid: isPaidFromCard,
  subtitle,
  isOpen,
  onClose,
  title,
  description,
  image = getDefaultImage(title),
  actionLabel
}) => {
  const [tokenCount, setTokenCount] = useState(null);
  const [showTokenPop, setShowTokenPop] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  
useEffect(() => {
    const checkPaidStatus = async () => {
      if (!eventID || !isOpen) return;

      try {
        const rawCategory = (category || "").toLowerCase().trim();
        const normalizedCategory = rawCategory === "culture" ? "cultural" : rawCategory;
        const paidFromProps =
          normalizedCategory === "cultural"
            ? true
            : typeof isPaidFromCard === "boolean"
            ? isPaidFromCard
            : null;

        if (paidFromProps !== null) {
          setIsPaid(paidFromProps);
          return;
        }

        const response = await axios.get("https://ren-old.onrender.com/api/events/list");
        const paidEventsList = response.data;
        const event = paidEventsList.find(e =>
          (e._id?.$oid === eventID) || (e._id === eventID)
        );
        const apiCategory = (event?.category || "").toLowerCase().trim();
        const apiNormalized = apiCategory === "culture" ? "cultural" : apiCategory;
        const paid = apiNormalized === "cultural"
          ? true
          : typeof event?.isPaid === "boolean"
          ? event.isPaid
          : typeof event?.Paid === "boolean"
          ? event.Paid
          : typeof event?.paid === "boolean"
          ? event.paid
          : false;
        setIsPaid(paid);
      } catch (err) {
        console.error("Error fetching paid status from backend:", err);
        setIsPaid(false);
      }
    };

    checkPaidStatus();
  }, [eventID, isOpen, category, isPaidFromCard]);

  const buttonColor = {
    TECHNICAL: "bg-purple-500",
    CULTURAL: "bg-yellow-500",
    SPLASH: "bg-cyan-500"
  };
  
  const colorMapTitle = {
    TECHNICAL: "text-purple-500",
    CULTURAL: "text-yellow-500",
    SPLASH: "text-cyan-500",
    DEFAULT: "text-white",
  };
  
  const colorMap = {
    TECHNICAL: "text-purple-300",
    CULTURAL: "text-yellow-300",
    SPLASH: "text-cyan-300",
    DEFAULT: "text-white",
  };

  const titleColor = colorMapTitle[subtitle] || colorMapTitle.DEFAULT;
  const bgColor = buttonColor[subtitle] || "bg-gray-500";

useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess("");
        setError("");
      }, 4000);
      return () => clearTimeout(timer);
    }
 },[success, error, showTokenPop]);

useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setError("");
      setSuccess("");
      setTokenCount(null);
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen, eventID]);

  const registerForEvent = async (eventId) => {
    setError("");
    setSuccess("");
    setTokenCount(null);
    setIsLoading(true);
  
    const storedToken = localStorage.getItem("token"); // Check stored token
    const token = storedToken?.startsWith("Bearer ") ? storedToken.slice(7) : storedToken;
    if (!token) {
      setError("User not authenticated. Please log in first.");
      setIsLoading(false);
      return;
    }
  
    try {
      console.log("Making API request to:", "https://ren-old.onrender.com/api/events/register");
      const response = await axios.post(
        "https://ren-old.onrender.com/api/events/register",
        { eventId }, // Sending event ID
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setSuccess(response.data.message);
      const nextToken = response.data?.student?.token;
      if (typeof nextToken === "number") {
        setTokenCount(nextToken);
      } else {
        setTokenCount(null);
      }
      setShowTokenPop(true); // Show the pop-up

      setTimeout(() => {
        setShowTokenPop(false); // Hide after 1 sec
        setError("");
        setSuccess("");
      }, 4000);
    } catch (error) {
      setSuccess("");
      // Handling backend errors properly
      if (error.response) {
        const errorMessage = error.response.data.message;
  
        if (errorMessage && errorMessage.includes("No tokens left")) {
          setError("No more tokens left. Kindly pay and register offline.");
        } else if (errorMessage === "You have already registered for this event.") {
          setError("You are already registered for this event.");
        } else if (
          errorMessage === "You can only register for one technical event." ||
          errorMessage === "Can Register only one technical event. Kindly register and pay offline"
        ) {
          setError("Can Register only one technical event. Kindly register and pay offline");
        } else if (
          errorMessage === "You can only register for one splash event." ||
          errorMessage === "Can Register only one splash event. Kindly register and pay offline"
        ) {
          setError("Can Register only one splash event. Kindly register and pay offline");
        } else {
          setError(errorMessage || "Error registering for the event.");
        }
      } else {
        setError("Network error. Please try again later.");
      }
    }
    setIsLoading(false);
  };

  const handleRegister = () => {
    if (!eventID) {
      setError("Event ID is missing.");
      return;
    }
    registerForEvent(eventID);
    console.log("Registering event with ID:", eventID);
  };

  if (!isOpen) return null;

return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[150] flex items-center justify-center p-2 sm:p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/90 backdrop-blur-md"
          onClick={onClose}
        />

        {/* Modal Container */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0, rotateX: -15 }}
          animate={{ scale: 1, opacity: 1, rotateX: 0 }}
          exit={{ scale: 0.8, opacity: 0, rotateX: 15 }}
          className="relative w-full max-w-3xl max-h-[72vh] overflow-y-auto no-scrollbar rounded-2xl bg-slate-900 p-6 shadow-2xl  bg-gradient-to-br from-slate-900 to-slate-800 p-6 shadow-[0_0_30px_rgba(0,0,0,0.3)] md:overflow-hidden"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none", perspective: 1000  }}
          onClick={(e) => e.stopPropagation()}
        >
          
          <button
            onClick={onClose}
            className="absolute right-4 top-4 z-[60] rounded-full p-2 text-red-500 hover:bg-white/10"
          >
            <X size={24} />
          </button>

          <div className="flex flex-col md:flex-row md:h-[72vh]">
            
            {/* LEFT: Image Section (Vertically Centered on Laptop) */}
            <div className="w-full md:w-1/2 bg-slate-800/30 flex items-center justify-center p-8 md:p-12 pointer-events-none border-b md:border-b-0 md:border-r border-white/5 md:sticky md:top-0 md:h-full">
              <div className="relative w-full h-full flex items-center justify-center md:scale-[1.5]">
                <img 
                  src={image} 
                  alt={title} 
                  className="w-full max-h-[25vh] md:max-h-[35vh] object-contain transition-none transform-none drop-shadow-[0_0_30px_rgba(0,0,0,0.6)]" 
                />
              </div>
            </div>

            {/* RIGHT: Content Section */}
            <div
              className="w-full md:w-1/2 p-6 md:p-10 flex flex-col h-full md:overflow-y-auto no-scrollbar"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              <div className="flex-1">
                <h2 className={`text-2xl md:text-4xl font-bold mb-4 tracking-tight ${titleColor}`}>
                  {title}
                </h2>
                
                <div className="text-slate-300 space-y-4 text-sm md:text-base leading-relaxed mb-8">
                  {description.split("\n").map((line, i) => {
                    if (!line.trim()) return null;
                    
                    // Style lines ending in ':' as section headers
                    return line.trim().endsWith(":") ? (
                      <h3 key={i} className="font-bold text-white mt-6 uppercase tracking-widest text-[10px] md:text-xs opacity-50 border-b border-white/5 pb-1">
                        {line}
                      </h3>
                    ) : (
                      <div key={i} className="flex gap-3">
                        <span className="text-cyan-500 font-bold">•</span>
                        <p className="flex-1">{line.trim()}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ACTION AREA (Sticky at bottom of right column) */}
              <div className="mt-auto space-y-4 pt-4 border-t border-white/5">
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 text-[11px] md:text-xs bg-red-500/10 border border-red-500/50 text-red-400 rounded-lg"
                  >
                    {error}
                  </motion.div>
                )}

                {success && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 text-[11px] md:text-xs bg-green-500/10 border border-green-500/50 text-green-400 rounded-lg"
                  >
                    {success} {tokenCount !== null && `(Tokens: ${tokenCount})`}
                  </motion.div>
                )}
                
                {isPaid ? (
                  <div className="p-4 bg-yellow-500/10 border border-yellow-500/50 rounded-xl text-center">
                    <p className="text-yellow-500 font-bold text-sm md:text-base">PAID EVENT</p>
                    <p className="text-[10px] md:text-xs text-yellow-200/60 uppercase tracking-tighter mt-1">
                      Register offline at the Registration Desk
                    </p>
                  </div>
                ) : (
                  <button
                    disabled={isLoading}
                    className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all active:scale-95 flex items-center justify-center gap-3 ${bgColor} hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="animate-spin" size={20} />
                        <span>PROCESSING...</span>
                      </>
                    ) : (
                      <span>{actionLabel || "REGISTER NOW"}</span>
                    )}
                  </button>
                )}
              </div>
            </div>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

function getDefaultImage(title) {
  const imageMap = {
    'CORE CPU': 'https://images.unsplash.com/photo-1618495038459-7b019f1c1723?auto=format&fit=crop&w=800&q=80',
    'TECHNICAL': 'https://images.unsplash.com/photo-1600783245891-47e5b36a5a8b?auto=format&fit=crop&w=800&q=80',
    'NETWORK': 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80',
    'TERMINAL': 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80',
  };
  return imageMap[title] || imageMap['NETWORK'];
}