import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import AppAdmin from "../models/AppAdmin.js";

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

const [emailArg, passwordArg] = process.argv.slice(2);
const envEmail = process.env.APP_ADMIN_EMAIL || process.env.ADMIN_EMAIL;
const envPassword = process.env.APP_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD;

const emailInput = emailArg || envEmail || "ren@jecrc.ac.in";
const passwordInput = passwordArg || envPassword;

if (!passwordInput) {
  console.error("Usage: node scripts/createAppAdmin.js <email> <password>");
  console.error("Or set APP_ADMIN_EMAIL and APP_ADMIN_PASSWORD in env.");
  process.exit(1);
}

const run = async () => {
  await mongoose.connect(uri, { autoIndex: false });
  const email = emailInput.toLowerCase().trim();
  const hashed = await bcrypt.hash(passwordInput, 10);

  const admin = await AppAdmin.findOneAndUpdate(
    { email },
    { $set: { email, password: hashed } },
    { upsert: true, new: true }
  );

  console.log("✅ App admin ready:", admin.email);
  await mongoose.disconnect();
};

run().catch((err) => {
  console.error("❌ Failed:", err);
  process.exit(1);
});
