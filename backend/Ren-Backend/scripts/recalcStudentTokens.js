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

  const events = await Event.find().select("_id isPaid").lean();
  const eventById = new Map(events.map((e) => [String(e._id), e]));

  const stats = {
    total: 0,
    updated: 0,
    unchanged: 0,
    unknownEventRefs: 0
  };

  const bulk = [];
  const cursor = Student.find().select("_id isPaid token events").cursor();

  for await (const s of cursor) {
    stats.total += 1;
    const baseTokens = s.isPaid ? 4 : 0;
    const eventIds = Array.isArray(s.events) ? s.events : [];
    let freeCount = 0;
    for (const id of eventIds) {
      const ev = eventById.get(String(id));
      if (!ev) {
        stats.unknownEventRefs += 1;
        continue;
      }
      if (ev.isPaid === false) freeCount += 1;
    }
    const desired = Math.max(0, baseTokens - freeCount);
    if ((s.token ?? 0) !== desired) {
      stats.updated += 1;
      bulk.push({
        updateOne: {
          filter: { _id: s._id },
          update: { $set: { token: desired } }
        }
      });
    } else {
      stats.unchanged += 1;
    }

    if (bulk.length >= 500) {
      await Student.bulkWrite(bulk, { ordered: false });
      bulk.length = 0;
    }
  }

  if (bulk.length) {
    await Student.bulkWrite(bulk, { ordered: false });
  }

  console.log("✅ Token reconciliation complete", stats);
  await mongoose.disconnect();
};

run().catch((err) => {
  console.error("❌ Token reconciliation failed:", err);
  process.exit(1);
});
