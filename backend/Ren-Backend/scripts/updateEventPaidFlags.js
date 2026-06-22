import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import Event from "../models/event.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "..", ".env") });

if (!process.env.MONGO_URI) {
  console.error("MONGO_URI missing in .env");
  process.exit(1);
}

const paidTitleKeywords = [
  // Technical (generic + legacy names)
  "SOCCER",
  "ROBO SOCCER",
  "ROBO RACE",
  "DRONE",
  "DRONES",
  "GAME OF DRONES",
  "WAR",
  "ROBO WAR",
  "EXPO",
  "PROJECT EXPO",
  "NATIONAL PROJECT EXPO",
  // Splash
  "TUG OF WAR",
  "IPL AUCTION",
  "TREASURE HUNT",
  "GULLY CRICKET",
  "BEG BORROW STEAL",
  "HALF COURT BASKETBALL",
  "ARM WRESTLING",
  "CHESS",
  "VALORANT",
  "SMASH KART"
];

const paidTitleExceptions = [
  "3 LEG RACE",
  "THREE LEG RACE"
];

const isPaidTitle = (title = "") => {
  const upper = String(title).toUpperCase();
  if (paidTitleExceptions.some((t) => upper.includes(t))) return false;
  return paidTitleKeywords.some((k) => upper.includes(k));
};

const normalizeCategory = (cat) => {
  const c = (cat || "").toLowerCase().trim();
  return c === "culture" ? "cultural" : c;
};

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);

  // Normalize category values
  const allEvents = await Event.find().select("_id category").lean();
  const bulk = allEvents.map((e) => {
    const normalized = normalizeCategory(e.category);
    if (normalized === e.category) return null;
    return {
      updateOne: {
        filter: { _id: e._id },
        update: { $set: { category: normalized } }
      }
    };
  }).filter(Boolean);

  if (bulk.length) {
    await Event.bulkWrite(bulk);
  }

  // Cultural events are always paid
  await Event.updateMany(
    { category: "cultural" },
    { $set: { isPaid: true } }
  );

  // Paid technical/splash titles
  const allEventsForPaid = await Event.find().select("_id title").lean();
  const paidIds = allEventsForPaid
    .filter((e) => isPaidTitle(e.title || ""))
    .map((e) => e._id);

  if (paidIds.length) {
    await Event.updateMany(
      { _id: { $in: paidIds } },
      { $set: { isPaid: true } }
    );
  }

  // Explicitly mark exceptions as free
  await Event.updateMany(
    { title: { $regex: paidTitleExceptions.join("|"), $options: "i" } },
    { $set: { isPaid: false } }
  );

  console.log("Event paid flags updated.");
  await mongoose.disconnect();
};

run().catch((err) => {
  console.error("Update failed:", err);
  process.exit(1);
});
