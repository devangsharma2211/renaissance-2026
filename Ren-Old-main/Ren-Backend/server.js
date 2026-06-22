console.log("THIS IS THE ACTIVE SERVER FILE");

import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcrypt";
import compression from "compression";


// --- ROUTES IMPORTS ---
import studentRoutes from "./routes/studentRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";
import teacherRoutes from "./routes/teacherRoutes.js";
import passRoutes from "./routes/passRoutes.js";
import outsiderPassRoutes from "./routes/outsiderPassRoutes.js";
import scanRoutes from "./routes/scanRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import Teacher from "./models/Teacher.js";


// --- CONFIGURATION ---
// Fix for ES Modules to get the current folder path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Force load .env from the Ren-Backend folder
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
app.use(express.json());
// Use compression for responses to reduce network payload
app.use(compression());
app.use(
  cors({
    origin: ["https://renaissance2026.netlify.app", "https://jecrcrenaissance.co.in", "http://localhost:5173"],
    methods: ["GET", "POST", "PATCH", "DELETE", "PUT", "CREATE"],
    credentials: false
  })
);

// Serve image assets with cache headers
app.use('/images', express.static(path.join(__dirname, 'images'), { maxAge: '7d' }));

// --- DEBUG LOGGING ---
console.log("------------------------------------------------");
console.log("DEBUG: Loading .env from:", path.join(__dirname, '.env'));
console.log("DEBUG: MONGO_URI is ->", process.env.MONGO_URI); 
console.log("------------------------------------------------");

// --- ROUTES ---
app.use("/api/students", studentRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/teacher", teacherRoutes);
app.use("/api/pass", passRoutes);
app.use("/api", outsiderPassRoutes);
app.use("/api", scanRoutes);
app.use("/api/auth", authRoutes);



async function bootstrapAdmin() {
  if (process.env.BOOTSTRAP_ADMIN !== "true") return;

  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.error("❌ ADMIN_EMAIL or ADMIN_PASSWORD missing in env");
    return;
  }

  // Prefer an existing SUPERADMIN; if none found we create one
  const existingSuper = await Teacher.findOne({ role: "superadmin" });

  if (existingSuper) {
    console.log("⚠️ Superadmin already exists. Skipping bootstrap.");
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  await Teacher.create({
    name: "Main SuperAdmin",
    email,
    password: hashedPassword,
    role: "superadmin"
  });

  console.log("✅ Superadmin bootstrapped successfully");
}


// --- DATABASE CONNECTION ---
// Check if URI exists before connecting to avoid the crash
if (!process.env.MONGO_URI) {
  console.error("❌ FATAL ERROR: MONGO_URI is missing. Please check your .env file.");
  process.exit(1); // Stop the server if no DB
}

mongoose
  .connect(process.env.MONGO_URI) // Removed deprecated options (useNewUrlParser etc are default in Mongoose 6+)
  .then(() => console.log("✅ MongoDB connected successfully"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// --- SERVER START ---
const PORT = process.env.PORT || 5000;
bootstrapAdmin();
app.listen(PORT,"0.0.0.0", () => console.log(`Server running on port ${PORT}`));
