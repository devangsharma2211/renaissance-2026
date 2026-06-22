import mongoose from "mongoose";
import fs from "fs";
import Event from "../models/event.js";
import dotenv from "dotenv";

dotenv.config();

const raw = JSON.parse(
  fs.readFileSync(new URL("./Events.json", import.meta.url), "utf-8")
);
const events = Array.isArray(raw) ? raw : (raw?.value || []);

const normalizeCategory = (cat) => {
  if (!cat) return "technical";
  const c = cat.toLowerCase().trim();
  return c === "culture" ? "cultural" : c;
};

const normalizeDay = (day) => {
  if (!day) return 1;
  return Number(day.replace("day", ""));
};

const resolvePaidFlag = (event) => {
  if (!event) return false;
  if (typeof event.isPaid === "boolean") return event.isPaid;
  if (typeof event.Paid === "boolean") return event.Paid;
  if (typeof event.paid === "boolean") return event.paid;
  return false;
};

async function seedEvents() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    // Upsert by title to keep stable IDs across reseeds

    const formattedEvents = events.map((e) => ({
      name: e.title,
      title: e.title,
      subtitle: e.subtitle,
      icon: e.icon,
      iconColor: e.iconColor,
      image: e.image,
      description: e.description,
      actionLabel: e.actionLabel,
      category: normalizeCategory(e.category),
      day: normalizeDay(e.day),
      isPaid: normalizeCategory(e.category) === "cultural" ? true : resolvePaidFlag(e),
      venue: e.venue || "",
      date: e.date || "",
      time: e.time || ""
    }));

    const ops = formattedEvents.map((ev) => ({
      updateOne: {
        filter: { title: ev.title },
        update: { $set: ev },
        upsert: true
      }
    }));

    if (ops.length) {
      await Event.bulkWrite(ops, { ordered: false });
    }

    console.log("✅ Events successfully seeded into database");
    process.exit();
  } catch (err) {
    console.error("❌ Error seeding events:", err);
    process.exit(1);
  }
}

seedEvents();
