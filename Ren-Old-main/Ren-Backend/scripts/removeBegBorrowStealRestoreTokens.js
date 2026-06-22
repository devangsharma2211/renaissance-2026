import dotenv from "dotenv";
import mongoose from "mongoose";
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

const run = async () => {
  await mongoose.connect(uri, { autoIndex: false });

  const event = await Event.findOne({
    title: { $regex: /^beg\s*borrow\s*steal$/i }
  }).select("_id title");

  if (!event) {
    console.error("❌ BEG BORROW STEAL event not found.");
    process.exit(1);
  }

  const eventId = String(event._id);

  const stats = {
    matched: 0,
    removed: 0,
    tokensRestored: 0,
    updated: 0
  };

  const bulk = [];
  const cursor = Student.find({ events: eventId })
    .select("_id events token isPaid")
    .cursor();

  for await (const s of cursor) {
    stats.matched += 1;
    const events = Array.isArray(s.events) ? s.events.map(String) : [];
    const filtered = events.filter((id) => id !== eventId);
    const removedCount = events.length - filtered.length;
    if (removedCount > 0) stats.removed += removedCount;

    const update = { events: filtered };
    if (s.isPaid) {
      const current = Number(s.token ?? 0);
      const restored = Math.min(4, current + 1);
      if (restored !== current) {
        update.token = restored;
        stats.tokensRestored += 1;
      }
    }

    bulk.push({
      updateOne: {
        filter: { _id: s._id },
        update: { $set: update }
      }
    });

    if (bulk.length >= 500) {
      await Student.bulkWrite(bulk, { ordered: false });
      stats.updated += bulk.length;
      bulk.length = 0;
    }
  }

  if (bulk.length) {
    await Student.bulkWrite(bulk, { ordered: false });
    stats.updated += bulk.length;
  }

  console.log("✅ Beg Borrow Steal cleanup complete", stats);
  await mongoose.disconnect();
};

run().catch((err) => {
  console.error("❌ Script failed:", err);
  process.exit(1);
});
