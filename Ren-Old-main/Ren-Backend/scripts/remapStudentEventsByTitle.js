import mongoose from "mongoose";
import dotenv from "dotenv";
import Student from "../models/student.js";
import Event from "../models/event.js";
import Pass from "../models/pass.js";

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

const normalizeTitle = (title) =>
  String(title || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, " ");

const isLikelyObjectId = (value) =>
  /^[a-fA-F0-9]{24}$/.test(String(value || ""));

const run = async () => {
  await mongoose.connect(uri, { autoIndex: false });

  const events = await Event.find().select("_id title").lean();
  const idToTitle = new Map();
  const titleToId = new Map();
  const ambiguousTitles = new Set();

  for (const e of events) {
    const id = String(e._id);
    const norm = normalizeTitle(e.title);
    idToTitle.set(id, norm);

    if (titleToId.has(norm) && titleToId.get(norm) !== id) {
      ambiguousTitles.add(norm);
    } else if (!ambiguousTitles.has(norm)) {
      titleToId.set(norm, id);
    }
  }

  // Remove ambiguous titles from map to avoid wrong remap
  for (const t of ambiguousTitles) {
    titleToId.delete(t);
  }

  const stats = {
    studentsProcessed: 0,
    studentsUpdated: 0,
    studentsUnchanged: 0,
    missingEventId: 0,
    unmappedTitle: 0,
    ambiguousTitle: 0,
    passesUpdated: 0
  };

  const studentBulk = [];

  const studentCursor = Student.find({
    events: { $exists: true, $ne: [] }
  })
    .select("_id events")
    .cursor();

  for await (const s of studentCursor) {
    stats.studentsProcessed += 1;
    const original = Array.isArray(s.events) ? s.events : [];
    const mapped = [];

    for (const ev of original) {
      const evStr = String(ev);
      let titleKey = null;

      if (idToTitle.has(evStr)) {
        titleKey = idToTitle.get(evStr);
      } else if (!isLikelyObjectId(evStr)) {
        titleKey = normalizeTitle(evStr);
      } else {
        stats.missingEventId += 1;
        mapped.push(ev);
        continue;
      }

      if (!titleKey) {
        mapped.push(ev);
        continue;
      }

      if (ambiguousTitles.has(titleKey)) {
        stats.ambiguousTitle += 1;
        mapped.push(ev);
        continue;
      }

      const newId = titleToId.get(titleKey);
      if (!newId) {
        stats.unmappedTitle += 1;
        mapped.push(ev);
        continue;
      }

      mapped.push(newId);
    }

    // de-dupe while preserving order
    const seen = new Set();
    const deduped = mapped.filter((id) => {
      const key = String(id);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const originalStr = original.map((x) => String(x));
    const dedupedStr = deduped.map((x) => String(x));

    const changed =
      originalStr.length !== dedupedStr.length ||
      originalStr.some((v, i) => v !== dedupedStr[i]);

    if (changed) {
      stats.studentsUpdated += 1;
      studentBulk.push({
        updateOne: {
          filter: { _id: s._id },
          update: { $set: { events: deduped } }
        }
      });
    } else {
      stats.studentsUnchanged += 1;
    }

    if (studentBulk.length >= 500) {
      await Student.bulkWrite(studentBulk, { ordered: false });
      studentBulk.length = 0;
    }
  }

  if (studentBulk.length) {
    await Student.bulkWrite(studentBulk, { ordered: false });
  }

  // Update Pass collection too (best-effort)
  const passBulk = [];
  const passCursor = Pass.find().select("_id event").cursor();
  for await (const p of passCursor) {
    const evStr = String(p.event);
    if (!idToTitle.has(evStr)) continue;
    const titleKey = idToTitle.get(evStr);
    if (ambiguousTitles.has(titleKey)) continue;
    const newId = titleToId.get(titleKey);
    if (newId && newId !== evStr) {
      stats.passesUpdated += 1;
      passBulk.push({
        updateOne: {
          filter: { _id: p._id },
          update: { $set: { event: newId } }
        }
      });
    }
    if (passBulk.length >= 1000) {
      await Pass.bulkWrite(passBulk, { ordered: false });
      passBulk.length = 0;
    }
  }

  if (passBulk.length) {
    await Pass.bulkWrite(passBulk, { ordered: false });
  }

  console.log("✅ Remap complete:", stats);
  if (ambiguousTitles.size) {
    console.log("⚠️ Ambiguous titles (skipped):", Array.from(ambiguousTitles));
  }

  await mongoose.disconnect();
};

run().catch((err) => {
  console.error("❌ Remap failed:", err);
  process.exit(1);
});
