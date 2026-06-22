import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import Teacher from "../models/Teacher.js";
import Student from "../models/student.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const args = process.argv.slice(2);
const getArg = (name) => {
  const idx = args.indexOf(name);
  if (idx === -1) return null;
  return args[idx + 1] || null;
};

const teacherId = getArg("--teacher-id");
const teacherEmail = getArg("--teacher-email");

if (!teacherId && !teacherEmail) {
  console.error("Usage: node scripts/migrateMarkedBy.js --teacher-id <id> OR --teacher-email <email>");
  process.exit(1);
}

if (!process.env.MONGO_URI) {
  console.error("MONGO_URI missing in .env");
  process.exit(1);
}

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);

  const teacher = teacherId
    ? await Teacher.findById(teacherId)
    : await Teacher.findOne({ email: teacherEmail });

  if (!teacher) {
    console.error("Teacher not found.");
    process.exit(1);
  }

  const now = new Date();
  const branch = teacher.branch;

  if (!branch) {
    console.error("Teacher has no branch set. Cannot scope migration.");
    process.exit(1);
  }

  const result = await Student.updateMany(
    {
      isPaid: true,
      markedBy: null,
      branch
    },
    { $set: { markedBy: teacher._id, markedAt: now } }
  );

  console.log("Migration complete.");
  console.log("Teacher:", teacher.name, teacher.email);
  console.log("Matched:", result.matchedCount ?? result.n);
  console.log("Modified:", result.modifiedCount ?? result.nModified);

  await mongoose.disconnect();
};

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
