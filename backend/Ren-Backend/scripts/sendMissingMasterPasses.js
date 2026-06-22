import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import Student from "../models/student.js";
import password_generator from "../utils/teacher/password.js";
import bookTicket from "../utils/teacher/qrgen.js";

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

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const run = async () => {
  await mongoose.connect(uri, { autoIndex: false });

  let processed = 0;
  let skippedNoEmail = 0;
  let claimed = 0;
  let totalPending = 0;

  try {
    totalPending = await Student.countDocuments({
      isPaid: true,
      passSent: { $ne: true },
      passSendingAt: { $exists: false }
    });
    console.log(`Pending master passes: ${totalPending}`);
  } catch (e) {
    console.warn("Could not count pending passes.");
  }

  while (true) {
    const s = await Student.findOneAndUpdate(
      { isPaid: true, passSent: { $ne: true }, passSendingAt: { $exists: false } },
      { $set: { passSendingAt: new Date() } },
      { new: true }
    ).select("_id name email branch Year password passSent");

    if (!s) break;
    claimed += 1;
    console.log(
      `[${claimed}${totalPending ? `/${totalPending}` : ""}] Sending: ${s.name || ""} <${s.email || ""}>`
    );

    if (!s.email) {
      skippedNoEmail += 1;
      await Student.updateOne(
        { _id: s._id },
        { $unset: { passSendingAt: "" } }
      );
      continue;
    }

    const plainPassword = await password_generator(8);
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    await Student.updateOne(
      { _id: s._id },
      { $set: { password: hashedPassword } }
    );

    try {
      await bookTicket(
        s._id,
        s.name,
        s.Year,
        s.branch,
        s.email,
        plainPassword
      );
      processed += 1;
      console.log(`✅ Sent: ${s.email || s._id}`);
      await Student.updateOne(
        { _id: s._id },
        { $set: { passSent: true }, $unset: { passSendingAt: "" } }
      );
    } catch (err) {
      console.error("Failed to send pass for:", s.email, err?.message || err);
      await Student.updateOne(
        { _id: s._id },
        { $unset: { passSendingAt: "" } }
      );
    }

    // small delay to avoid RAM spikes
    await sleep(200);
  }

  console.log("✅ Master pass resend complete", {
    claimed,
    processed,
    skippedNoEmail
  });

  await mongoose.disconnect();
};

run().catch((err) => {
  console.error("❌ Script failed:", err);
  process.exit(1);
});
