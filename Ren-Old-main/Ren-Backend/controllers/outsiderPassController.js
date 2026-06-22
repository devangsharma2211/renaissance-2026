import ExcelJS from "exceljs";
import fs from "fs";
import mongoose from "mongoose";
import OutsiderPass from "../models/OutsiderPass.js";
import FestivalDay from "../models/FestivalDay.js";
import { normalizeExcel } from "../utils/excelNormalizer.js";
import { generateOutsiderEventTicket, generateOutsiderTicket } from "../utils/sendPassToOutsider.js";

// HELPERS

// normalize column headers
const normalize = (str) =>
  str.toLowerCase().replace(/\s|_|-/g, "");

// auto-detect column key
const findKey = (obj, possibleKeys) => {
  const keys = Object.keys(obj);
  for (const key of keys) {
    if (possibleKeys.includes(normalize(key))) {
      return key;
    }
  }
  return null;
};

// ---------------- DAYS PARSER ----------------
const parseDays = (input) => {
  if (input === null || input === undefined) return [];

  // If it's an actual number, accept directly
  if (typeof input === 'number') {
    const n = Math.floor(input);
    return n >= 1 && n <= 9 ? [n] : [];
  }

  const raw = String(input).trim().toLowerCase();
  if (!raw) return [];

  // If 'all' specified
  if (raw.includes('all')) return [1, 2, 3];

  const days = new Set();

  // Normalize separators: commas, semicolons, slashes, spaces -> single space
  const tokens = raw.replace(/[;,\/]+/g, ' ').split(/\s+/).map(t => t.trim()).filter(Boolean);

  for (const t of tokens) {
    // Range like 1-3
    const rangeMatch = t.match(/^(\d+)\s*-\s*(\d+)$/);
    if (rangeMatch) {
      const start = parseInt(rangeMatch[1], 10);
      const end = parseInt(rangeMatch[2], 10);
      for (let d = Math.max(1, start); d <= Math.min(9, end); d++) days.add(d);
      continue;
    }

    // Extract all numbers from token (handles '1', '1,2', etc.)
    const nums = t.match(/\d+/g);
    if (nums) {
      for (const numStr of nums) {
        const n = parseInt(numStr, 10);
        if (n >= 1 && n <= 9) days.add(n);
      }
      continue;
    }

    // Map words
    if (t.includes('one') || t.includes('1st')) days.add(1);
    if (t.includes('two') || t.includes('2nd')) days.add(2);
    if (t.includes('three') || t.includes('3rd')) days.add(3);
  }

  return Array.from(days).sort();
};

// ---------------- PHONE NORMALIZER ----------------
const normalizePhone = (input) => {
  if (!input) return "";
  return input.toString().replace(/\D/g, "").slice(-10);
};

const splitParticipants = (value) => {
  if (!value) return [];
  const raw = String(value).trim();
  if (!raw) return [];
  const lower = raw.toLowerCase();
  if (["solo", "single"].includes(lower)) return ["1"];
  const numeric = raw.match(/^\d+$/);
  if (numeric) return [raw];
  return raw
    .split(/,|&|\/|;|\+| and /i)
    .map((s) => s.trim())
    .filter(Boolean);
};

const computeParticipantsCount = (nameValue, participantsValue) => {
  if (participantsValue !== undefined && participantsValue !== null && String(participantsValue).trim() !== "") {
    const parts = splitParticipants(participantsValue);
    if (parts.length === 1 && /^\d+$/.test(parts[0])) return parseInt(parts[0], 10);
    return parts.length || 1;
  }
  const nameParts = splitParticipants(nameValue);
  if (nameParts.length === 1 && /^\d+$/.test(nameParts[0])) return parseInt(nameParts[0], 10);
  return nameParts.length || 1;
};

const isObjectId = (value) => mongoose.Types.ObjectId.isValid(String(value || ""));

const extractLookupFromPayload = (raw) => {
  const result = {
    passId: null,
    outsiderId: null,
    qrToken: null,
    email: null,
    phone: null
  };

  if (!raw) return result;

  // If already an object
  if (typeof raw === "object") {
    const obj = raw;
    result.passId = obj.passId || obj.id || null;
    result.outsiderId = obj.outsiderId || null;
    result.qrToken = obj.qrToken || obj.token || null;
    result.email = obj.email || null;
    result.phone = obj.phone || null;
    return result;
  }

  const str = String(raw).trim();
  if (!str) return result;

  // Try JSON
  if (str.startsWith("{") || str.startsWith("[")) {
    try {
      const obj = JSON.parse(str);
      return extractLookupFromPayload(obj);
    } catch (e) {
      // fall through
    }
  }

  // Try to extract passId/outsiderId from embedded string
  const passIdMatch = str.match(/passId["'\s:]+([a-f0-9]{24})/i);
  if (passIdMatch) result.passId = passIdMatch[1];
  const outsiderIdMatch = str.match(/outsiderId["'\s:]+([a-f0-9]{24})/i);
  if (outsiderIdMatch) result.outsiderId = outsiderIdMatch[1];
  const emailMatch = str.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  if (emailMatch) result.email = emailMatch[0].toLowerCase();
  const phoneMatch = str.match(/\b\d{10}\b/);
  if (phoneMatch) result.phone = phoneMatch[0];

  if (isObjectId(str)) {
    result.passId = result.passId || str;
  } else {
    result.qrToken = result.qrToken || str;
  }

  return result;
};

// EXCEL UPLOAD CONTROLLER
const handleOutsiderUpload = async (req, res, options) => {
  const {
    passType = "MASTER",
    ticketGenerator = generateOutsiderTicket
  } = options || {};

  try {
    if (!req.file) {
      return res.status(400).json({ message: "Excel file required" });
    }

    const { rows, errors: parseErrors, sheets } =
      await normalizeExcel(req.file.path);

    console.log(`Outsider upload: parsed ${rows.length} rows from ${sheets.length} sheets`);
    if (rows && rows.length) console.log('Sample parsed rows:', rows.slice(0, 5).map(r => r.data));

    // If no rows parsed, return helpful diagnostics to the client
    if (!rows || rows.length === 0) {
      // clean up uploaded file
      try { fs.unlinkSync(req.file.path); } catch (e) {}
      return res.status(400).json({
        success: false,
        message: "No rows parsed from the uploaded file. Check headers and sheet contents.",
        sheets,
        parseErrors
      });
    }

    const inserted = [];
    const skipped = [];
    const duplicateSkipped = [];

    // Build documents to insert with deduplication
    const docsToInsert = [];
    const seenDuplicates = new Set(); // Track duplicates within same batch

    for (const record of rows) {
      const { sheet, row, data } = record;
      const { name, email, phone, days, eventName, participants } = data;

      const normalizedName = name ? String(name).trim() : "";
      const normalizedEmail = email ? String(email).trim().toLowerCase() : null;
      const normalizedPhone = normalizePhone(phone) || null;
      const normalizedEventName = eventName ? String(eventName).trim() : "";
      const normalizedParticipants = participants ? String(participants).trim() : "";

      const validDays = days ? parseDays(days) : [];

      const dupeKey = normalizedEmail || normalizedPhone;

      // ---- DUPLICATE DETECTION (WITHIN BATCH) ----
      if (dupeKey) {
        if (seenDuplicates.has(dupeKey)) {
          duplicateSkipped.push({ sheet, row, reason: "Duplicate in batch (email/phone already exists)" });
          continue;
        }
        seenDuplicates.add(dupeKey);
      }

      const participantsCount = computeParticipantsCount(normalizedName, normalizedParticipants);

      const doc = {
        name: normalizedName,
        email: normalizedEmail,
        phone: normalizedPhone,
        Day1: validDays.includes(1),
        Day2: validDays.includes(2),
        Day3: validDays.includes(3),
        passType,
        participants: normalizedParticipants || undefined,
        participantsCount
      };

      if (normalizedEventName) doc.eventName = normalizedEventName;

      docsToInsert.push(doc);
    }

    // Check for existing duplicates in database before inserting
    const existingEmails = docsToInsert.map(d => d.email).filter(e => e);
    const existingPhones = docsToInsert.map(d => d.phone).filter(p => p);

    const existingOutsiders = await OutsiderPass.find({
      $or: [
        { email: { $in: existingEmails } },
        { phone: { $in: existingPhones } }
      ]
    }).select('email phone');

    const existingSet = new Set();
    for (const outsider of existingOutsiders) {
      if (outsider.email) existingSet.add(outsider.email.toLowerCase());
      if (outsider.phone) existingSet.add(outsider.phone);
    }

    // Filter out docs that already exist in database
    const finalDocsToInsert = [];
    for (const doc of docsToInsert) {
      const matchKey = doc.email?.toLowerCase() || doc.phone;
      if (existingSet.has(matchKey)) {
        duplicateSkipped.push({
          email: doc.email,
          phone: doc.phone,
          eventName: doc.eventName,
          reason: "Already exists in database"
        });
      } else {
        finalDocsToInsert.push(doc);
      }
    }

    // Insert in batches using insertMany for performance and resilience
    const BATCH = 500; // tuneable
    for (let i = 0; i < finalDocsToInsert.length; i += BATCH) {
      const batch = finalDocsToInsert.slice(i, i + BATCH);
      try {
        const resInsert = await OutsiderPass.insertMany(batch, { ordered: false });
        console.log(`Batch insert: inserted ${resInsert.length} documents`);
        inserted.push(...resInsert);
      } catch (err) {
        // insertMany with ordered:false will continue; we still want to collect inserted docs if available
        if (err && err.insertedDocs && err.insertedDocs.length) {
          console.log(`Partial insert: inserted ${err.insertedDocs.length} documents before error`);
          inserted.push(...err.insertedDocs);
        }
        console.error('Partial insert error for outsider batch:', err.message || err);
      }
    }

    // Schedule ticket generation asynchronously in small concurrency-controlled batches
    const sendInBatches = async (items, handler, batchSize = 10) => {
      for (let j = 0; j < items.length; j += batchSize) {
        const slice = items.slice(j, j + batchSize);
        await Promise.all(slice.map((it) => handler(it).catch((e) => console.error('Ticket send error:', e))));
      }
    };

    // Fire-and-forget: do not block response on email sending
    setImmediate(() => {
      sendInBatches(inserted, async (outsiderDoc) => {
        await ticketGenerator(outsiderDoc);
      }, 10).catch(e => console.error('Error sending outsider tickets:', e));
    });

    fs.unlinkSync(req.file.path);

    return res.status(200).json({
      success: true,
      summary: {
        totalRows: rows.length,
        inserted: inserted.length,
        skipped: skipped.length,
        duplicateSkipped: duplicateSkipped.length,
        totalSkipped: skipped.length + duplicateSkipped.length
      },
      sheets,
      skipped: skipped.slice(0, 100),
      duplicates: duplicateSkipped.slice(0, 100),
      parseErrors
    });

  } catch (err) {
    console.error("Outsider upload error:", err);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    return res.status(500).json({ message: "Upload failed" });
  }
};

export const uploadOutsiderExcel = (req, res) =>
  handleOutsiderUpload(req, res, {
    requireEventName: false,
    passType: "MASTER",
    ticketGenerator: generateOutsiderTicket
  });

export const uploadOutsiderEventExcel = (req, res) =>
  handleOutsiderUpload(req, res, {
    passType: "EVENT",
    ticketGenerator: generateOutsiderEventTicket
  });

// MANUAL OUTSIDER CREATE
export const createOutsiderManual = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      Day1,
      Day2,
      Day3,
      days,
      eventName,
      participants
    } = req.body || {};

    const normalizedName = name ? String(name).trim() : "";
    const normalizedEmail = email ? String(email).trim().toLowerCase() : null;
    const normalizedPhone = normalizePhone(phone) || null;
    const normalizedEventName = eventName ? String(eventName).trim() : "";
    const normalizedParticipants = participants ? String(participants).trim() : "";

    if (!normalizedName && !normalizedEmail && !normalizedPhone) {
      return res.status(400).json({ message: "Provide at least name, email, or phone." });
    }

    // Dedupe by email/phone when available
    if (normalizedEmail || normalizedPhone) {
      const existing = await OutsiderPass.findOne({
        $or: [
          normalizedEmail ? { email: normalizedEmail } : null,
          normalizedPhone ? { phone: normalizedPhone } : null
        ].filter(Boolean)
      });
      if (existing) {
        return res.status(409).json({ message: "Outsider already exists." });
      }
    }

    const validDays = days ? parseDays(days) : [];
    const dayFlags = {
      Day1: validDays.includes(1) || !!Day1,
      Day2: validDays.includes(2) || !!Day2,
      Day3: validDays.includes(3) || !!Day3
    };

    const passType = normalizedEventName ? "EVENT" : "MASTER";

    const participantsCount = computeParticipantsCount(normalizedName, normalizedParticipants);

    const doc = {
      name: normalizedName,
      email: normalizedEmail,
      phone: normalizedPhone,
      ...dayFlags,
      passType,
      participants: normalizedParticipants || undefined,
      participantsCount
    };
    if (normalizedEventName) doc.eventName = normalizedEventName;

    const outsider = await OutsiderPass.create(doc);

    setImmediate(() => {
      const generator = passType === "EVENT" ? generateOutsiderEventTicket : generateOutsiderTicket;
      generator(outsider).catch((e) => console.error("Manual outsider ticket error:", e));
    });

    return res.status(201).json({ success: true, data: outsider });
  } catch (err) {
    console.error("Manual outsider create error:", err);
    return res.status(500).json({ message: "Failed to create outsider." });
  }
};

// GET ALL OUTSIDERS CONTROLLER
export const getAllOutsiders = async (req, res) => {
  try {
    const outsiders = await OutsiderPass.find().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: outsiders
    });
  } catch (err) {
    console.error("Fetch outsiders error:", err);
    return res.status(500).json({
      success: false,
      msg: "Failed to fetch outsiders"
    });
  }
};


// SCAN VERIFICATION (OUTSIDER)


export const verifyOutsiderPass = async (passId) => {
  const lookup = extractLookupFromPayload(passId);

  let pass = null;
  if (lookup.passId && isObjectId(lookup.passId)) {
    pass = await OutsiderPass.findById(lookup.passId);
  }
  if (!pass && lookup.outsiderId && isObjectId(lookup.outsiderId)) {
    pass = await OutsiderPass.findById(lookup.outsiderId);
  }
  if (!pass && lookup.qrToken) {
    pass = await OutsiderPass.findOne({ qrToken: lookup.qrToken });
  }
  if (!pass && lookup.email) {
    pass = await OutsiderPass.findOne({ email: lookup.email.toLowerCase() });
  }
  if (!pass && lookup.phone) {
    pass = await OutsiderPass.findOne({ phone: lookup.phone });
  }

  if (!pass) {
    return { valid: false, status: 404, msg: "Invalid pass" };
  }

  // Resolve today's festival day
  const today = new Date().toLocaleDateString('en-CA'); 
  const festDay = await FestivalDay.findOne({ date: today });

  if (!festDay) {
    return { valid: false, status: 403, msg: "Festival not active today" };
  }

  // Check if outsider is allowed today using Day1/Day2/Day3 flags
  const dayNum = festDay.day;
  const validField = dayNum === 1 ? 'Day1' : dayNum === 2 ? 'Day2' : 'Day3';
  const attendedField = dayNum === 1 ? 'attendedDay1' : dayNum === 2 ? 'attendedDay2' : 'attendedDay3';

  if (!pass[validField]) {
    return { valid: false, status: 403, msg: 'Pass not valid for today' };
  }

  // Already scanned check
  if (pass[attendedField]) {
    return {
      valid: false,
      status: 409,
      msg: `Already scanned for Day ${festDay.day}`,
      name: pass.name,
      phone: pass.phone,
      day: festDay.day
    };
  }

  // Mark attendance
  pass[attendedField] = true;
  await pass.save();

  return {
    valid: true,
    status: 200,
    msg: `Attendance marked for Day ${festDay.day}`,
    name: pass.name,
    phone: pass.phone,
    day: festDay.day
  };
};


//LIST OUTSIDERS CONTROLLER

export const listOutsiders = async (req, res) => {
  try {
    const outsiders = await OutsiderPass.find().sort({ createdAt: -1 });
    
    // OUTSIDER TICKET COUNT: Count outsiders with valid days (Day1, Day2, or Day3)
    const ticketCount = outsiders.filter(o => o.Day1 || o.Day2 || o.Day3).length;
    
    res.status(200).json({
      success: true,
      count: outsiders.length,
      ticketCount, // Count of outsiders with valid day passes
      data: outsiders
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch outsiders" });
  }
};

