import { createCanvas, registerFont, Image } from "canvas";
import sharp from "sharp";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// ---------------- ES MODULE __dirname ----------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---------------- FIXED CANVAS SIZE (SAME FEEL AS MASTER PASS) ----------------
const WIDTH = 5880;
const HEIGHT = 2209;

// ---------------- REGISTER FONT ----------------
const fontPath = path.join(
  __dirname,
  "../fonts/Bebas_Neue/BebasNeue-Regular.ttf"
);

if (fs.existsSync(fontPath)) {
  registerFont(fontPath, { family: "Bebas Neue" });
}

console.log("Font exists:", fs.existsSync(fontPath), fontPath);

// ---------------- MAIN FUNCTION ----------------
async function generatePass(student, event) {
  const templatePath = path.join(
    __dirname,
    "../images/ren2026eventpass.png"
  );

  // Ensure template exists
  if (!fs.existsSync(templatePath)) {
    throw new Error("Event pass template not found");
  }

  // ---------------- CREATE CANVAS ----------------
  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext("2d");

  // ---------------- DRAW BACKGROUND ----------------
  const bgBuffer = fs.readFileSync(templatePath);
  const bgImage = new Image();
  bgImage.src = bgBuffer;

  ctx.drawImage(bgImage, 0, 0, WIDTH, HEIGHT);

  // ---------------- TEXT STYLING ----------------
  ctx.fillStyle = "#1f2937";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";

  // ---------------- AUTO-FIT + WRAP TEXT ----------------
  const buildLines = (text, fontFamily, fontSize, maxWidth) => {
    ctx.font = `${fontSize}px "${fontFamily}"`;
    const words = String(text).split(/\s+/).filter(Boolean);
    const lines = [];
    let line = "";

    for (const word of words) {
      const testLine = line ? `${line} ${word}` : word;
      if (ctx.measureText(testLine).width <= maxWidth) {
        line = testLine;
        continue;
      }

      if (line) {
        lines.push(line);
        line = word;
        continue;
      }

      // Single word too long: hard-break by characters
      let chunk = "";
      for (const ch of word) {
        const testChunk = chunk + ch;
        if (ctx.measureText(testChunk).width <= maxWidth) {
          chunk = testChunk;
        } else {
          if (chunk) lines.push(chunk);
          chunk = ch;
        }
      }
      line = chunk;
    }

    if (line) lines.push(line);
    return lines;
  };

  const drawFittedText = (
    text,
    fontFamily,
    maxWidth,
    maxFont = 170,
    minFont = 40,
    maxLines = 2,
    lineGap = 6
  ) => {
    let size = maxFont;
    let lines = [];
    while (size >= minFont) {
      lines = buildLines(text, fontFamily, size, maxWidth);
      if (lines.length <= maxLines) break;
      size -= 2;
    }
    if (!lines.length) {
      lines = [String(text)];
      size = minFont;
    }

    ctx.font = `${size}px "${fontFamily}"`;
    const lineHeight = Math.round(size * 1.15);
    for (const line of lines) {
      ctx.fillText(line, textX, textY);
      textY += lineHeight + lineGap;
    }
  };

  // ---------------- TEXT ZONE (RIGHT SIDE – SAME AS MASTER PASS STYLE) ----------------
  const textX = 2660;
  let textY = 1000;
  const rightMargin = 380;
  const maxTextWidth = WIDTH - textX - rightMargin;

  // ---------------- STUDENT NAME ----------------
  const studentName = String("Name: " + (student.name || "")).toUpperCase();
  drawFittedText(studentName, "Bebas Neue", maxTextWidth, 170, 60, 2, 8);

  // ---------------- EVENT TITLE ----------------
  const eventTitle = String("Event: " + (event.title || "")).toUpperCase();
  drawFittedText(eventTitle, "Bebas Neue", maxTextWidth, 170, 60, 2, 8);

  // ---------------- EVENT DATE ----------------
  const eventDate = String("Date: " + (event.date || "")).toUpperCase();
  drawFittedText(eventDate, "Bebas Neue", maxTextWidth, 140, 40, 1, 6);

  // ---------------- EVENT TIME ----------------
  const eventTime = String("Time: " + (event.time || "")).toUpperCase();
  drawFittedText(eventTime, "Bebas Neue", maxTextWidth, 140, 40, 1, 6);

  // ---------------- EVENT VENUE ----------------
  const eventVenue = String("Venue: " + (event.venue || "")).toUpperCase();
  drawFittedText(eventVenue, "Bebas Neue", maxTextWidth, 140, 40, 2, 6);

  // ---------------- FINAL IMAGE BUFFER ----------------
  return canvas.toBuffer("image/png");
}

export default generatePass;
