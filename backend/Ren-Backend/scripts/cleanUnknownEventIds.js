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

  const events = await Event.find().select("_id").lean();
  const validIds = new Set(events.map((e) => String(e._id)));

  const stats = {
    total: 0,
    updated: 0,
    removedRefs: 0
  };

  const bulk = [];
  const cursor = Student.find({ events: { $exists: true, $ne: [] } })
    .select("_id events")
    .cursor();

  for await (const s of cursor) {
    stats.total += 1;
    const original = Array.isArray(s.events) ? s.events : [];
    const filtered = original.filter((id) => validIds.has(String(id)));
    if (filtered.length !== original.length) {
      stats.removedRefs += original.length - filtered.length;
      stats.updated += 1;
      bulk.push({
        updateOne: {
          filter: { _id: s._id },
          update: { $set: { events: filtered } }
        }
      });
    }

    if (bulk.length >= 500) {
      await Student.bulkWrite(bulk, { ordered: false });
      bulk.length = 0;
    }
  }

  if (bulk.length) {
    await Student.bulkWrite(bulk, { ordered: false });
  }

  console.log("✅ Unknown event IDs removed", stats);
  await mongoose.disconnect();
};

run().catch((err) => {
  console.error("❌ Cleanup failed:", err);
  process.exit(1);
});
