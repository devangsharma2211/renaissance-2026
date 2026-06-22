import mongoose from "mongoose";
import dotenv from "dotenv";
import FestivalDay from "../models/FestivalDay.js";

dotenv.config();

const seedFestivalDays = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    await FestivalDay.deleteMany(); // clean reset (optional)

    await FestivalDay.insertMany([
      { day: 1, date: "2026-02-23" },
      { day: 2, date: "2026-02-24" },
      { day: 3, date: "2026-02-25" },
    ]);

    console.log("✅ Festival days seeded successfully");
    process.exit();
  } catch (err) {
    console.error("❌ Error seeding festival days:", err);
    process.exit(1);
  }
};

seedFestivalDays();
