import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import mongoose from "mongoose";
import ExcelJS from "exceljs";
import Student from "../models/student.js";
import Event from "../models/event.js";

dotenv.config();

const uri =
  process.env.MONGO_URI ||
  process.env.MONGODB_URI ||
  process.env.DB_URI ||
  process.env.DATABASE_URL;

if (!uri) {
  console.error("❌ Missing MONGO_URI/MONGODB_URI/DB_URI in environment.");
  process.exit(1);
}

const downloadsDir =
  process.env.RESTORE_EXCEL_DIR || "C:\\\\Users\\\\Vanshika\\\\Downloads";

const normalizeTitle = (title) =>
  String(title || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "");

const shouldSkipSheet = (name) => {
  const n = String(name || "").toLowerCase();
  return n.includes("unknown events");
};

const findEmailColumn = (row) => {
  let emailCol = null;
  row.eachCell((cell, col) => {
    const v = cell.text || cell.value;
    if (!v) return;
    const header = String(v).toLowerCase().replace(/\s|_|-/g, "");
    if (header.includes("email")) emailCol = col;
  });
  return emailCol;
};

const findEventsColumn = (row) => {
  let eventsCol = null;
  row.eachCell((cell, col) => {
    const v = cell.text || cell.value;
    if (!v) return;
    const header = String(v).toLowerCase().replace(/\s|_|-/g, "");
    if (header.includes("events")) eventsCol = col;
  });
  return eventsCol;
};

const buildEventMap = async () => {
  const events = await Event.find().select("_id title").lean();
  const titleToId = new Map();
  const normToTitle = new Map();
  const ambiguous = new Set();

  for (const e of events) {
    const norm = normalizeTitle(e.title);
    if (titleToId.has(norm) && titleToId.get(norm) !== String(e._id)) {
      ambiguous.add(norm);
    } else {
      titleToId.set(norm, String(e._id));
      normToTitle.set(norm, e.title);
    }
  }

  // Remove ambiguous
  for (const n of ambiguous) {
    titleToId.delete(n);
  }

  return { titleToId, normToTitle, ambiguous };
};

const matchEventId = (sheetName, titleToId, normToTitle) => {
  const norm = normalizeTitle(sheetName);
  if (!norm) return null;
  if (titleToId.has(norm)) return titleToId.get(norm);

  const candidates = [];
  for (const [eventNorm, eventId] of titleToId.entries()) {
    if (eventNorm.startsWith(norm) || norm.startsWith(eventNorm)) {
      candidates.push(eventId);
    }
  }
  if (candidates.length === 1) return candidates[0];
  return null;
};

const collectExcelFiles = () => {
  const all = fs.readdirSync(downloadsDir)
    .filter((f) => f.toLowerCase().endsWith(".xlsx"))
    .map((f) => path.join(downloadsDir, f));
  return all;
};

const run = async () => {
  await mongoose.connect(uri, { autoIndex: false });

  const { titleToId, normToTitle, ambiguous } = await buildEventMap();

  const files = collectExcelFiles();
  const eventToEmails = new Map();
  const emailToEvents = new Map();
  const skippedSheets = [];
  const matchedSheets = [];
  let masterRowsParsed = 0;

  for (const filePath of files) {
    const workbook = new ExcelJS.Workbook();
    try {
      await workbook.xlsx.readFile(filePath);
    } catch (err) {
      continue;
    }

    workbook.eachSheet((sheet) => {
      const sheetName = sheet.name || "";
      if (shouldSkipSheet(sheetName)) return;

      let headerRowIndex = null;
      let emailCol = null;
      let eventsCol = null;
      const maxScan = Math.min(10, sheet.rowCount || 10);
      for (let r = 1; r <= maxScan; r++) {
        const row = sheet.getRow(r);
        const col = findEmailColumn(row);
        const evCol = findEventsColumn(row);
        if (col) {
          headerRowIndex = r;
          emailCol = col;
          eventsCol = evCol;
          break;
        }
      }
      if (!headerRowIndex || !emailCol) return;

      matchedSheets.push({ sheet: sheetName, file: path.basename(filePath) });

      // If this is a master-style sheet (has Events column), parse by email -> events list
      if (eventsCol) {
        for (let r = headerRowIndex + 1; r <= sheet.rowCount; r++) {
          const row = sheet.getRow(r);
          const emailCell = row.getCell(emailCol);
          const eventsCell = row.getCell(eventsCol);
          const rawEmail = emailCell?.text || emailCell?.value;
          const rawEvents = eventsCell?.text || eventsCell?.value;
          if (!rawEmail || !rawEvents) continue;
          const email = String(rawEmail).trim().toLowerCase();
          if (!email.includes("@")) continue;
          const eventsStr = String(rawEvents);
          const parts = eventsStr
            .split(/[,;\n]/g)
            .map((p) => p.trim())
            .filter(Boolean);
          if (!parts.length) continue;
          masterRowsParsed += 1;
          if (!emailToEvents.has(email)) emailToEvents.set(email, new Set());
          const set = emailToEvents.get(email);
          for (const title of parts) {
            if (/^unknown\\(/i.test(title)) continue;
            const norm = normalizeTitle(title);
            if (!norm) continue;
            if (!titleToId.has(norm)) continue;
            set.add(titleToId.get(norm));
          }
        }
        return;
      }

      const eventId = matchEventId(sheetName, titleToId, normToTitle);
      if (!eventId) {
        skippedSheets.push({ sheet: sheetName, file: path.basename(filePath) });
        return;
      }

      for (let r = headerRowIndex + 1; r <= sheet.rowCount; r++) {
        const row = sheet.getRow(r);
        const cell = row.getCell(emailCol);
        const raw = cell?.text || cell?.value;
        if (!raw) continue;
        const email = String(raw).trim().toLowerCase();
        if (!email.includes("@")) continue;
        if (!eventToEmails.has(eventId)) eventToEmails.set(eventId, new Set());
        eventToEmails.get(eventId).add(email);
      }
    });
  }

  let totalAdded = 0;
  let totalStudentsMatched = 0;
  let totalStudentsUpdated = 0;

  // First, apply updates from master-style sheets
  for (const [email, eventSet] of emailToEvents.entries()) {
    const eventIds = Array.from(eventSet);
    if (!eventIds.length) continue;
    totalAdded += 1;
    const res = await Student.updateOne(
      { email },
      { $addToSet: { events: { $each: eventIds } } }
    );
    totalStudentsMatched += res.matchedCount || 0;
    totalStudentsUpdated += res.modifiedCount || 0;
  }

  // Then apply event-sheet updates (event -> emails)
  for (const [eventId, emailSet] of eventToEmails.entries()) {
    const emails = Array.from(emailSet);
    for (let i = 0; i < emails.length; i += 500) {
      const chunk = emails.slice(i, i + 500);
      const res = await Student.updateMany(
        { email: { $in: chunk } },
        { $addToSet: { events: eventId } }
      );
      totalStudentsMatched += res.matchedCount || 0;
      totalStudentsUpdated += res.modifiedCount || 0;
    }
    totalAdded += emails.length;
  }

  console.log("✅ Excel restore complete");
  console.log({
    filesScanned: files.length,
    sheetsMatched: matchedSheets.length,
    sheetsSkipped: skippedSheets.length,
    uniqueEmailsCollected: totalAdded,
    studentsMatched: totalStudentsMatched,
    studentsUpdated: totalStudentsUpdated,
    masterRowsParsed
  });

  if (skippedSheets.length) {
    console.log("⚠️ Skipped sheets (no matching event title):");
    skippedSheets.slice(0, 25).forEach((s) =>
      console.log(`- ${s.sheet} (${s.file})`)
    );
  }

  if (ambiguous.size) {
    console.log("⚠️ Ambiguous event titles (skipped):", Array.from(ambiguous));
  }

  await mongoose.disconnect();
};

run().catch((err) => {
  console.error("❌ Restore failed:", err);
  process.exit(1);
});
