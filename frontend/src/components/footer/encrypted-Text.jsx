import React, { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

const DEFAULT_CHARSET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-={}[];:,.<>/?";

const getRandomChar = (charset) =>
  charset[Math.floor(Math.random() * charset.length)];

const generateScramble = (text, charset) =>
  text
    ? text.split("").map((ch) => (ch === " " ? " " : getRandomChar(charset)))
    : [];

const EncryptedText = ({
  text,
  className = "",
  revealDelayMs = 50,
  flipDelayMs = 50,
  charset = DEFAULT_CHARSET,
  encryptedClassName = "",
  revealedClassName = "",
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true }); // ✅ stabilize animation

  const [revealCount, setRevealCount] = useState(0);
  const scrambleRef = useRef([]);
  const rafRef = useRef(null);
  const startTimeRef = useRef(0);
  const lastFlipRef = useRef(0);

  useEffect(() => {
    if (!isInView || !text) return;

    scrambleRef.current = generateScramble(text, charset);
    setRevealCount(0);

    startTimeRef.current = performance.now();
    lastFlipRef.current = startTimeRef.current;

    const animate = (now) => {
      const elapsed = now - startTimeRef.current;
      const reveal = Math.min(
        text.length,
        Math.floor(elapsed / Math.max(1, revealDelayMs))
      );

      setRevealCount(reveal);

      if (reveal >= text.length) return;

      if (now - lastFlipRef.current >= flipDelayMs) {
        scrambleRef.current = scrambleRef.current.map((char, i) =>
          i >= reveal && text[i] !== " " ? getRandomChar(charset) : char
        );
        lastFlipRef.current = now;
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isInView, text, revealDelayMs, flipDelayMs, charset]);

  if (!text) return null;

  return (
    <motion.span
      ref={ref}
      className={className}
      aria-label={text}
      role="text"
    >
      {text.split("").map((char, index) => {
        const revealed = index < revealCount;
        return (
          <span
            key={index}
            className={revealed ? revealedClassName : encryptedClassName}
          >
            {revealed ? char : scrambleRef.current[index] ?? char}
          </span>
        );
      })}
    </motion.span>
  );
};

export default EncryptedText; // ✅ CRITICAL FIX
