import path from "path";
import fs from "fs/promises";
import { createCanvas, Image, registerFont } from "canvas";
import crypto from 'crypto';
import sharp from "sharp";
import { generateQRCode } from "./teacher/qrgen.js";
import awssendEmail from "./awsSendEmail.js";
import enqueueEmail from "./emailQueue.js";
import OutsiderPass from "../models/OutsiderPass.js";

// Use same ticket canvas dimensions as teacher QR generator to ensure alignment
const WIDTH = 5880;
const HEIGHT = 2209;

// Module-level initialisation: cache static assets and register fonts once
let cachedBgImage = null;
let primaryFont = 'Sans';
(async function moduleInit() {
  try {
    const ticketPath = path.join(process.cwd(), "images/ren2026masterpass.png");
    const font1 = path.join(process.cwd(), "fonts/Merienda/Merienda-regular.ttf");
    const font2 = path.join(process.cwd(), "fonts/Bebas_Neue/BebasNeue-Regular.ttf");

    try { await fs.access(ticketPath); }
    catch (e) { console.warn('Ticket background not found at images/ren2026masterpass.png'); }

    try {
      // register fonts if available
      try { await fs.access(font1); registerFont(font1, { family: 'Merienda' }); } catch (e) {}
      try { await fs.access(font2); registerFont(font2, { family: 'Bebas_Neue' }); registerFont(font2, { family: 'Bebas Neue' }); primaryFont = 'Bebas Neue'; } catch (e) {}

      if (primaryFont === 'Sans') {
        // prefer Merienda if Bebas not found
        try { await fs.access(font1); primaryFont = 'Merienda'; } catch (e) {}
      }
    } catch (e) {
      console.warn('Font registration failed in module init:', e.message || e);
    }

    try {
      const bgBuffer = await fs.readFile(path.join(process.cwd(), "images/ren2026masterpass.png"));
      const img = new Image(); img.src = bgBuffer; cachedBgImage = img;
    } catch (e) {
      console.warn('Failed to load background image into cache:', e.message || e);
    }

    console.log('Module init: primaryFont ->', primaryFont);
  } catch (e) {
    console.warn('Module init error:', e);
  }
})();

async function generateOutsiderTicketInternal(outsider, mode = "MASTER") {
  try {
    //Ensure pass exists
    let pass = await OutsiderPass.findById(outsider._id);
    if (!pass) throw new Error("Outsider pass not found");

    const isEventPass = mode === "EVENT";

    const participantCount = typeof pass.participantsCount === "number"
      ? pass.participantsCount
      : (() => {
          const raw = pass.participants || pass.name || "";
          const parts = String(raw)
            .split(/,|&|\/|;|\+| and /i)
            .map((s) => s.trim())
            .filter(Boolean);
          if (parts.length === 1 && /^\d+$/.test(parts[0])) return parseInt(parts[0], 10);
          return parts.length || 1;
        })();

    //QR payload - include valid days for scanning validation
    const validDays = [];
    if (pass.Day1) validDays.push(1);
    if (pass.Day2) validDays.push(2);
    if (pass.Day3) validDays.push(3);

    const qrPayload = JSON.stringify({
      passId: pass._id.toString(),
      type: isEventPass ? "OUTSIDER_EVENT" : "OUTSIDER_MASTER",
      name: pass.name,
      phone: pass.phone || "",
      days: validDays,
      validDays,
      participantsCount: participantCount,
      ...(isEventPass ? { eventName: pass.eventName || "" } : { email: pass.email || "" })
    });

    const qrBuffer = await generateQRCode(qrPayload);

    //Canvas
    const canvas = createCanvas(WIDTH, HEIGHT);
    const ctx = canvas.getContext("2d");
    if (cachedBgImage) ctx.drawImage(cachedBgImage, 0, 0, WIDTH, HEIGHT);
    else {
      const ticketPath = path.join(process.cwd(), "images/ren2026masterpass.png");
      const bgBuffer = await fs.readFile(ticketPath);
      const bgImage = new Image(); bgImage.src = bgBuffer;
      ctx.drawImage(bgImage, 0, 0, WIDTH, HEIGHT);
    }

    // ─── QR ZONE ─── (aligned with teacher tickets)
    const qrSize = 1600;
    // Use relative positions if canvas size differs; these numbers match teacher generator layout
    const qrX = 338;
    const qrY = (HEIGHT - qrSize) / 2;

    const resizedQR = await sharp(qrBuffer).resize(qrSize, qrSize).toBuffer();
    const qrImage = new Image();
    qrImage.src = resizedQR;
    ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);

    // ─── TEXT ZONE ─── (same layout as teacher tickets)
    const textX = 2660;
    let textY = 1000;

    ctx.fillStyle = "#223041";
    ctx.textAlign = "left";

    // Helper to fit font size within max width
    const fitFontSize = (text, fontFamily, maxWidth, maxSize = 190, minSize = 40) => {
      let size = maxSize;
      ctx.font = `${size}px ${fontFamily}`;
      while (ctx.measureText(text).width > maxWidth && size > minSize) {
        size -= 2;
        ctx.font = `${size}px ${fontFamily}`;
      }
      return size;
    };

    const rightMargin = 380;
    const maxTextWidth = WIDTH - textX - rightMargin;

    // Name + participants
    const nameText = `NAME: ${pass.name.toUpperCase()} (P: ${participantCount})`;
    const nameSize = fitFontSize(nameText, primaryFont, maxTextWidth, 190, 60);
    ctx.font = `${nameSize}px ${primaryFont}`;
    ctx.fillText(nameText, textX, textY);
    textY += Math.round(nameSize * 1.2) + 10;

    // Email or Event Name
    const infoLabel = isEventPass ? "EVENT" : "EMAIL";
    const infoValue = isEventPass ? (pass.eventName || "") : (pass.email || "");
    const infoText = `${infoLabel}: ${infoValue}`;
    const infoSize = fitFontSize(infoText, primaryFont, maxTextWidth, 140, 36);
    ctx.font = `${infoSize}px ${primaryFont}`;
    ctx.fillText(infoText, textX, textY);
    textY += Math.round(infoSize * 1.2) + 8;

    // Phone
    const phoneText = `PHONE: ${pass.phone || ''}`;
    const phoneSize = fitFontSize(phoneText, primaryFont, maxTextWidth, 140, 36);
    ctx.font = `${phoneSize}px ${primaryFont}`;
    ctx.fillText(phoneText, textX, textY);
    textY += Math.round(phoneSize * 1.2) + 8;

    const days = [];
    if (pass.Day1) days.push("DAY 1");
    if (pass.Day2) days.push("DAY 2");
    if (pass.Day3) days.push("DAY 3");

    const daysText = `DAYS: ${days.join(", ")}`;
    const daysSize = fitFontSize(daysText, primaryFont, maxTextWidth, 140, 36);
    ctx.font = `${daysSize}px ${primaryFont}`;
    ctx.fillText(daysText, textX, textY);

    // Final image: compress + resize to reduce email size (no visual change at normal view)
    const rawImageBuffer = canvas.toBuffer("image/png");
    // Resize to 25% and convert to JPEG for much smaller attachments
    const optimizedBuffer = await sharp(rawImageBuffer).resize(Math.round(WIDTH / 4)).jpeg({ quality: 85 }).toBuffer();

    // Email
    const emailHTML = `
      <div style="font-family:Arial;padding:20px">
        <p>Hi ${pass.name},</p>

        <p>Thanks for signing up for JECRC’s National Techno-Cultural Fest — <strong>Renaissance 2026</strong> 🎉</p>
        <p>You’re officially on the list, and trust us—you don’t want to miss this.</p>

        <p>Visit the official fest site: <a href="https://jecrcrenaissance.co.in">jecrcrenaissance.co.in</a></p>

        <p><b>Valid Days:</b> ${days.join(", ")}</p>

        <p>Got questions or need help? Just hit us up we’re here at our insta handle @jecrcrenaissance.</p>

        <p>Get ready to vibe, build, and celebrate ✨<br/>See you at Renaissance 2026!</p>

        <p>Renaissance,<br/>JECRC</p>
      </div>
    `;

    // Before sending, ensure we don't resend if a ticket was already sent
    if (pass.ticketSent) {
      console.log(`ℹ️ Ticket already sent for outsider ${pass._id}. Skipping email.`);
      return;
    }

    // Generate a unique qrToken and persist it before emailing so re-uploads don't resend
    let token;
    let saved = false;
    for (let attempt = 0; attempt < 5 && !saved; attempt++) {
      token = crypto.randomBytes(12).toString('hex');
      pass.qrToken = token;
      try {
        await pass.save();
        saved = true;
      } catch (e) {
        // handle duplicate token conflict (very unlikely)
        if (e.code === 11000) {
          console.warn('qrToken collision, regenerating token...');
          continue;
        }
        throw e;
      }
    }

    if (!saved) throw new Error('Failed to generate unique qrToken');

    if (pass.email && pass.email.includes("@")) {
      // Use the email queue for throttled/concurrent sending; do not block main flow
      enqueueEmail(async () => {
        try {
          await awssendEmail(
            pass.email,
            "Your Renaissance Festival Pass",
            emailHTML,
            [{ filename: "Renaissance_Pass.jpg", content: optimizedBuffer }]
          );

          // mark as sent (only after actual send to preserve guarantees)
          pass.ticketSent = true;
          await pass.save();
          console.log(`✅ Outsider ticket sent to ${pass.email}`);
        } catch (e) {
          console.error('Failed to send outsider email (queued):', e);
        }
      }).catch(e => console.error('Email queue error:', e));

    } else {
      console.log(`⚠️ Outsider has no valid email (${pass.phone}). Ticket generated but email not sent.`);
    }

  } catch (err) {
    console.error("❌ Outsider ticket error:", err);
    throw err;
  }
}

export async function generateOutsiderTicket(outsider) {
  return generateOutsiderTicketInternal(outsider, "MASTER");
}

export async function generateOutsiderEventTicket(outsider) {
  return generateOutsiderTicketInternal(outsider, "EVENT");
}
