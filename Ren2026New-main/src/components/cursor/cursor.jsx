import React, { useEffect, useRef, useState } from "react";

const words = ["technical", "नमस्ते", "रंगीन", "🎧", "cultural", "टशन", "🥁", "splash", "desi"];
const colors = ["#e55520", "#FFD700 ", "#43beeb", "#FF1744 ", "#FFC107"];


export default function InteractiveCursor() {
  const cursorRef = useRef(null);
  const [particles, setParticles] = useState([]);
  const lastPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const moveCursor = (e) => {
      const x = e.clientX;
      const y = e.clientY;

      // Move custom cursor
      if (cursorRef.current) {
        cursorRef.current.style.left = `${x}px`;
        cursorRef.current.style.top = `${y}px`;
      }

      // ✅ Pop only if mouse moved enough distance
      const dx = x - lastPos.current.x;
      const dy = y - lastPos.current.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > 18) {
        popWord(x, y);
        lastPos.current = { x, y };
      }
    };

    window.addEventListener("mousemove", moveCursor);
    return () => window.removeEventListener("mousemove", moveCursor);
  }, []);

  const popWord = (x, y) => {
  const randomWord = words[Math.floor(Math.random() * words.length)];
  const randomColor = colors[Math.floor(Math.random() * colors.length)];
  const id = Date.now() + Math.random();

  const offsetX = (Math.random() - 0.5) * 150;
  const offsetY = (Math.random() - 0.5) * 150;

  const newParticle = {
    id,
    text: randomWord,
    x,
    y,
    offsetX,
    offsetY,
    color: randomColor, // 👈 ADD THIS
  };

  setParticles((prev) => [...prev, newParticle]);

  setTimeout(() => {
    setParticles((prev) => prev.filter((p) => p.id !== id));
  }, 900);
};


  return (
    <div style={styles.page}>
      {/* Custom Cursor */}
      <div ref={cursorRef} style={styles.cursor}></div>

      {/* Word Pop Particles */}
      {particles.map((p) => (
        <span
  key={p.id}
  style={{
    ...styles.word,
    left: p.x,
    top: p.y,
    color: p.color, // 👈 USE HERE
    "--x": `${p.offsetX}px`,
    "--y": `${p.offsetY}px`,
  }}
  className="popWord"
>
  {p.text}
</span>

      ))}

    </div>
  );
}

const styles = {

  word: {
    position: "fixed",
    fontSize: "16px",
    fontWeight: "bold",
    transform: "translate(-50%, -50%)",
    pointerEvents: "none",
    zIndex: 9998,
    animation: "popRandom 0.9s ease forwards",
    whiteSpace: "nowrap",
  },

  heading: {
    fontSize: "48px",
    marginBottom: "10px",
  },

  text: {
    fontSize: "18px",
    opacity: 0.7,
  },
};
