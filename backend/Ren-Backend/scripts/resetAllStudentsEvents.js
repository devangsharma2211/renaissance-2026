import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import Student from "../models/student.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "..", ".env") });

if (!process.env.MONGO_URI) {
  console.error("MONGO_URI missing in .env");
  process.exit(1);
}

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);

  const paidResult = await Student.updateMany(
    { isPaid: true },
    { $set: { token: 4, events: [] } }
  );

  const unpaidResult = await Student.updateMany(
    { $or: [{ isPaid: false }, { isPaid: { $exists: false } }] },
    { $set: { token: 0, events: [] } }
  );

  console.log("All students reset complete.");
  console.log("Paid matched:", paidResult.matchedCount ?? paidResult.n);
  console.log("Paid modified:", paidResult.modifiedCount ?? paidResult.nModified);
  console.log("Unpaid matched:", unpaidResult.matchedCount ?? unpaidResult.n);
  console.log("Unpaid modified:", unpaidResult.modifiedCount ?? unpaidResult.nModified);

  await mongoose.disconnect();
};

run().catch((err) => {
  console.error("Reset failed:", err);
  process.exit(1);
});
