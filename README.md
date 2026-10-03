# 🎭 Renaissance 2026 — Complete Project Documentation (Hinglish)

> **Author note:** Yeh README project ka ek complete technical breakdown hai — architecture se lekar har ek line of code tak, technology choices ke reasons tak, aur final interview preparation questions tak. Sab kuch Hinglish mein explain kiya gaya hai.

---

## 📑 Table of Contents

1. [Project Overview — Kya Hai Yeh?](#1-project-overview)
2. [High-Level Architecture](#2-high-level-architecture)
3. [Technology Stack — Kyun Use Kiya](#3-technology-stack)
4. [Backend Deep Dive](#4-backend-deep-dive)
   - server.js
   - Models
   - Controllers
   - Middlewares
   - Routes
   - Utils / Utilities
5. [Frontend Deep Dive](#5-frontend-deep-dive)
   - App.jsx (Routing)
   - Navbar
   - Login
   - Events Page
   - Teacher Dashboard
   - Cursor Effect
   - Preloader
6. [Database Design](#6-database-design)
7. [Authentication & Security Flow](#7-authentication--security-flow)
8. [Email & Pass Generation Flow](#8-email--pass-generation-flow)
9. [QR Scan & Attendance Flow](#9-qr-scan--attendance-flow)
10. [Deployment Architecture](#10-deployment-architecture)
11. [Environment Variables](#11-environment-variables)
12. [Final Technical Interview Questions](#12-final-technical-interview-questions)

---

## 1. Project Overview

**Renaissance 2026** JECRC Foundation ka ek **Annual College Technical & Cultural Festival** hai. Yeh project ek **full-stack web application** hai jiska kaam hai:

- 🌐 **Public Website** — Festival ke events, itinerary, gallery, teams, sponsors dekhna
- 🎫 **Ticket Registration System** — Students apne events ke liye register kar sakein
- 👩‍🏫 **Teacher Admin Panel** — Teachers aur admins students ki fee mark karein, Excel se bulk upload karein, aur attendance scan karein
- 📧 **Automated Email Passes** — Jab bhi koi register kare, usse automatically event pass image email ho
- 🔒 **Role-Based Access Control (RBAC)** — Superadmin, Admin, HOD, Dean, CC roles ke allag-allag permissions

---

## 2. High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    USER (Browser)                        │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTPS
                       ▼
┌─────────────────────────────────────────────────────────┐
│            FRONTEND (React + Vite)                       │
│         Deployed on: Netlify                            │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐ │
│  │  Public Site │  │ Student Login│  │ Teacher Panel │ │
│  │  (Home,      │  │ (JWT Auth)   │  │ (Dashboard,   │ │
│  │  Events,     │  │              │  │  Scan, Upload)│ │
│  │  Gallery)    │  │              │  │               │ │
│  └──────────────┘  └──────────────┘  └───────────────┘ │
└──────────────────────┬──────────────────────────────────┘
                       │ REST API (Axios/Fetch)
                       ▼
┌─────────────────────────────────────────────────────────┐
│            BACKEND (Node.js + Express)                   │
│         Deployed on: Render.com                          │
│                                                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────┐ │
│  │  Auth    │ │ Students │ │  Events  │ │   Pass    │ │
│  │  Routes  │ │  Routes  │ │  Routes  │ │  Routes   │ │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬──────┘ │
│       │             │             │             │        │
│  ┌────▼─────────────▼─────────────▼─────────────▼─────┐ │
│  │              Controllers Layer                      │ │
│  └────────────────────────┬────────────────────────────┘ │
│                            │                             │
│  ┌─────────────────────────▼──────────────────────────┐ │
│  │              MongoDB (Mongoose ODM)                 │ │
│  │  Collections: students, events, teachers,          │ │
│  │  festivalpasses, outsiderpasses, festivaldays       │ │
│  └────────────────────────────────────────────────────┘ │
│                            │                             │
│  ┌─────────────────────────▼──────────────────────────┐ │
│  │              External Services                     │ │
│  │  • Resend API (Email Sending)                      │ │
│  │  • Canvas (Pass Image Generation)                  │ │
│  │  • Cloudflare CDN (Static Assets)                  │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

**Data Flow Summary:**
```
Student → Login → JWT Token milta hai → Events dekhta hai → Register karta hai
→ Backend token check karta hai → DB update hota hai → Email queue mein jaata hai
→ Canvas se pass image banta hai → Resend API se email jaata hai
```

---

## 3. Technology Stack

### Backend Technologies

| Technology | Version | Kyun Use Kiya? |
|---|---|---|
| **Node.js** | LTS | Non-blocking I/O — email sending, DB queries parallel chalaane ke liye perfect. PHP ya Python se zyada async-friendly hai |
| **Express.js** | ^4.21 | Minimal, fast HTTP framework. Routes, middleware, controllers easily organize ho jaate hain |
| **MongoDB + Mongoose** | ^8.9 | Schema-less flexibility chahiye thi — events ke fields flexible hain, students ka data alag-alag format mein aata hai. SQL mein rigid schema problem hoti |
| **JWT (jsonwebtoken)** | ^9.0 | Stateless authentication — server pe session store nahi karna pada. Frontend har request ke saath token bhejta hai |
| **bcrypt** | ^5.1 | Password hashing ke liye. MD5/SHA jaisi reversible hashing safe nahi. bcrypt ke saath salt + rounds hote hain |
| **Resend API** | ^6.9 | AWS SES se zyada developer-friendly email API. Rate limiting, delivery tracking inbuilt |
| **Canvas (node-canvas)** | ^3.1 | Server-side image generation. HTML Canvas ka Node.js version. Pass image PNG format mein dynamically banta hai |
| **Sharp** | ^0.33 | Image processing/compression — Canvas se bani image ko optimize karta hai |
| **ExcelJS** | ^4.4 | Excel files (.xlsx) read karne ke liye. Teachers bulk student data Excel se upload karte hain |
| **Multer** | ^2.0 | File upload middleware. Excel files server pe receive karne ke liye |
| **p-limit** | ^4.0 | Email concurrency control — ek saath bahut saare emails bhejne se API rate limit nahi hoga |
| **express-rate-limit** | ^8.2 | Brute force attacks rokne ke liye login routes pe request limit lagana |
| **compression** | ^1.7 | HTTP response gzip/brotli se compress karna — bandwidth bachti hai |
| **dotenv** | ^16.4 | Environment variables .env file se load karna — secrets code mein hardcode nahi |
| **cors** | ^2.8 | Cross-Origin Resource Sharing — Frontend (Netlify) aur Backend (Render) alag domains pe hain |
| **uuid** | ^11.0 | Unique IDs generate karne ke liye — OutsiderPass ke QR tokens ke liye |

### Frontend Technologies

| Technology | Version | Kyun Use Kiya? |
|---|---|---|
| **React 18** | ^18.3 | Component-based UI, Virtual DOM, hooks — modern SPA banane ka industry standard |
| **Vite** | ^7.2 | CRA se 10-100x fast build tool. Hot Module Replacement instant hota hai |
| **React Router DOM v7** | ^7.12 | Client-side routing — page reload nahi hota, SPA feel aati hai |
| **Framer Motion** | ^12.29 | Declarative animations — preloader, card hover, curtain scroll effects ke liye |
| **GSAP** | ^3.14 | Advanced scroll-based animations — performance optimized |
| **Tailwind CSS v4** | ^4.1 | Utility-first CSS — rapid UI development, no custom CSS files ki zarurat |
| **Axios** | ^1.13 | HTTP client — interceptors, better error handling, timeout support |
| **Lenis** | ^1.3 | Smooth scroll library — native scroll se zyada butter-smooth feel |
| **Lucide React** | ^0.562 | Tree-shakeable icon library — only jo icons use hue woh bundle mein jaate hain |
| **jwt-decode** | ^4.0 | Frontend pe JWT payload decode karna (verify nahi, sirf read) |
| **clsx + tailwind-merge** | latest | Conditional class names cleanly manage karne ke liye |

---

## 4. Backend Deep Dive

### 📄 `server.js` — Entry Point (Har Line Explain)

```javascript
console.log("THIS IS THE ACTIVE SERVER FILE");
```
> Debug ke liye — deployment mein confirm karta hai ki sahi file load ho rahi hai (multiple versions ho sakti hain)

```javascript
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcrypt";
import compression from "compression";
```
> **ES Modules** (`import` syntax) use kiya gaya hai, `require()` nahi — `package.json` mein `"type": "module"` set hai isliye. Modern Node.js standard hai.

```javascript
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
```
> ES Modules mein `__dirname` automatically available nahi hota (jo CommonJS mein hota tha). `import.meta.url` se current file ka URL milta hai, `fileURLToPath` usse file path mein convert karta hai, aur `path.dirname` se folder path milta hai.

```javascript
dotenv.config({ path: path.join(__dirname, '.env') });
```
> Explicitly `.env` file ka path bataya — agar server kisi aur directory se start ho to bhi correct `.env` load ho.

```javascript
const app = express();
app.use(express.json());
```
> Express app create kiya. `express.json()` middleware request body ko JSON se JavaScript object mein parse karta hai. Iske bina `req.body` undefined aata.

```javascript
app.use(compression());
```
> Saari HTTP responses automatically gzip compress ho jaati hain. 100KB response 20KB ban jaata hai — loading fast hoti hai.

```javascript
app.use(cors({
  origin: ["https://renaissance2026.netlify.app", "https://jecrcrenaissance.co.in", "http://localhost:5173"],
  methods: ["GET", "POST", "PATCH", "DELETE", "PUT", "CREATE"],
  credentials: false
}));
```
> **CORS (Cross-Origin Resource Sharing):** Browser security feature hai. Agar frontend (Netlify) aur backend (Render) alag domains pe hain, toh browser by default request block kar deta hai. Yahan whitelist mein only allowed domains hain. `credentials: false` matlab cookies nahi bheje jaate — JWT use ho raha hai.

```javascript
app.use('/images', express.static(path.join(__dirname, 'images'), { maxAge: '7d' }));
```
> `/images` folder ke files publicly serve ho rahe hain. `maxAge: '7d'` — browser 7 din tak same image cache karega, dobara server se nahi maangega.

```javascript
app.use("/api/students", studentRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/teacher", teacherRoutes);
app.use("/api/pass", passRoutes);
app.use("/api", outsiderPassRoutes);
app.use("/api", scanRoutes);
app.use("/api/auth", authRoutes);
```
> **Route mounting:** Har route file apna namespace le rahi hai. Jaise `/api/students/login` → studentRoutes ke `/login` pe jaayega.

```javascript
async function bootstrapAdmin() {
  if (process.env.BOOTSTRAP_ADMIN !== "true") return;
  // ...
  const hashedPassword = await bcrypt.hash(password, 12);
  await Teacher.create({ name: "Main SuperAdmin", email, password: hashedPassword, role: "superadmin" });
}
```
> **Superadmin Bootstrap:** Pehli deployment pe koi admin nahi hota. Environment variable `BOOTSTRAP_ADMIN=true` set karo, aur yeh automatically superadmin create kar deta hai. Password rounds=12 (high security).

```javascript
if (!process.env.MONGO_URI) {
  console.error("❌ FATAL ERROR: MONGO_URI is missing.");
  process.exit(1);
}
```
> **Fail-fast principle:** DB URI nahi mili toh server start hi mat hone do — half-broken state se behtar hai clean crash.

```javascript
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));
```
> `mongoose.connect()` async hai — `.then()` success pe, `.catch()` failure pe. Deprecated options (`useNewUrlParser`) hataye kyunki Mongoose 6+ mein default hain.

```javascript
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => console.log(`Server running on port ${PORT}`));
```
> `"0.0.0.0"` — server saare network interfaces pe listen karega (sirf localhost nahi). Render.com jaisi cloud platforms ke liye zaroori hai. `PORT` environment se aata hai cloud pe.

---

### 📊 Models (Database Schemas)

#### `models/student.js`

```javascript
const studentSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  branch: { type: String, required: true, trim: true },
  Year: { type: Number, required: true },
  phone: { type: String, trim: true, default: null },
  isPaid: { type: Boolean, default: false, required: true },
  markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', default: null },
  markedAt: { type: Date, default: null },
  password: { type: String, trim: true },
  token: { type: Number, default: 0 },
  passSent: { type: Boolean, default: false },
  events: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Event', default: [] }]
});
```

- `email: unique: true` — MongoDB pe unique index ban jaata hai, duplicate registrations impossible
- `lowercase: true` — "ABC@gmail.com" aur "abc@gmail.com" same treat honge
- `trim: true` — extra spaces auto-remove
- `markedBy: ref: 'Teacher'` — **Population/Join:** `Teacher` model ke saath virtual join — `populate('markedBy')` se teacher ka poora object mil jaata hai
- `token: Number` — Student ke free event tokens (4 milte hain fee pay karne pe)
- `events: [ObjectId]` — Registered events ka array. `$addToSet` se same event double nahi jaata
- `isPaid: Boolean` — Fest pass ke liye fee di ya nahi

#### `models/Teacher.js`

```javascript
const teacherSchema = new mongoose.Schema({
  name, email, password,
  role: { type: String, enum: ["superadmin", "admin", "hod", "dean"] },
  branch: { required: function() { return ["hod"].includes(this.role); } },
  year: { required: function() { return ["dean"].includes(this.role); } }
});
```

- `enum` — MongoDB level pe validation, sirf allowed values store honge
- `required: function()` — **Conditional Validation:** HOD ke liye branch zaroori, Dean ke liye year zaroori — yeh runtime decide hota hai

#### `models/FestivalPass.js`

```javascript
const FestivalPassSchema = new mongoose.Schema({
  student: { type: ObjectId, ref: "Student", unique: true },
  Day1: { type: Boolean, default: false },
  Day2: { type: Boolean, default: false },
  Day3: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true }
});
```

- `student: unique: true` — Ek student ka ek hi pass ho sakta hai
- `Day1/Day2/Day3` — QR scan hone pe `true` ho jaata hai — attendance tracking
- `isActive: false` — Fee revoke hone pe pass disable ho jaata hai

#### `models/OutsiderPass.js`

```javascript
{
  name, email, phone, eventName,
  passType: { enum: ["MASTER", "EVENT"] },
  participants, participantsCount,
  Day1, Day2, Day3,
  qrToken: { unique: true, sparse: true },
  ticketSent: Boolean,
  attendedDay1, attendedDay2, attendedDay3
}
```

- `sparse: true` on `qrToken` — Unique index sirf un documents pe apply hoga jahan `qrToken` defined hai (null values allowed hain)
- `passType: MASTER vs EVENT` — Saari days ke liye ya ek specific event ke liye
- `participants` — Group registration support

#### `models/event.js`

```javascript
{
  name, category: { enum: ['technical', 'splash', 'cultural'] },
  isPaid: Boolean, day, venue, date, time,
  title, subtitle, icon, iconColor, image,
  description, actionLabel
}
```

- UI metadata (icon, iconColor, image) bhi DB mein store hai taaki frontend ko hardcode na karna pade
- `category enum` ensures sirf valid categories hi store hongi

---

### 🎮 Controllers

#### `controllers/authController.js` — App Admin/Student Login

```javascript
const normalizeEmail = (email) => (email || "").toString().trim().toLowerCase();
```
> Har email ko same format mein convert karo — "ABC@Gmail.COM" aur "abc@gmail.com" ek hi user hain

```javascript
let account = await AppAdmin.findOne({ email: normalizedEmail });
let role = "admin";
if (!account) {
  account = await AppStudent.findOne({ email: normalizedEmail });
  role = "student";
}
```
> **Dual lookup:** Ek hi login endpoint se admin aur student dono login kar sakte hain. Pehle admin check karo, nahi mila toh student check karo.

```javascript
const devices = Array.isArray(account.devices) ? account.devices : [];
if (!devices.includes(deviceId)) {
  if (devices.length >= maxDevices) {
    return res.status(403).json({ msg: "Device limit reached" });
  }
  devices.push(deviceId);
}
```
> **Device-based session control:** maxDevices=1, matlab ek account ek hi device pe login ho sakta hai. Sharing/sharing prevention.

```javascript
const token = jwt.sign(
  { id: account._id, email: account.email, deviceId, role },
  jwtSecret,
  { expiresIn: "7d" }
);
```
> JWT payload mein `id`, `email`, `deviceId`, `role` — sign karo secret key se, 7 din ki expiry.

#### `controllers/studentController.js` — Student Login

```javascript
const isPasswordValid = await bcrypt.compare(password, student.password);
```
> `bcrypt.compare(plainText, hash)` — plain password ko stored hash se compare karta hai. bcrypt internally hash compare karta hai. Hum kabhi plain password store nahi karte!

```javascript
const hasPhone = !!(student.phone && String(student.phone).trim());
if (!hasPhone) {
  if (!normalizedPhone) {
    return res.status(428).json({ message: "Phone number required", needsPhone: true });
  }
  student.phone = normalizedPhone;
  await student.save();
}
```
> **Progressive profiling:** Pehli baar login pe agar phone nahi diya toh HTTP 428 (Precondition Required) return karo. Frontend `needsPhone: true` dekhke phone input dikhata hai. Dusri baar phone ke saath aata hai toh save ho jaata hai.

```javascript
const token = jwt.sign({ id: student._id }, process.env.JWT_SECRET, { expiresIn: "1d" });
```
> Student token sirf 1 din ke liye — admin token 7 din ka. Alag security levels.

#### `controllers/eventController.js` — Event Registration (Most Complex)

```javascript
const normalizeCategory = (cat) => {
  const c = (cat || "").toLowerCase().trim();
  if (c === "culture" || c.startsWith("cult")) return "cultural";
  if (c.includes("tech")) return "technical";
  if (c.includes("splash")) return "splash";
  return c;
};
```
> DB mein "culture", "Cultural", "cultural" sab ho sakte hain — normalize karke consistent comparison karo.

```javascript
const SPLASH_FREE_EXCEPTIONS = ["BGMI", "REAL CRICKET"];
```
> BGMI aur Real Cricket splash events hain lekin free events ki limit mein count nahi hote — special exceptions.

```javascript
const resolvePaidFlag = (event) => {
  if (typeof event.isPaid === "boolean") return event.isPaid;
  if (typeof event.Paid === "boolean") return event.Paid;
  if (typeof event.paid === "boolean") return event.paid;
  return false;
};
```
> DB mein consistency nahi — kuch documents mein `isPaid`, kuch mein `Paid`, kuch mein `paid` ho sakta hai. Yeh function teeno check karta hai — **defensive programming**.

```javascript
if (!isPaid && student.token <= 0) {
  return res.status(400).json({ message: "No tokens left for free events." });
}
```
> Free event register karne ke liye token chahiye. Token 0 hai toh offline register karo.

```javascript
if (!isPaid && category === "splash" && hasSplashFree && !isSplashException) {
  return res.status(400).json({ message: "Can Register only one splash event." });
}
```
> **Business Rules:** Ek student sirf ek free splash event register kar sakta hai. BGMI/Real Cricket exception hai.

```javascript
const updatedStudent = await Student.findOneAndUpdate(
  {
    _id: student._id,
    token: { $gt: 0 },      // ← Ensure token > 0 (atomic check)
    events: { $ne: event._id } // ← Ensure event not already registered
  },
  {
    $addToSet: { events: event._id }, // ← Add event (no duplicates)
    $inc: { token: -1 }               // ← Deduct 1 token atomically
  },
  { new: true }
);
```
> **Atomic MongoDB Operation (Race Condition Prevention):** Agar do requests ek saath aayein (user ne do baar click kiya), toh dono `token > 0` check pass kar sakti hain aur dono token deduct kar sakti hain — race condition. Yahan `findOneAndUpdate` ek atomic operation hai — MongoDB level pe lock lagta hai. `$ne: event._id` ensure karta hai duplicate nahi hoga.

```javascript
if (!updatedStudent) {
  const fresh = await Student.findById(student._id).select("token events");
  if (fresh && hasEventId(fresh.events, event._id)) {
    return res.status(400).json({ message: "You have already registered." });
  }
  // ...
}
```
> Agar update fail ho jaaye toh pata karo kyun fail hua — already registered tha ya token nahi tha.

#### `controllers/passController.js` — Fee Toggle & QR Verify

```javascript
export const toggleStudentFee = async (req, res) => {
  const { id, isPaid } = req.body;
  const actor = req.user; // Teacher/Admin performing action
```
> Teacher/Admin student ki fee mark karta hai. `actor` wo teacher hai jisne action kiya.

```javascript
if (
  actor.role === "hod"
    ? student.branch !== actor.branch
    : actor.role === "dean"
    ? student.Year !== (actor.year ?? 1)
    : actor.role === "cc"
    ? student.branch !== actor.branch || student.Year !== actor.year
    : false
) {
  return res.status(403).json({ msg: "Not allowed" });
}
```
> **RBAC Check (Nested Ternary):**
> - HOD — sirf apni branch ke students
> - Dean — sirf apne year ke students
> - CC — apni branch + apने year ke students
> - Superadmin/Admin — sab ke (default `false` matlab restriction nahi)

```javascript
const plainPassword = await password_generator(8);
const hashedPassword = await bcrypt.hash(plainPassword, 10);
student.password = hashedPassword;
pass = await FestivalPass.create({ student: student._id, Day1: false, Day2: false, Day3: false, isActive: true });
student.token = (student.token || 0) + 4;
```
> Fee pehli baar mark hone pe:
> 1. Random 8-char password generate hota hai
> 2. Hash karke student document mein save hota hai
> 3. FestivalPass document create hota hai
> 4. 4 free tokens milte hain (1 technical + 1 splash + BGMI + Real Cricket)

```javascript
bookTicket(student._id, ...).catch((err) => {
  console.error("Async bookTicket error:", err?.message || err);
});
```
> **Fire-and-forget pattern:** Email sending async hai, UI ko wait nahi karna. `.catch()` errors silently log karta hai taaki main flow break na ho.

```javascript
export const verifyPass = async (req, res) => {
  const { passId } = req.body;
  const pass = await FestivalPass.findById(passId).populate("student");
```
> QR scan pe `passId` aata hai. `populate("student")` se pass ke saath student ka poora data ek query mein milta hai (MongoDB lookup/join).

```javascript
const today = new Date().toLocaleDateString('en-CA');
const festDay = await FestivalDay.findOne({ date: today });
```
> `en-CA` locale se date `YYYY-MM-DD` format mein aati hai — consistent date comparison ke liye. `FestivalDay` collection mein admin ne specific dates enter ki hain.

```javascript
if (pass[dayField]) {
  return res.status(409).json({ valid: false, msg: `Already scanned for Day ${festDay.day}` });
}
pass[dayField] = true;
await pass.save();
```
> Double-scan prevention. 409 = Conflict. Ek hi din ek QR ek baar scan.

---

### 🛡️ Middlewares

#### `middlewares/authMiddleware.js` — Student JWT Auth

```javascript
const authHeader = req.header("Authorization");
if (!authHeader || !authHeader.startsWith("Bearer ")) {
  return res.status(401).json({ message: "No token provided." });
}
const token = authHeader.split(" ")[1]; // "Bearer eyJhb..." → "eyJhb..."
const decoded = jwt.verify(token, process.env.JWT_SECRET);
const student = await Student.findById(decoded.id);
req.student = student;
next();
```
> 1. Header se Bearer token extract karo
> 2. `jwt.verify()` — signature verify karo (tampered token fail hoga), expiry check karo
> 3. DB se student fetch karo (deleted students ki token reject hogi)
> 4. `req.student` set karo — controller mein directly use ho sake
> 5. `next()` — agle middleware/route pe jaao

#### `middlewares/teacherAuth.js`

```javascript
const user = jwt.verify(token, jwtSecret);
if (!user.role) {
  return res.status(403).json({ msg: "Role missing in token" });
}
req.user = user;
```
> Teacher JWT mein `role` field check karta hai — role-based access ke liye zaroori hai.

#### `middlewares/rateLimiter.js`

```javascript
export const studentLoginLimiter = createLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: "Too many login attempts. Try again after 15 minutes."
});

export const scanLimiter = createLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30,
  message: "Too many scans. Please slow down."
});
```
> - Login: 15 minutes mein max 10 attempts — brute force protection
> - Scan: 1 minute mein 30 scans — scan bot protection
> `standardHeaders: true` — rate limit info response headers mein bhejta hai (`RateLimit-Remaining: 9`)

#### `middlewares/appAdminAuth.js`

```javascript
const admin = await AppAdmin.findById(decoded.id);
if (!admin) { return res.status(401).json({ msg: "Unauthorized" }); }
req.admin = admin;
req.deviceId = decoded.deviceId || null;
```
> Admin DB mein exist karta hai verify karo — deleted admin ki token reject ho.

---

### 🛣️ Routes

#### `routes/scanRoutes.js` — Unified QR Scan Endpoint

```javascript
router.post("/scan", scanLimiter, async (req, res) => {
  const { type, passId } = req.body;
  const normalizedType = String(type || "").toUpperCase();

  if (normalizedType === "INSIDER") return verifyPass(req, res);
  if (normalizedType.startsWith("OUTSIDER") || normalizedType === "OUT") {
    const result = await verifyOutsiderPass(passId);
    return res.status(result.status).json(result);
  }
  return res.status(400).json({ message: "Invalid QR" });
});
```
> Ek hi `/scan` endpoint insider aur outsider dono ke QR handle karta hai. `type` field decide karta hai kaunsa verifier call hoga — **Strategy Pattern**.

#### `routes/authRoutes.js`

```javascript
router.post("/login", loginAppAdmin);
router.post("/logout", appUserAuth, logoutAppAdmin);
router.post("/students", appAdminAuth, createStudent);
router.get("/students", appAdminAuth, listStudents);
router.delete("/students/:id", appAdminAuth, deleteStudent);
```
> Middleware chain: `appAdminAuth` pehle chalega, pass hone pe controller chalega. `:id` URL parameter hai.

---

### 🔧 Utils / Utilities

#### `utils/emailQueue.js` — Concurrency Control

```javascript
import pLimit from 'p-limit';
const concurrency = parseInt(process.env.EMAIL_CONCURRENCY || '5', 10);
const limit = pLimit(concurrency);
export const enqueueEmail = (fn) => limit(() => fn());
```
> `p-limit` ek Promise concurrency limiter hai. Ek saath maximum 5 emails parallel bheje jaayenge. Isse Resend API rate limit nahi hogi.

**Analogy:** Imagine 100 students ek saath register karte hain — 100 emails ek saath bhejna API ko overwhelm kar sakta hai. `pLimit(5)` ek queue banata hai — 5-5 parallel, baaki wait karte hain.

#### `utils/bookEventPasses.js` — Canvas Image Generation

```javascript
const WIDTH = 5880;
const HEIGHT = 2209;
registerFont(fontPath, { family: "Bebas Neue" });
```
> High-resolution ticket (5880x2209px) — print quality.

```javascript
const canvas = createCanvas(WIDTH, HEIGHT);
const ctx = canvas.getContext("2d");
const bgBuffer = fs.readFileSync(templatePath);
const bgImage = new Image();
bgImage.src = bgBuffer;
ctx.drawImage(bgImage, 0, 0, WIDTH, HEIGHT);
```
> Template image load karo, canvas pe draw karo — ye background hai ticket ka.

```javascript
const buildLines = (text, fontFamily, fontSize, maxWidth) => {
  ctx.font = `${fontSize}px "${fontFamily}"`;
  const words = String(text).split(/\s+/).filter(Boolean);
  // ...word wrap logic...
};

const drawFittedText = (text, fontFamily, maxWidth, maxFont=170, minFont=40, maxLines=2) => {
  let size = maxFont;
  while (size >= minFont) {
    lines = buildLines(text, fontFamily, size, maxWidth);
    if (lines.length <= maxLines) break;
    size -= 2; // Reduce font size until it fits
  }
};
```
> **Auto-fit text:** Student ka naam chhota ho ya lamba, automatically font size adjust hoti hai taaki text overflow na ho. Binary search-like approach — start max se, 2px kam karo jab tak fit na ho jaaye.

```javascript
ctx.fillStyle = "#1f2937";
const studentName = String("Name: " + (student.name || "")).toUpperCase();
drawFittedText(studentName, "Bebas Neue", maxTextWidth, 170, 60, 2, 8);
```
> Name, Event title, Date, Time, Venue — sab dynamically ticket pe print hota hai. Uppercase Bebas Neue font — festival ticket feel.

```javascript
return canvas.toBuffer("image/png");
```
> Canvas ko PNG Buffer mein convert karo — yeh buffer email attachment ke roop mein jaata hai.

#### `utils/awsSendEmail.js` — Resend API Email Sender

> Note: File ka naam `awsSendEmail.js` hai lekin internally Resend API use ho rahi hai — originally AWS SES tha, baad mein Resend pe migrate kiya.

```javascript
const resend = new Resend(process.env.RESEND_API_KEY);

const awssendEmail = async (to, subject, html, attachments = []) => {
  const { data, error } = await resend.emails.send({
    from: `Team Renaissance <${process.env.VERIFIED_FROM_EMAIL}>`,
    to, subject, html, attachments: resendAttachments
  });
};
```
> Resend API se email bhejo with HTML body aur PNG attachments (event passes).

#### `utils/branchNormalizer.js`

```javascript
const BRANCH_MAP = {
  CSE: ["cse", "computer science", "computer science engineering"],
  CSAI: ["csai", "computer science and ai", "cse ai", "cse-ai"],
  // ...
};
export function normalizeBranch(input) {
  const cleaned = input.toString().toLowerCase().replace(/[^a-z& ]/g, "").trim();
  for (const [canonical, variants] of Object.entries(BRANCH_MAP)) {
    if (variants.includes(cleaned)) return canonical;
  }
  return null;
}
```
> Excel upload mein teachers "Computer Science Engineering", "CSE", "cse-ai" alag-alag likhte hain. Yeh function sab normalize karke canonical code deta hai.

#### `utils/excelNormalizer.js`

> Excel files ki pehli row headers hoti hain lekin format inconsistent hota hai. Yeh utility har column ka naam detect karta hai aur data standardize karta hai.

#### `utils/permissions.js` — RBAC Engine

```javascript
export const ROLE_LEVEL = { superadmin: 4, admin: 3, hod: 2, dean: 2, cc: 1 };

export function canCreate(creatorRole, targetRole) {
  if (creatorRole === "superadmin") return true;
  if (creatorRole === "admin") return ["hod", "dean", "cc"].includes(targetRole);
  return false;
}
```
> Centralized permission logic. Admin sirf HOD/Dean/CC create kar sakta hai, superadmin sabko.

---

## 5. Frontend Deep Dive

### 📄 `src/App.jsx` — Main App & Routing

```javascript
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
```
> **Client-side routing:** URL change hone pe page reload nahi hota — React Router sirf components swap karta hai.

```javascript
const Itinerary = lazy(() => import('./components/itinerary/itinerary.jsx'));
const Events = lazy(() => import('./page2/events/event.jsx'));
```
> **Code Splitting with lazy loading:** `lazy()` se component ka code sirf tab download hoga jab user us route pe jaayega. Initial bundle size choti rehti hai — faster first load.

```javascript
const targetTime = new Date("2026-02-03T15:30:00").getTime();
const [isLive, setIsLive] = useState(Date.now() >= targetTime);

useEffect(() => {
  if (isLive) return;
  const timer = setInterval(() => {
    if (Date.now() >= targetTime) { setIsLive(true); clearInterval(timer); }
  }, 30000); // Check every 30 seconds
  return () => clearInterval(timer);
}, [isLive, targetTime]);

if (!isLive) return <ComingSoonExact />;
```
> **Launch countdown:** February 3rd 2026 3:30 PM se pehle website Coming Soon page dikhayegi. Automatically live ho jaayegi bina server restart ke. `clearInterval` cleanup se memory leak nahi hoga.

```javascript
const TeacherLayout = () => (
  <div style={{ backgroundImage: `url(${teacherBg})`, backgroundAttachment: 'fixed' }}>
    <Outlet />
  </div>
);
```
> **Nested Routes:** Teacher panel ka ek wrapper layout component. `<Outlet />` child routes render karta hai yahan. Background image fixed rehti hai scroll ke saath.

```javascript
<Route path="/teacher" element={<TeacherLayout />}>
  <Route path="login" element={<TeacherLogin />} />
  <Route path="dashboard" element={<Dashboard />} />
</Route>
```
> Nested routing — `/teacher/login` aur `/teacher/dashboard` dono TeacherLayout ke andar render hote hain.

```javascript
const isTeacherPath = location.pathname.startsWith("/teacher");
// ...
{!isTeacherPath && <Nav />}
{!isTeacherPath && <Footer />}
```
> Teacher panel mein main website ka navbar aur footer nahi chahiye.

```javascript
<AnimatePresence mode="wait">
  {isLoading && <Preloader key="preloader" />}
</AnimatePresence>
```
> `AnimatePresence` Framer Motion ka component hai — component unmount hone pe exit animation run karta hai. `mode="wait"` — pehle old component exit karo, phir new enter karo.

### 🧭 `components/navbar/Nav.jsx`

```javascript
const [studentToken, setStudentToken] = useState(() => localStorage.getItem("token"));
```
> `useState` initializer function — component mount pe ek hi baar `localStorage` read hota hai.

```javascript
useEffect(() => {
  const updateToken = () => setStudentToken(localStorage.getItem("token"));
  window.addEventListener("student-auth-changed", updateToken);
  window.addEventListener("storage", updateToken);
  window.addEventListener("focus", updateToken);
  return () => { /* cleanup */ };
}, []);
```
> Custom event `student-auth-changed` — Login/Logout pe navbar ko update karna. `storage` event — doosri tab mein login/logout hone pe. `focus` — tab switch pe latest state.

```javascript
const handleSamePageClick = (e, to) => {
  if (location.pathname === to) {
    e.preventDefault();
    window.scrollTo(0, 0);
  }
  closeMenu();
};
```
> Same page pe click karne pe page top pe scroll — user experience improvement.

### 🔐 `components/login/login.jsx`

```javascript
const normalizeToken = (value) => {
  if (!value) return null;
  return value.startsWith("Bearer ") ? value.slice(7) : value;
};
```
> Token ko clean format mein rakhna — kabhi kabhi "Bearer " prefix aa jaata hai.

```javascript
const handleLogin = async (e) => {
  e.preventDefault(); // Default form submit (page reload) rokna
  setError("");
  setIsLoading(true);
  try {
    const response = await axios.post(API_URL, { email: email.toLowerCase(), password, phone });
    if (response.status === 200) {
      localStorage.setItem("token", response.data.token);
      window.dispatchEvent(new Event("student-auth-changed")); // Navbar update karo
      navigate("/");
    }
  } catch (e) {
    if (e.response?.data?.needsPhone) {
      setRequirePhone(true); // Phone input dikhao
    }
  } finally {
    setIsLoading(false); // Always reset loading
  }
};
```
> `e.preventDefault()` — form default behavior rok. `axios.post` se API call. Optional chaining `e.response?.data?.needsPhone` — agar response nahi hai toh crash nahi.

```javascript
export const EncryptButton = ({ onClick }) => {
  const scramble = () => {
    let pos = 0;
    intervalRef.current = setInterval(() => {
      const scrambled = TARGET_TEXT.split("").map((char, index) =>
        pos / CYCLES_PER_LETTER > index
          ? char
          : CHARS[Math.floor(Math.random() * CHARS.length)]
      ).join("");
      setText(scrambled);
      pos++;
      if (pos >= TARGET_TEXT.length * CYCLES_PER_LETTER) stopScramble();
    }, SHUFFLE_TIME);
  };
```
> **Scramble/Encrypt button animation:** "Login" text hover pe random characters mein scramble hota hai, phir letter-by-letter reveal. `CYCLES_PER_LETTER=2` matlab har letter 2 frames scramble hoga pehle reveal se.

### 🎪 `page2/events/event.jsx`

```javascript
useEffect(() => {
  const fetchEvents = async () => {
    const res = await fetch("https://ren-old.onrender.com/api/events/list");
    const data = await res.json();
    if (Array.isArray(data)) setCards(data);
  };
  fetchEvents();
}, []);
```
> Component mount pe events fetch karo. Array check — agar API error return kare toh `setCards([])` se crash nahi.

```javascript
const filteredCards = cards.filter((card) => {
  const matchesDay = !activeDay || cardDayStr === activeDay;
  const matchesCategory = !activeFilter || category === activeFilter;
  let matchesPrice = true;
  if (priceFilter === "free") matchesPrice = !isPaid;
  else if (priceFilter === "paid") matchesPrice = isPaid;
  return matchesDay && matchesCategory && matchesPrice;
});
```
> **Multi-filter logic:** Day, Category, aur Price teen independent filters. `!activeDay` matlab "All Days" — filter nahi lagana. Sab conditions AND hain.

```javascript
useEffect(() => {
  let timeoutId;
  const handleMouseMove = (e) => {
    if (!timeoutId) {
      timeoutId = setTimeout(() => {
        setMousePosition({ x: e.clientX, y: e.clientY });
        timeoutId = null;
      }, 16); // ~60fps throttle
    }
  };
  window.addEventListener("mousemove", handleMouseMove);
  return () => window.removeEventListener("mousemove", handleMouseMove);
}, []);
```
> **Throttled mouse tracking:** `mousemove` event bahut baar fire hota hai — har pixel pe. `setTimeout(fn, 16)` se 60fps pe limit kiya — performance optimization.

```javascript
{hoveredCardRect && !isScrolling && (
  <svg>
    <polygon points={`${torchX},0 ... ${hoveredCardRect.top}`}
      fill="url(#beamGradient)" filter="blur(8px)" />
  </svg>
)}
```
> **SVG Torch Effect:** Hovered card ke top se screen ke center tak ek beam banta hai. SVG polygon coordinates dynamically calculate hote hain card ki position se.

### 👩‍🏫 `page2/teacher/dashboard.jsx`

```javascript
const API_BASE = import.meta.env.VITE_API_BASE || "https://ren-old.onrender.com/api";
const authHeader = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem("teacherToken")}` }
});
```
> `import.meta.env` — Vite environment variables. `VITE_` prefix waale variables browser mein exposed hote hain. `authHeader()` function every API call mein use hota hai.

```javascript
const filteredStudents = useMemo(() => {
  const term = searchTerm.trim().toLowerCase();
  // ...filter logic...
}, [students, searchTerm, showPaidOnly, showUnpaidOnly, activeYearFilter, activeBranchFilter]);
```
> `useMemo` — filter calculation sirf tab re-run hogi jab dependencies change honge — performance optimization for large student lists.

```javascript
const [multiSelectEnabled, setMultiSelectEnabled] = useState(false);
const [bulkStudentIds, setBulkStudentIds] = useState([]);
const [bulkProcessing, setBulkProcessing] = useState(false);
```
> **Bulk operations:** Multiple students ki fee ek saath mark kar sako. Checkbox select → bulk action.

### 🖱️ `components/cursor/cursor.jsx`

```javascript
const words = ["technical", "नमस्ते", "रंगीन", "🎧", "cultural", "टशन", "🥁", "splash", "desi"];

const popWord = (x, y) => {
  const randomWord = words[Math.floor(Math.random() * words.length)];
  const id = Date.now() + Math.random(); // Unique ID
  setParticles((prev) => [...prev, newParticle]);
  setTimeout(() => {
    setParticles((prev) => prev.filter((p) => p.id !== id));
  }, 900); // Remove after 900ms
};
```
> Mouse move pe random Hindi/English words pop hote hain. `setTimeout` se 900ms baad particle remove. `Date.now() + Math.random()` — unique ID (millisecond mein bhi multiple particles ho sakte hain).

```javascript
const dx = x - lastPos.current.x;
const dy = y - lastPos.current.y;
const distance = Math.sqrt(dx * dx + dy * dy);
if (distance > 18) {
  popWord(x, y);
  lastPos.current = { x, y };
}
```
> **Distance threshold:** Sirf tab word pop karo jab mouse 18px move ho — warna cursor move karne pe spam hoga.

### 🎬 `page2/preloader/LoadingContext.jsx`

```javascript
const LoadingContext = createContext();
export const LoadingProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  useEffect(() => {
    const navEntry = performance.getEntriesByType("navigation")[0];
    if (navEntry?.type === "navigate") { setIsLoading(true); }
  }, []);
  return (
    <LoadingContext.Provider value={{ isLoading, setIsLoading }}>
      {children}
    </LoadingContext.Provider>
  );
};
```
> **Context API:** Loading state globally available — App.jsx mein Provider wrap kiya, Preloader component mein `setIsLoading(false)` call karta hai jab video khatam ho.
> `performance.getEntriesByType("navigation")` — fresh page load vs SPA navigation distinguish karta hai.

---

## 6. Database Design

```
MongoDB Collections:
├── students          → College students (email unique index)
├── teachers          → Admin/HOD/Dean users
├── events            → Festival events (metadata + UI data)
├── festivalpasses    → One per student (Day1/Day2/Day3 attendance)
├── outsiderpasses    → Non-college visitors' passes
├── festivaldays      → Date → Day mapping (e.g. "2026-03-06" → Day1)
├── appadmins         → App-level admins (different from teachers)
└── appstudents       → App-level student credentials
```

### Relationships

```
Student (1) ←→ (1) FestivalPass        [student field in FestivalPass]
Student (1) ←→ (N) Events              [events array in Student - denormalized]
Student (N) ←→ (1) Teacher             [markedBy field - who marked fee]
Teacher creates Teacher (self-ref RBAC)
```

---

## 7. Authentication & Security Flow

### Student Login Flow:
```
1. POST /api/students/login { email, password }
2. Rate limiter check (10 requests / 15 min)
3. DB mein student dhundo (email normalized)
4. bcrypt.compare(password, hash)
5. Phone check — agar nahi hai toh 428 return
6. JWT sign { id: student._id }, 1 day expiry
7. Token localStorage mein save
8. Protected routes: Authorization: Bearer <token>
9. authMiddleware: jwt.verify → DB se student fetch → req.student
```

### Teacher Login Flow:
```
1. POST /api/teacher/login { email, password }
2. DB mein teacher dhundo
3. bcrypt.compare
4. JWT sign { id, role, branch, year }, 7 day expiry
5. Token localStorage mein "teacherToken" key pe save
6. teacherAuth middleware: jwt.verify → role check → req.user
```

### RBAC (Role-Based Access Control):
```
superadmin → Sab kuch
admin → Teachers create/delete, Outsider data, Sab students
hod → Sirf apni branch ke students
dean → Sirf apne year ke students
cc → Sirf apni branch + year ke students
```

### Security Features:
- **bcrypt** with 10-12 rounds — rainbow table attacks se protection
- **JWT** — stateless, tamper-evident tokens
- **Rate Limiting** — brute force protection
- **Device ID binding** — ek account ek device
- **CORS whitelist** — only allowed origins
- **Atomic MongoDB operations** — race conditions prevent
- **Input validation** — email normalize, phone normalize, branch normalize

---

## 8. Email & Pass Generation Flow

```
Student registers for free event
        ↓
eventController → sendPassesToStudent(student, events)
        ↓
enqueueEmail() → p-limit concurrency control (max 5 parallel)
        ↓
generatePass(student, event) → node-canvas
  ├── Template PNG load karo (ren2026eventpass.png)
  ├── Canvas create karo (5880x2209)
  ├── Background draw karo
  ├── BebasNeue font register karo
  ├── Student name, event, date, time, venue draw karo
  │   └── Auto-fit text (font size 170 se 40 tak adjust)
  └── canvas.toBuffer("image/png") → Buffer return
        ↓
awssendEmail(to, subject, html, [{ filename, content: buffer }])
        ↓
resend.emails.send({ from, to, subject, html, attachments })
        ↓
Student ke email mein PNG pass attach hoke aata hai
```

**Teacher Fee Mark Flow (Master Pass):**
```
Teacher → toggleStudentFee → password_generator(8)
        ↓
bcrypt.hash(plainPassword, 10)
        ↓
bookTicket(student) → qrgen.js → QR code generate → Master Pass image → Email
        ↓
Student ko email mein master pass + login credentials
```

---

## 9. QR Scan & Attendance Flow

```
QR Scanner App → POST /api/scan { type: "INSIDER", passId: "64abc..." }
        ↓
scanLimiter (30 scans/min)
        ↓
type check → verifyPass(req, res)
        ↓
FestivalPass.findById(passId).populate("student")
        ↓
isActive check → false → "Pass inactive"
        ↓
FestivalDay.findOne({ date: today }) → festDay (Day 1/2/3)
        ↓
pass[dayField] already true? → "Already scanned" (409)
        ↓
pass[dayField] = true; pass.save()
        ↓
Return { valid: true, student: { name, email, branch, year } }
```

---

## 10. Deployment Architecture

```
┌─────────────────────────────────┐
│         Cloudflare CDN           │
│   (ren2026-assests.b-cdn.net)   │
│   Static assets: images, webp   │
│   videos, fonts                  │
└───────────────┬─────────────────┘
                │
┌───────────────▼─────────────────┐
│            Netlify               │
│    ren2026.netlify.app           │
│    jecrcrenaissance.co.in        │
│                                  │
│    - Vite build (dist folder)    │
│    - netlify.toml redirects:     │
│      /api/* → Render backend     │
│      /* → index.html (SPA)       │
└───────────────┬─────────────────┘
                │ Proxy
┌───────────────▼─────────────────┐
│             Render               │
│    ren-old.onrender.com          │
│    Node.js + Express server      │
│    PORT from env                 │
│    "0.0.0.0" all interfaces      │
└───────────────┬─────────────────┘
                │
┌───────────────▼─────────────────┐
│         MongoDB Atlas            │
│    Cloud database                │
│    Connection via MONGO_URI      │
└─────────────────────────────────┘
```

**netlify.toml ka kaam:**
```toml
[[redirects]]
  from = "/api/*"
  to = "https://ren-old.onrender.com/:splat"   # ← API calls backend pe proxy
  status = 200
  force = true

[[redirects]]
  from = "/*"
  to = "/index.html"                            # ← SPA routing ke liye
  status = 200
```
> Pehla redirect — `/api/` se start hone waale saare requests Render pe jaate hain.
> Doosra redirect — `/events`, `/about` etc direct browser refresh pe 404 nahi denge — index.html serve hoga aur React Router handle karega.

**Asset Strategy:**
- `config.js` mein `USE_CLOUD_ASSETS = true` — images Cloudflare CDN se aate hain
- CDN globally distributed hai — India ke users ko fast load time milta hai
- Videos aur heavy images CDN pe rakhne se Netlify bandwidth save hoti hai

---

## 11. Environment Variables

### Backend (.env)
```
MONGO_URI=mongodb+srv://...
JWT_SECRET=your_secret_key
PORT=5000
RESEND_API_KEY=re_...
VERIFIED_FROM_EMAIL=renaissance@jecrcfoundation.com
EMAIL_CONCURRENCY=5
BOOTSTRAP_ADMIN=true               # Only first time
ADMIN_EMAIL=admin@jecrc.ac.in
ADMIN_PASSWORD=strongpassword
```

### Frontend (.env)
```
VITE_API_BASE=https://ren-old.onrender.com/api
```

---

## 12. Final Technical Interview Questions

### 🔵 JavaScript / Node.js

**Q1: `require()` aur `import` mein kya farq hai?**
> `require()` CommonJS hai — synchronous, runtime pe load hota hai. `import` ES Modules hai — static, compile time pe analyze hota hai, tree-shaking support karta hai. Yeh project `"type": "module"` use karta hai isliye `import` hai.

**Q2: `async/await` vs `.then()/.catch()` — kab kya use karein?**
> Dono Promises handle karte hain. `async/await` zyada readable hai (synchronous code jaisa dikhta hai). `bookTicket(...).catch(err => ...)` fire-and-forget ke liye use hua — await nahi karna taaki UI block na ho.

**Q3: Event Loop kya hai? Yeh project mein kaise relevant hai?**
> Node.js single-threaded hai lekin event loop se async operations (DB queries, email sending) non-blocking hain. Email queue, Canvas generation, DB calls — sab non-blocking hain isliye server ek time pe multiple requests handle kar sakta hai.

**Q4: `Promise.all` vs sequential awaits mein performance difference?**
> `Promise.all([p1, p2])` dono parallel chalata hai — total time max(p1, p2). Sequential `await p1; await p2;` — p1 + p2 time lagta hai. Jab independent operations hain toh `Promise.all` better.

**Q5: Memory leak kaise prevent kiya `cursor.jsx` mein?**
> `useEffect` ke cleanup function mein `window.removeEventListener` kiya. Bina cleanup ke component unmount hone pe event listener active rehta — memory leak.

---

### 🟢 React

**Q6: `useState` vs `useRef` — kab kya use karein?**
> `useState` — value change pe re-render chahiye. `useRef` — value hold karna without re-render (cursor last position, interval ID, DOM element). `lastPos.current` aur `intervalRef.current` re-render nahi chahiye isliye `useRef`.

**Q7: `useMemo` kab use karna chahiye?**
> Jab expensive calculation ho jo har render pe repeat na ho. Dashboard mein `filteredStudents` 500+ students filter karta hai — `useMemo` se sirf tab recalculate hoga jab students/searchTerm change ho.

**Q8: `lazy()` aur `Suspense` ka kya kaam hai?**
> `lazy()` code splitting karta hai — component ka bundle sirf jab zarurat ho tab download. `Suspense` fallback dikhata hai jab component load ho raha ho. Initial bundle size choti hoti hai — faster First Contentful Paint.

**Q9: Context API vs Prop drilling — kab kya?**
> `LoadingContext` — isLoading state App.jsx se Preloader tak props pass karna hota (prop drilling). Context se directly koi bhi component consume kar sakta hai. Lekin Context se zyada use nahi karna — unnecessary re-renders.

**Q10: React Router mein nested routes kaise kaam karte hain?**
> Parent route `<Outlet />` render karta hai — child route ka component wahan render hota hai. TeacherLayout ek wrapper hai, `/teacher/login` aur `/teacher/dashboard` Outlet ki jagah render hote hain.

---

### 🟡 MongoDB / Mongoose

**Q11: `findOneAndUpdate` atomic kyun hai? Race condition kaise prevent hota hai?**
> MongoDB mein `findOneAndUpdate` ek single atomic operation hai — find aur update ek saath hote hain. Agar do concurrent requests aayein:
> - Request 1: `token: { $gt: 0 }` → match → token deduct
> - Request 2: Same time — agar token pehle hi 0 ho gaya toh `$gt: 0` match nahi karega → fail
> Separate find aur update mein gap hota — race condition possible.

**Q12: `populate()` kaise kaam karta hai? SQL JOIN se kaise alag hai?**
> `populate("student")` — FestivalPass mein `student` field ObjectId hai. Mongoose second query karta hai Student collection mein us ID ke liye aur replace kar deta hai. SQL JOIN ek single query mein hota hai — Mongoose do queries karta hai (manually optimize possible hai `$lookup` se).

**Q13: MongoDB mein `unique: true` aur `sparse: true` mein kya farq hai?**
> `unique: true` — us field pe unique index. Duplicate insert fail. `sparse: true` — index sirf un documents pe apply hota hai jahan field defined hai. `qrToken: { unique: true, sparse: true }` — null qrToken wale documents duplicate ho sakte hain.

**Q14: `$addToSet` vs `$push` mein kya farq hai?**
> `$push` always add karta hai — duplicates possible. `$addToSet` sirf add karta hai agar value already nahi hai — set semantics. Events array mein same event twice nahi jaana chahiye isliye `$addToSet`.

**Q15: Mongoose Schema mein conditional `required` kaise kaam karta hai?**
> `required: function() { return this.role === "hod"; }` — instance method, `this` current document hai. HOD ke liye branch required, doosron ke liye nahi.

---

### 🔴 Security

**Q16: bcrypt mein "rounds" (salt rounds) kya hote hain? 10 kyun?**
> bcrypt rounds = hash ke liye computation ka amount. Rounds=10 → 2^10 = 1024 iterations. Rounds=12 → 4096 iterations. High rounds = brute force slow. Modern hardware pe 10 rounds ~100ms/hash — acceptable balance. Server pe Admin creation mein 12 rounds use kiya (higher security).

**Q17: JWT stateless kyun hai? Iska kya faida/nuksan hai?**
> JWT mein sab data token mein encoded hai — server pe session store nahi karna. Faida: Horizontal scaling easy (any server validate kar sakta hai). Nuksan: Token revoke nahi kar sakte (logout pe server side session delete nahi hota) — isliye device-based `devices` array rakha gaya.

**Q18: CORS kyun lagana pada? Iske bina kya hota?**
> Browser Same-Origin Policy — agar frontend (netlify.app) aur backend (render.com) alag domains pe hain, browser preflight (OPTIONS) request bhejta hai. Backend CORS headers nahi deta toh browser actual request block kar deta. **Server pe koi restriction nahi — browser client-side block karta hai.**

**Q19: Rate limiting brute force attack kaise rokta hai?**
> 10 attempts / 15 min — attacker ko password guess karne ke liye maximum 10 tries milti hain. 15 min baad reset. Strong password ke liye probabilistic attack practically infeasible ho jaata hai.

**Q20: Input normalization (phone, branch, email) kyu zaroori hai?**
> Real-world data messy hoti hai — "CSE", "cse", "Computer Science" sab same branch hain. Bina normalization ke alag-alag entries ban jaati — data inconsistency. Email `lowercase()` aur `trim()` se "ABC@GMAIL.COM " aur "abc@gmail.com" same user hain.

---

### ⚡ Performance

**Q21: `p-limit` aur email queue kyun banaya?**
> 100 students ek saath register karein → 100 concurrent API calls to Resend → rate limit hit → emails fail. `pLimit(5)` se max 5 concurrent — queue mein baaki wait. Resend ke rate limits within rehte hain.

**Q22: Vite `manualChunks` kya karta hai? Performance kaise improve hoti hai?**
> GSAP, Framer Motion, Three.js — large libraries hain. `manualChunks` se yeh separate vendor chunks mein jaate hain. Browser cache karta hai — sirf jab library update ho tab re-download. App code change hone pe user vendor chunk dobara nahi downloadega.

**Q23: `compression` middleware ka faida kya hai?**
> HTTP responses gzip se compress hoti hain. JSON response 100KB → 15KB. Network pe kam data transfer → faster load → cheaper bandwidth.

**Q24: `backgroundAttachment: 'fixed'` kya karta hai? Performance tradeoff?**
> Background image scroll se fix rehti hai — parallax effect. **Performance issue:** Fixed background CSS paint optimization disable kar deta hai — scroll pe har frame pe repaint hota hai. Mobile pe janky ho sakta hai.

**Q25: Canvas image 5880x2209 kyun? Itna bada kyun?**
> Print-quality ticket — agar user print karna chahe toh pixelate nahi hoga. Web display ke liye over-sized hai lekin email attachment ke roop mein appropriate hai.

---

### 🏗️ Architecture & Design Patterns

**Q26: MVC pattern project mein kaise follow kiya gaya?**
> - **Model** — `models/` folder — Mongoose schemas (data)
> - **View** — Frontend React components (presentation)
> - **Controller** — `controllers/` folder — business logic
> - **Routes** — URL mapping to controllers
> Express particularly "MVC light" hai — no built-in view engine (React frontend alag hai)

**Q27: Fire-and-forget pattern kya hai? Yahan kyon use kiya?**
> `bookTicket(...).catch(err => log(err))` — await nahi kiya. HTTP response immediately bhej diya, email background mein process hoga. User ko 3-4 seconds wait nahi karna pata. Email eventually deliver hoga — eventual consistency acceptable hai yahan.

**Q28: Strategy pattern scan route mein kaise use hua?**
> `/scan` endpoint `type` field check karta hai — INSIDER ya OUTSIDER. Alag-alag "strategy" (verifyPass vs verifyOutsiderPass) call hoti hai. Naya type add karna easy hai bina existing code change kiye.

**Q29: Deployment mein Netlify proxy kyun use kiya?**
> Direct frontend → backend CORS pe depend karta hai. Netlify proxy se frontend `https://renaissance2026.netlify.app/api/` call karta hai — same domain lagta hai browser ko — CORS issue nahi. Aur backend URL user ko visible nahi hoti.

**Q30: `performance.getEntriesByType("navigation")` kya detect karta hai?**
> Browser navigation types: `"navigate"` (fresh URL), `"reload"` (F5), `"back_forward"` (browser back/forward), `"prerender"`. Preloader sirf `"navigate"` pe dikhana chahiye — React Router se page change pe reload nahi hota toh preloader nahi dikhna chahiye.

---

### 🎨 Frontend Advanced

**Q31: Framer Motion `AnimatePresence` kaise kaam karta hai?**
> React normally jab component unmount karta hai, woh immediately DOM se hata deta hai — exit animation impossible. `AnimatePresence` unmounting detect karta hai, exit animation complete hone tak DOM mein rakhta hai, phir remove karta hai.

**Q32: useScroll + useTransform se curtain effect kaise bana?**
> `useScroll({ target: celebsRef, offset: ["start end", "start start"] })` — jab Celebs section top screen ke bottom se top tak jaaye. `useTransform(entryProgress, [0, 1], ["-100%", "0%"])` — scroll progress ko curtain Y position mein map karo. `motion.div` pe `y: curtainY` — curtain upar se neecha aata hai.

**Q33: Custom event `student-auth-changed` kyun banaya? Redux/Context kyun nahi?**
> Yeh ek simple cross-component communication hai — sirf "token changed" signal. Redux/Context overhead zyada hota. Browser's built-in `CustomEvent` + `dispatchEvent` + `addEventListener` sufficient hai. Navbar simple `localStorage.getItem("token")` pe update ho jaata hai.

---

> 📌 **Tip for Interview:** In questions ke answers yaad karne se zyada important hai **kyon** choose kiya yeh samajhna. Interviewer choice ke reasons sunna chahta hai — tradeoffs, alternatives kyun reject kiye, production mein kya problems aayi.

---

**Project Built by:** Team Renaissance, JECRC Foundation  
**Tech Head:** Devang Sharma  
**Stack:** Node.js + Express + MongoDB (Backend) | React + Vite + Tailwind (Frontend)  
**Deployment:** Render (Backend) + Netlify (Frontend) + MongoDB Atlas (Database) + Cloudflare (CDN)
