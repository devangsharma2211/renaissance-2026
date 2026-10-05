# 🎭 Renaissance 2026 — Complete Technical Documentation

> A full-stack college festival management system built for JECRC Foundation's annual technical and cultural festival. This document covers the complete architecture, every layer of the codebase, all pipeline flows in detail, and a curated set of technical interview questions with answers.

---

## 📑 Table of Contents

1. [Project Overview](#1-project-overview)
2. [High-Level Architecture](#2-high-level-architecture)
3. [Technology Stack & Why Each Was Chosen](#3-technology-stack--why-each-was-chosen)
4. [Complete Pipeline Flows](#4-complete-pipeline-flows)
   - 4.1 Student Registration & Login Pipeline
   - 4.2 Event Registration Pipeline (with Race Condition Prevention)
   - 4.3 Fee Marking Pipeline
   - 4.4 Email & Pass Generation Pipeline
   - 4.5 QR Scan & Attendance Pipeline
   - 4.6 Teacher Login & RBAC Pipeline
   - 4.7 Excel Bulk Upload Pipeline
   - 4.8 Frontend Request Lifecycle (Vite → Netlify → Render)
5. [Backend Deep Dive](#5-backend-deep-dive)
   - server.js — Entry Point
   - Models — Database Schemas
   - Controllers
   - Middlewares
   - Routes
   - Utils / Utilities
6. [Frontend Deep Dive](#6-frontend-deep-dive)
   - App.jsx — Routing & Launch Gate
   - Navbar
   - Student Login
   - Events Page
   - Teacher Dashboard
   - Cursor Effect
   - Preloader
7. [Database Design](#7-database-design)
8. [Authentication & Security Model](#8-authentication--security-model)
9. [Deployment Architecture](#9-deployment-architecture)
10. [Environment Variables](#10-environment-variables)
11. [Technical Interview Questions & Answers](#11-technical-interview-questions--answers)

---

## 1. Project Overview

**Renaissance 2026** is the annual technical and cultural festival of JECRC Foundation. This project is a production full-stack web application that serves multiple distinct user groups simultaneously.

### What the system does

| Feature | Description |
|---|---|
| 🌐 **Public Website** | Landing page, event listings, itinerary, gallery, sponsor wall, team page |
| 🎫 **Student Registration** | Students log in with college credentials and register for events using token-based system |
| 👩‍🏫 **Teacher Admin Panel** | Role-restricted dashboard for marking fees, bulk uploading students via Excel, and scanning QR codes |
| 📧 **Automated Email Passes** | On successful event registration or fee payment, the system generates a personalized PNG pass and emails it automatically |
| 🔒 **Role-Based Access Control** | Five distinct roles — SuperAdmin, Admin, HOD, Dean, CC — each with different data access scopes |
| 🎟️ **Outsider Pass System** | Non-college visitors can receive Master or Event passes with their own QR codes |

### Core Design Goals
- **Zero downtime during peak registration** — atomic DB operations prevent double-booking
- **Decoupled email sending** — email failures never block the HTTP response
- **Minimal frontend bundle** — lazy loading and CDN offloading for fast first paint
- **Role isolation** — no role can accidentally access data outside its jurisdiction

---

## 2. High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                         USER (Browser)                           │
│              Students / Teachers / Volunteers                    │
└────────────────────────────┬─────────────────────────────────────┘
                             │  HTTPS
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│                    Cloudflare CDN                                 │
│             ren2026-assests.b-cdn.net                            │
│   Serves: images (.webp), videos (.mp4), fonts (.ttf)            │
│   Purpose: Offload heavy static assets → Netlify bandwidth saved │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│                        Netlify                                    │
│         jecrcrenaissance.co.in / renaissance2026.netlify.app      │
│                                                                  │
│  ┌─────────────────┐  ┌──────────────┐  ┌─────────────────────┐ │
│  │   Public Site   │  │Student Login │  │   Teacher Panel     │ │
│  │ Home / Events / │  │  JWT Auth    │  │ Dashboard / Scan /  │ │
│  │ Gallery / Teams │  │  Register    │  │ Upload / RBAC       │ │
│  └─────────────────┘  └──────────────┘  └─────────────────────┘ │
│                                                                  │
│  netlify.toml:                                                   │
│    /api/*  → proxy → Render backend                              │
│    /*      → index.html (SPA fallback)                           │
└────────────────────────────┬─────────────────────────────────────┘
                             │  REST API via Proxy (Axios / fetch)
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│                  Render.com — Node.js + Express                  │
│                     ren-old.onrender.com                         │
│                                                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────┐ │
│  │  /auth   │ │/students │ │ /events  │ │  /pass   │ │ /scan │ │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └───┬───┘ │
│       └────────────┴────────────┴─────────────┴───────────┘     │
│                               │                                  │
│                    ┌──────────▼──────────┐                       │
│                    │   Middleware Layer   │                       │
│                    │ authMiddleware       │                       │
│                    │ teacherAuth          │                       │
│                    │ rateLimiter          │                       │
│                    │ appAdminAuth         │                       │
│                    └──────────┬──────────┘                       │
│                               │                                  │
│                    ┌──────────▼──────────┐                       │
│                    │  Controllers Layer   │                       │
│                    │ authController       │                       │
│                    │ studentController    │                       │
│                    │ eventController      │                       │
│                    │ passController       │                       │
│                    │ outsiderController   │                       │
│                    └──────────┬──────────┘                       │
│                               │                                  │
│          ┌────────────────────┼────────────────────┐             │
│          ▼                    ▼                    ▼             │
│  ┌───────────────┐  ┌──────────────────┐  ┌─────────────────┐   │
│  │  MongoDB Atlas│  │  node-canvas     │  │   Resend API    │   │
│  │  (Database)   │  │  (Pass Images)   │  │   (Email Send)  │   │
│  └───────────────┘  └──────────────────┘  └─────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

---

## 3. Technology Stack & Why Each Was Chosen

### Backend

| Package | Version | Why This, Not Something Else |
|---|---|---|
| **Node.js** | LTS v20+ | Non-blocking I/O is essential here — DB queries, Canvas rendering, and email sending all run concurrently. PHP or Python (sync Django) would block on every heavy operation |
| **Express.js** | ^4.21 | Minimal and un-opinionated. Routes, middleware, and controllers can be structured exactly how the project needs them. Frameworks like NestJS would add unnecessary complexity for this scale |
| **MongoDB + Mongoose** | ^8.9 | The events schema needs UI metadata (icon, iconColor, image) alongside business data. In a relational DB this would require multiple tables and joins. MongoDB's flexible documents fit the festival data model naturally |
| **jsonwebtoken** | ^9.0 | Stateless authentication — the server doesn't need to store sessions. Any server replica can verify a token using the shared secret. Cookies + sessions would require sticky sessions or a shared session store |
| **bcrypt** | ^5.1 | Salted hashing — even if two users have the same password, their hashes differ. MD5/SHA are fast (bad for passwords) and reversible. bcrypt is intentionally slow |
| **Resend** | ^6.9 | Cleaner API than AWS SES, no DNS verification complexity for dev environments. Inbuilt delivery tracking and retry. Nodemailer requires setting up your own SMTP relay |
| **node-canvas** | ^3.1 | Server-side image generation — the pass PNG is created on the server and sent as an email attachment. No browser needed. `sharp` is used post-generation to compress the buffer |
| **ExcelJS** | ^4.4 | Reads `.xlsx` files in-memory. Teachers upload bulk student lists in Excel. `csv-parse` was insufficient since teachers use `.xlsx` format |
| **Multer** | ^2.0 | Standard Express file upload middleware. Handles `multipart/form-data` for Excel file uploads |
| **p-limit** | ^4.0 | Caps the number of simultaneous outgoing email API calls. Without this, 100 concurrent registrations would fire 100 simultaneous Resend API calls and hit rate limits |
| **express-rate-limit** | ^8.2 | Prevents brute-force attacks on login routes. Per-IP request counting with configurable windows and limits |
| **compression** | ^1.7 | Gzip-compresses all HTTP responses automatically. A 100 KB JSON response becomes ~15 KB — important for the events list which carries image URLs and metadata |
| **cors** | ^2.8 | Frontend (Netlify) and backend (Render) are on different domains. Without CORS headers, browsers block cross-origin requests. The allowed-origin list is explicitly whitelisted |
| **dotenv** | ^16.4 | Loads secrets from `.env` into `process.env`. Secrets never live in source code |
| **uuid** | ^11.0 | Generates collision-resistant unique tokens for outsider pass QR codes |

### Frontend

| Package | Version | Why This, Not Something Else |
|---|---|---|
| **React 18** | ^18.3 | Component model, Virtual DOM diffing, and the hooks system make building the complex interactive UI (events grid, teacher dashboard, modals) manageable. Vue or Svelte were considered but the team's existing knowledge was React |
| **Vite** | ^7.2 | 10–100× faster HMR than Create React App. ES module-native dev server. Production builds with Rollup produce lean chunks |
| **React Router DOM v7** | ^7.12 | Client-side routing — navigating between Home, Events, Teacher Dashboard happens without a full page reload. Nested routes allow the Teacher layout wrapper to persist |
| **Framer Motion** | ^12.29 | Declarative enter/exit animations. The preloader curtain, card hover states, and modal appear/disappear transitions use Framer Motion's `motion` components and `AnimatePresence` |
| **GSAP** | ^3.14 | Scroll-triggered animations (ScrollTrigger plugin). More performant than pure CSS animations for the complex celebrity reveal sequence |
| **Tailwind CSS v4** | ^4.1 | Utility-first approach eliminates context switching between JSX and CSS files. The entire UI — responsive layouts, hover effects, dark backgrounds — is done inline |
| **Axios** | ^1.13 | Compared to `fetch`, Axios auto-parses JSON, throws on 4xx/5xx, and supports request interceptors. The teacher dashboard uses interceptors to attach the auth header globally |
| **Lenis** | ^1.3 | Replaces browser-native scroll with a smooth lerp-based scroll. Gives the site its signature butter-smooth feel |
| **Lucide React** | ^0.562 | Tree-shakeable SVG icon library. Only imported icons are included in the bundle — unlike Font Awesome which loads the entire icon font |
| **jwt-decode** | ^4.0 | Decodes the JWT payload on the frontend to read the user role without making an API call. Note: this does NOT verify the signature — verification only happens on the server |
| **clsx + tailwind-merge** | latest | Safely merge conditional Tailwind class strings without class conflicts |

---

## 4. Complete Pipeline Flows

This section traces every major user action from the browser click all the way through the system and back, step by step.

---

### 4.1 Student Registration & Login Pipeline

```
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 1 — User opens the website                                    │
│                                                                     │
│  Browser → Netlify CDN → serves index.html + JS bundle             │
│  React boots, App.jsx checks: Date.now() >= targetTime?            │
│    YES → render main site                                           │
│    NO  → render <ComingSoonExact /> (countdown timer)              │
└──────────────────────────────────┬──────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 2 — Student clicks "Login" button on Navbar                   │
│                                                                     │
│  EncryptButton.onClick() → setIsOpen(true)                         │
│  Login modal animates in via Framer Motion (scale 0.9 → 1)         │
└──────────────────────────────────┬──────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 3 — Student submits email + password                          │
│                                                                     │
│  handleLogin() fires:                                               │
│    e.preventDefault()  ← stops page reload                         │
│    email.toLowerCase() ← normalize before sending                  │
│    axios.POST /api/students/login                                   │
└──────────────────────────────────┬──────────────────────────────────┘
                                   │  HTTP POST
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 4 — Netlify proxy intercepts /api/* request                  │
│                                                                     │
│  netlify.toml rule: /api/* → https://ren-old.onrender.com/:splat   │
│  Request forwarded to Render server with all headers intact        │
└──────────────────────────────────┬──────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 5 — Express server receives POST /api/students/login          │
│                                                                     │
│  Rate limiter middleware:                                           │
│    IP checked → under 10 attempts / 15 min? → proceed             │
│    Over limit → 429 Too Many Requests                              │
│                                                                     │
│  studentController.login():                                        │
│    normalizeEmail(email) → trim + lowercase                        │
│    Student.findOne({ email: normalizedEmail })                     │
│      Not found → 401 "Invalid credentials"                         │
│      Found → continue                                              │
│                                                                     │
│    bcrypt.compare(password, student.password)                      │
│      No match → 401                                                │
│      Match → continue                                              │
│                                                                     │
│    Phone check:                                                     │
│      student.phone exists? → skip                                  │
│      No phone in DB:                                               │
│        phone provided in request? → save it, continue             │
│        No phone provided → 428 { needsPhone: true }               │
│                                                                     │
│    jwt.sign({ id: student._id }, JWT_SECRET, { expiresIn: "1d" }) │
│    Return 200 { token, student: { name, token count } }            │
└──────────────────────────────────┬──────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 6 — Frontend handles the response                             │
│                                                                     │
│  200 success:                                                       │
│    localStorage.setItem("token", token)                            │
│    window.dispatchEvent(new Event("student-auth-changed"))         │
│      → Navbar listener fires → shows "Logout" button              │
│    navigate("/")                                                   │
│                                                                     │
│  428 needsPhone:                                                    │
│    setRequirePhone(true) → phone input field appears in modal      │
│    Student re-submits with phone → loop back to Step 3            │
│                                                                     │
│  4xx error:                                                         │
│    setError("Wrong credentials. Please try again.")                │
└─────────────────────────────────────────────────────────────────────┘
```

---

### 4.2 Event Registration Pipeline (with Race Condition Prevention)

This is the most complex pipeline in the system. It must handle concurrent requests safely.

```
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 1 — Student opens the Events page                             │
│                                                                     │
│  useEffect([]) fires on component mount                             │
│  fetch("GET /api/events/list")                                     │
│  Response is an array of event objects (with UI metadata)           │
│  setCards(data) → renders TiltCard grid                            │
│                                                                     │
│  Filters available: Day (1/2/3), Category, Price (free/paid/all)   │
│  filteredCards computed on every filter state change               │
└──────────────────────────────────┬──────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 2 — Student clicks a TiltCard → Modal opens                  │
│                                                                     │
│  setSelectedCard(card) → <Modal isOpen={true} />                   │
│  Modal shows: event title, description, image, register button     │
└──────────────────────────────────┬──────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 3 — Student clicks Register                                   │
│                                                                     │
│  axios.POST /api/events/register                                    │
│  Headers: Authorization: Bearer <JWT>                              │
│  Body: { eventId: card._id }                                       │
└──────────────────────────────────┬──────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 4 — Backend validation chain (eventController)                │
│                                                                     │
│  authMiddleware:                                                    │
│    Extract Bearer token from Authorization header                  │
│    jwt.verify(token, JWT_SECRET)                                    │
│      Expired / tampered → 401                                      │
│    Student.findById(decoded.id) → attach to req.student            │
│                                                                     │
│  Event.findById(eventId)                                           │
│    Not found → 404                                                 │
│                                                                     │
│  normalizeCategory(event.category) → "cultural"/"technical"/"splash"│
│  resolvePaidFlag(event) → checks isPaid / Paid / paid fields       │
└──────────────────────────────────┬──────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 5 — Business rules validation                                 │
│                                                                     │
│  Rule 1: Already registered?                                        │
│    student.events.includes(eventId) → 400 "Already registered"     │
│                                                                     │
│  Rule 2: Free event token check                                     │
│    !isPaid && student.token <= 0 → 400 "No tokens left"            │
│                                                                     │
│  Rule 3: Splash event limit                                         │
│    Free splash event already registered?                           │
│    AND current event is not BGMI or REAL CRICKET?                  │
│    → 400 "Can register only one splash event"                      │
│                                                                     │
│  Rule 4: Fee paid check (for paid events)                           │
│    isPaid && !student.isPaid → 400 "Pay festival fee first"         │
└──────────────────────────────────┬──────────────────────────────────┘
                                   │ All rules passed
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 6 — ATOMIC MongoDB update (Race Condition Prevention)         │
│                                                                     │
│  WHY ATOMIC?                                                        │
│  Without atomic ops: Two requests arrive simultaneously.           │
│  Both read student.token = 1. Both see token > 0. Both deduct.     │
│  Result: token goes to -1. Double registration. Data corruption.   │
│                                                                     │
│  THE SOLUTION — findOneAndUpdate with conditions in the filter:     │
│                                                                     │
│  Student.findOneAndUpdate(                                          │
│    {                                                                │
│      _id: student._id,                                             │
│      token: { $gt: 0 },         ← condition: token must be > 0    │
│      events: { $ne: event._id } ← condition: not already in array │
│    },                                                               │
│    {                                                                │
│      $addToSet: { events: event._id }, ← add without duplicates   │
│      $inc: { token: -1 }               ← deduct atomically        │
│    },                                                               │
│    { new: true }                       ← return updated doc        │
│  )                                                                  │
│                                                                     │
│  MongoDB processes this as ONE atomic operation.                    │
│  If two requests arrive simultaneously:                             │
│    Request A: filter matches → update succeeds → token becomes 0  │
│    Request B: filter runs → token is now 0, $gt: 0 fails → null   │
│  Request B gets null back → handled as error → no double booking  │
│                                                                     │
│  updatedStudent === null?                                           │
│    Re-fetch student to diagnose:                                   │
│      Already in events array → 400 "Already registered"            │
│      Token is 0 → 400 "No tokens left"                            │
└──────────────────────────────────┬──────────────────────────────────┘
                                   │ Update succeeded
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 7 — Trigger email pass (fire-and-forget)                      │
│                                                                     │
│  sendPassToStudent(student, [event])    ← NOT awaited              │
│    .catch(err => console.error(err))   ← errors logged, not thrown │
│                                                                     │
│  HTTP 200 returned to frontend immediately.                        │
│  Email processing continues in background (see Pipeline 4.4)      │
│                                                                     │
│  Why not await?                                                     │
│  Canvas image generation + API call takes 2-4 seconds.            │
│  User should not wait for email delivery to get their confirmation.│
└──────────────────────────────────┬──────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│  STEP 8 — Frontend shows success                                    │
│                                                                     │
│  Modal closes, success toast shown                                  │
│  Student receives email with PNG pass within ~5 seconds            │
└─────────────────────────────────────────────────────────────────────┘
```

---

### 4.3 Fee Marking Pipeline

```
┌──────────────────────────────────────────────────────────────────┐
│  STEP 1 — Teacher logs into dashboard, searches student          │
│                                                                  │
│  GET /api/teacher/students → filtered by teacher's scope         │
│  useMemo recomputes filteredStudents on search/filter change      │
└─────────────────────────────┬────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  STEP 2 — Teacher clicks "Mark Paid" toggle                      │
│                                                                  │
│  PATCH /api/pass/toggle                                          │
│  Headers: Authorization: Bearer <teacherToken>                   │
│  Body: { id: studentId, isPaid: true }                           │
└─────────────────────────────┬────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  STEP 3 — RBAC Scope Check (passController.toggleStudentFee)     │
│                                                                  │
│  teacherAuth middleware: jwt.verify → attaches req.user (actor) │
│                                                                  │
│  actor.role === "superadmin" or "admin" → access all students   │
│  actor.role === "hod"  → student.branch must === actor.branch   │
│  actor.role === "dean" → student.Year must === actor.year        │
│  actor.role === "cc"   → branch AND year must match             │
│                                                                  │
│  Mismatch → 403 Forbidden                                        │
└─────────────────────────────┬────────────────────────────────────┘
                              │ Scope check passed
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  STEP 4 — First time fee mark (isPaid: true, no pass exists)     │
│                                                                  │
│  1. password_generator(8) → random 8-char alphanumeric string   │
│  2. bcrypt.hash(plainPassword, 10) → hashed password            │
│  3. student.password = hashedPassword                           │
│  4. FestivalPass.create({                                        │
│       student: student._id,                                      │
│       Day1: false, Day2: false, Day3: false,                    │
│       isActive: true                                             │
│     })                                                           │
│  5. student.token += 4  → 4 free registration tokens credited  │
│  6. student.isPaid = true                                        │
│  7. student.markedBy = actor._id                                │
│  8. student.markedAt = new Date()                               │
│  9. await student.save()                                         │
│                                                                  │
│  bookTicket(student._id, ...)  ← fire-and-forget (see 4.4)     │
│    sends: master pass PDF/PNG + login credentials via email     │
└─────────────────────────────┬────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  STEP 5 — Fee revoke (isPaid: false)                             │
│                                                                  │
│  student.isPaid = false                                          │
│  student.token = 0  → tokens revoked                            │
│  festivalPass.isActive = false  → QR no longer scannable        │
│  await student.save() + await festivalPass.save()               │
│                                                                  │
│  Student cannot enter festival, cannot register events          │
└──────────────────────────────────────────────────────────────────┘
```

---

### 4.4 Email & Pass Generation Pipeline

This pipeline runs entirely asynchronously — the HTTP response is sent before this completes.

```
┌──────────────────────────────────────────────────────────────────┐
│  TRIGGER: sendPassToStudent(student, events) called              │
│  Context: After event registration OR after fee mark             │
└────────────────────────┬─────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│  STEP 1 — Email Queue (Concurrency Control)                      │
│                                                                  │
│  enqueueEmail(() => sendPassToStudent(student, events))          │
│                                                                  │
│  p-limit(5) — at most 5 email jobs run in parallel              │
│                                                                  │
│  WHY THIS MATTERS:                                               │
│  During peak registration (100 students in 2 minutes),          │
│  without p-limit: 100 simultaneous Resend API calls             │
│  → Resend rate limit hit → emails start failing silently       │
│                                                                  │
│  With p-limit(5):                                               │
│  Job 1–5 start immediately                                       │
│  Jobs 6–100 wait in queue                                        │
│  Each time a job finishes, the next one starts                  │
│  All 100 emails eventually sent, none rate-limited             │
└────────────────────────┬─────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│  STEP 2 — Canvas Image Generation (bookEventPasses.js)           │
│                                                                  │
│  For each event the student registered for:                     │
│                                                                  │
│  a) Load template image from disk                               │
│     fs.readFileSync(path/to/ren2026eventpass.png)               │
│                                                                  │
│  b) Create Canvas                                               │
│     const canvas = createCanvas(5880, 2209)                     │
│     const ctx = canvas.getContext("2d")                         │
│     WHY 5880×2209? → Print quality at 300 DPI for A4 landscape  │
│                                                                  │
│  c) Draw background template                                    │
│     ctx.drawImage(bgImage, 0, 0, 5880, 2209)                    │
│                                                                  │
│  d) Register custom font                                        │
│     registerFont("Bebas Neue") → festival aesthetic             │
│                                                                  │
│  e) Draw student data with auto-fitting text                    │
│                                                                  │
│     drawFittedText(student.name):                               │
│       Start at maxFont = 170px                                  │
│       buildLines() → word-wrap at maxWidth                      │
│       lines > 2? → reduce font by 2px → retry                  │
│       Repeat until name fits in 2 lines or minFont=40 reached  │
│                                                                  │
│     Same process for: event title, venue, date, time           │
│                                                                  │
│  f) Convert to buffer                                           │
│     canvas.toBuffer("image/png") → PNG binary buffer           │
└────────────────────────┬─────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│  STEP 3 — Send Email via Resend API (awsSendEmail.js)            │
│                                                                  │
│  NOTE: File is named awsSendEmail.js — originally used AWS SES, │
│  later migrated to Resend. Filename unchanged to avoid imports  │
│  breaking.                                                      │
│                                                                  │
│  resend.emails.send({                                            │
│    from: "Team Renaissance <renaissance@jecrcfoundation.com>",  │
│    to: student.email,                                           │
│    subject: "Your Event Pass — Renaissance 2026",               │
│    html: "<styled HTML body>",                                  │
│    attachments: [{                                              │
│      filename: "EventPass.png",                                 │
│      content: pngBuffer  ← the Canvas output                   │
│    }]                                                            │
│  })                                                              │
│                                                                  │
│  Success → { data: { id: "email_xxxx" } }                       │
│  Failure → error logged, NOT thrown (won't crash server)        │
└────────────────────────┬─────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│  STEP 4 — Mark pass as sent                                      │
│                                                                  │
│  student.passSent = true                                         │
│  await student.save()                                            │
│                                                                  │
│  This flag prevents duplicate emails on server restart          │
└──────────────────────────────────────────────────────────────────┘
```

---

### 4.5 QR Scan & Attendance Pipeline

```
┌──────────────────────────────────────────────────────────────────┐
│  TRIGGER: Volunteer scans a student's QR code at venue gate      │
│  QR contains: { type: "INSIDER", passId: "64abc123..." }         │
│                                                                  │
│  POST /api/scan { type, passId }                                 │
└────────────────────────┬─────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│  STEP 1 — Rate Limit Check                                       │
│                                                                  │
│  scanLimiter: 30 requests / 1 minute per IP                      │
│  Prevents scanner bots or accidental rapid-fire scans           │
└────────────────────────┬─────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│  STEP 2 — Route Dispatch (Strategy Pattern)                      │
│                                                                  │
│  normalizedType = type.toUpperCase()                             │
│                                                                  │
│  "INSIDER"  → verifyPass(req, res)      ← college students      │
│  "OUTSIDER" → verifyOutsiderPass(passId) ← external visitors   │
│  anything else → 400 "Invalid QR"                               │
└────────────────────────┬─────────────────────────────────────────┘
                         │ INSIDER path
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│  STEP 3 — Pass Lookup                                            │
│                                                                  │
│  FestivalPass.findById(passId).populate("student")              │
│    Not found → 404 "Pass not found"                              │
│    !pass.isActive → 403 "Pass inactive (fee revoked)"           │
└────────────────────────┬─────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│  STEP 4 — Determine Today's Festival Day                         │
│                                                                  │
│  const today = new Date().toLocaleDateString("en-CA")           │
│  → Always produces "YYYY-MM-DD" format regardless of system TZ  │
│                                                                  │
│  FestivalDay.findOne({ date: today })                           │
│    No matching day → 400 "Not a festival day"                   │
│    Found → festDay.day is 1, 2, or 3                            │
│    dayField = "Day1" / "Day2" / "Day3"                          │
└────────────────────────┬─────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│  STEP 5 — Double-Scan Prevention                                 │
│                                                                  │
│  pass[dayField] === true?                                        │
│    → 409 Conflict "Already scanned for Day X"                   │
│    → Volunteer sees alert, denies entry                          │
│                                                                  │
│  pass[dayField] === false                                        │
│    → pass[dayField] = true                                       │
│    → await pass.save()                                           │
│    → 200 { valid: true, student: { name, branch, year } }       │
│    → Volunteer's scanner shows green ✓ → student enters         │
└──────────────────────────────────────────────────────────────────┘
```

---

### 4.6 Teacher Login & RBAC Pipeline

```
┌──────────────────────────────────────────────────────────────────┐
│  STEP 1 — Teacher opens /teacher/login                           │
│                                                                  │
│  React Router renders TeacherLogin component inside TeacherLayout│
│  TeacherLayout wraps with fixed background image                 │
│  Main site Navbar and Footer are hidden (isTeacherPath check)   │
└────────────────────────┬─────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│  STEP 2 — POST /api/teacher/login { email, password }            │
│                                                                  │
│  Teacher.findOne({ email })                                      │
│  bcrypt.compare(password, teacher.password)                      │
│    Fail → 401                                                   │
│                                                                  │
│  jwt.sign({                                                      │
│    id: teacher._id,                                             │
│    role: teacher.role,     ← "superadmin" / "admin" / "hod" etc│
│    branch: teacher.branch, ← for hod/cc scope filtering        │
│    year: teacher.year      ← for dean/cc scope filtering       │
│  }, JWT_SECRET, { expiresIn: "7d" })                            │
│                                                                  │
│  200 { token }                                                   │
│  Frontend: localStorage.setItem("teacherToken", token)          │
│  navigate("/teacher/dashboard")                                  │
└────────────────────────┬─────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│  STEP 3 — Every dashboard API call                               │
│                                                                  │
│  authHeader() helper attaches:                                   │
│    Authorization: Bearer <teacherToken>                          │
│                                                                  │
│  teacherAuth middleware:                                         │
│    Extract token from header                                     │
│    jwt.verify(token, JWT_SECRET)                                 │
│      Expired/tampered → 401                                     │
│    !user.role → 403 "Role missing in token"                     │
│    req.user = decoded payload                                    │
│    next()                                                        │
└────────────────────────┬─────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│  STEP 4 — RBAC Permission Matrix                                 │
│                                                                  │
│  Role          │ Can see/edit students     │ Can create roles   │
│  ──────────────┼───────────────────────────┼────────────────── │
│  superadmin    │ ALL students              │ ALL roles          │
│  admin         │ ALL students              │ hod, dean, cc      │
│  hod           │ Own branch only           │ None               │
│  dean          │ Own year only             │ None               │
│  cc            │ Own branch + own year     │ None               │
│                                                                  │
│  Enforced at controller level:                                   │
│  if (actor.role === "hod" && student.branch !== actor.branch)   │
│    → 403 Forbidden                                              │
└──────────────────────────────────────────────────────────────────┘
```

---

### 4.7 Excel Bulk Upload Pipeline

```
┌──────────────────────────────────────────────────────────────────┐
│  STEP 1 — Teacher selects .xlsx file in dashboard                │
│                                                                  │
│  <input type="file" accept=".xlsx" ref={fileInputRef} />        │
│  onChange → POST /api/teacher/upload (multipart/form-data)      │
└────────────────────────┬─────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│  STEP 2 — Multer middleware receives file                        │
│                                                                  │
│  multer({ storage: memoryStorage() })                            │
│  File stored in req.file.buffer (not written to disk)           │
│  Safer and faster for temporary processing                      │
└────────────────────────┬─────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│  STEP 3 — Excel parsing (ExcelJS)                                │
│                                                                  │
│  const workbook = new ExcelJS.Workbook()                         │
│  await workbook.xlsx.load(req.file.buffer)                       │
│  const sheet = workbook.worksheets[0]                            │
│                                                                  │
│  excelNormalizer.js:                                             │
│    Reads header row → maps column indices to field names        │
│    Handles different column orderings across Excel files        │
│    Extracts: name, email, branch, year, phone                   │
└────────────────────────┬─────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│  STEP 4 — Data normalization per row                             │
│                                                                  │
│  email → normalizeEmail() → trim + lowercase                     │
│  branch → normalizeBranch() →                                   │
│    "Computer Science Engineering" → "CSE"                       │
│    "cse-ai" → "CSAI"                                            │
│    "Mech" → "ME"                                                │
│  phone → normalizePhone() → strip non-digits, validate 10 chars │
└────────────────────────┬─────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│  STEP 5 — Upsert each student                                    │
│                                                                  │
│  Student.findOneAndUpdate(                                       │
│    { email: normalizedEmail },                                   │
│    { $setOnInsert: { ...studentData } },                         │
│    { upsert: true }                                              │
│  )                                                               │
│                                                                  │
│  upsert: true → creates if not exists, ignores if exists        │
│  $setOnInsert → only sets fields on new documents (won't        │
│    overwrite an existing student's isPaid status)               │
│                                                                  │
│  Returns: { inserted: N, skipped: M, errors: [...] }            │
└──────────────────────────────────────────────────────────────────┘
```

---

### 4.8 Frontend Request Lifecycle (Vite → Netlify → Render)

Understanding exactly how a frontend API call travels is important for debugging.

```
┌──────────────────────────────────────────────────────────────────┐
│  DEVELOPMENT ENVIRONMENT                                         │
│                                                                  │
│  Browser → Vite dev server (localhost:5173)                      │
│  vite.config.js proxy:                                           │
│    /api/* → http://localhost:5000 (local Express)               │
│                                                                  │
│  This means the browser always thinks it's talking to :5173.    │
│  No CORS issue because same origin.                             │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│  PRODUCTION ENVIRONMENT                                          │
│                                                                  │
│  1. Developer runs: npm run build                                │
│     Vite compiles src/ → dist/ folder                           │
│     - Tree shaking removes unused code                          │
│     - manualChunks splits vendor libs (framer, gsap) into      │
│       separate cacheable files                                   │
│     - Assets hashed: "main.a3f9c2.js" (cache busting)          │
│                                                                  │
│  2. dist/ folder deployed to Netlify                            │
│     netlify.toml applied at edge:                               │
│                                                                  │
│     Rule 1: /api/*                                              │
│       from = "/api/*"                                           │
│       to   = "https://ren-old.onrender.com/:splat"             │
│       status = 200 (proxy, not redirect)                        │
│       force = true (overrides any matching static file)         │
│                                                                  │
│       axios.post("/api/students/login") in browser              │
│       → Netlify edge intercepts                                 │
│       → forwards to https://ren-old.onrender.com/api/students/login│
│       → browser sees same-origin response                       │
│       → NO CORS headers needed from backend for browser        │
│                                                                  │
│     Rule 2: /*                                                  │
│       from = "/*"                                               │
│       to   = "/index.html"                                      │
│       status = 200                                              │
│                                                                  │
│       User types: jecrcrenaissance.co.in/events in browser     │
│       Without this rule: Netlify looks for /events.html → 404  │
│       With this rule: serves index.html → React boots →        │
│         React Router reads /events URL → renders Events page   │
│                                                                  │
│  3. Static assets served from Cloudflare CDN                    │
│     config.js: USE_CLOUD_ASSETS = true                          │
│     getAsset("/teams/bg.webp")                                  │
│       → "https://ren2026-assests.b-cdn.net/teams/bg.webp"      │
│                                                                  │
│     CDN benefits:                                               │
│     - Files served from nearest edge node (Delhi, Mumbai, etc.) │
│     - Netlify bandwidth not consumed by large images/videos     │
│     - Browser caches CDN URLs aggressively                      │
└──────────────────────────────────────────────────────────────────┘
```

---

## 5. Backend Deep Dive

### `server.js` — Entry Point

```javascript
console.log("THIS IS THE ACTIVE SERVER FILE");
```
Confirms the correct file is loaded during deployment. Multiple versions of server files can exist during refactoring; this log is an explicit sanity check.

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
ES Module `import` syntax — `package.json` has `"type": "module"`. Unlike `require()`, ES imports are statically analyzed at parse time, enabling tree-shaking and faster startup.

```javascript
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
```
In ES Modules, `__dirname` is not available automatically (it is in CommonJS). `import.meta.url` gives the current file's URL (e.g., `file:///app/server.js`). `fileURLToPath` converts it to a file system path. `path.dirname` extracts the directory.

```javascript
dotenv.config({ path: path.join(__dirname, '.env') });
```
Explicit path to `.env` prevents loading issues when the process is started from a different working directory.

```javascript
app.use(compression());
```
Gzip middleware. Every JSON response, every HTML response is compressed before sending. Typical compression ratio is 5:1 to 10:1 on JSON text.

```javascript
app.use(cors({
  origin: ["https://renaissance2026.netlify.app", "https://jecrcrenaissance.co.in", "http://localhost:5173"],
  methods: ["GET", "POST", "PATCH", "DELETE", "PUT", "CREATE"],
  credentials: false
}));
```
CORS whitelist. `credentials: false` because the app uses JWT in headers, not cookies. If cookies were used, `credentials: true` would be required and the origin could not be a wildcard.

```javascript
app.use('/images', express.static(path.join(__dirname, 'images'), { maxAge: '7d' }));
```
Serves the `images/` folder as static files. `maxAge: '7d'` sets the `Cache-Control: max-age=604800` header — browsers cache these files for 7 days.

```javascript
if (!process.env.MONGO_URI) {
  process.exit(1);
}
```
Fail-fast pattern. If the database URI is missing, crashing immediately is better than running in a half-functional state where every request fails with an obscure error.

```javascript
app.listen(PORT, "0.0.0.0", () => ...);
```
`"0.0.0.0"` binds to all network interfaces, not just loopback. Required for cloud platforms like Render where the server must be reachable from outside the container.

---

### Models — Database Schemas

#### `models/student.js`

```javascript
const studentSchema = new mongoose.Schema({
  name:      { type: String, required: true, trim: true },
  email:     { type: String, required: true, unique: true, trim: true, lowercase: true },
  branch:    { type: String, required: true, trim: true },
  Year:      { type: Number, required: true },
  phone:     { type: String, trim: true, default: null },
  isPaid:    { type: Boolean, default: false, required: true },
  markedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', default: null },
  markedAt:  { type: Date, default: null },
  password:  { type: String, trim: true },
  token:     { type: Number, default: 0 },
  passSent:  { type: Boolean, default: false },
  events:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'Event', default: [] }]
});
```

| Field | Purpose |
|---|---|
| `email: unique` | Creates a MongoDB unique index. Duplicate inserts throw error code 11000 |
| `email: lowercase` | Transforms on write — `"ABC@GMAIL.COM"` stored as `"abc@gmail.com"` |
| `markedBy: ref: 'Teacher'` | Reference to the Teacher who marked the fee. `populate('markedBy')` replaces the ObjectId with the full Teacher document |
| `token: Number` | Registration tokens. Starts at 0, gets +4 when fee is paid. Decrements by 1 per free event |
| `events: [ObjectId]` | Denormalized array of registered event IDs. Using `$addToSet` prevents duplicates at the DB level |
| `passSent: Boolean` | Prevents duplicate pass emails on server restart or retry |

#### `models/Teacher.js`

```javascript
role:   { type: String, enum: ["superadmin", "admin", "hod", "dean", "cc"] },
branch: { required: function() { return ["hod", "cc"].includes(this.role); } },
year:   { required: function() { return ["dean", "cc"].includes(this.role); } }
```

`enum` enforces valid values at the MongoDB driver level. The conditional `required` functions use `this` to reference the current document being validated — HODs must have a branch, Deans must have a year, and CC must have both.

#### `models/FestivalPass.js`

```javascript
const FestivalPassSchema = new mongoose.Schema({
  student:  { type: ObjectId, ref: "Student", unique: true },
  Day1:     { type: Boolean, default: false },
  Day2:     { type: Boolean, default: false },
  Day3:     { type: Boolean, default: false },
  isActive: { type: Boolean, default: true }
});
```

One pass per student (`unique: true`). Each Day field flips to `true` when the QR is scanned at the gate. `isActive: false` disables the pass without deleting it — audit trail preserved.

#### `models/OutsiderPass.js`

```javascript
qrToken: { type: String, unique: true, sparse: true }
```

`sparse: true` on a unique index — the uniqueness constraint only applies to documents where `qrToken` is not null. Without `sparse`, having two documents with `qrToken: null` would violate uniqueness.

#### `models/event.js`

```javascript
{
  name, category: { enum: ['technical', 'splash', 'cultural'] },
  isPaid: Boolean, day, venue, date, time,
  title, subtitle, icon, iconColor, image,
  description, actionLabel
}
```

UI metadata (icon name string, iconColor CSS class, image URL) is stored in MongoDB rather than hardcoded in the frontend. This means an admin can update event details, icons, and images without a code deploy.

---

### Controllers

#### `authController.js` — Dual-Role Login

```javascript
let account = await AppAdmin.findOne({ email: normalizedEmail });
let role = "admin";
if (!account) {
  account = await AppStudent.findOne({ email: normalizedEmail });
  role = "student";
}
```
A single login endpoint handles both admins and students. The DB is checked in priority order — admin first, then student.

```javascript
const devices = Array.isArray(account.devices) ? account.devices : [];
if (!devices.includes(deviceId)) {
  if (devices.length >= maxDevices) {
    return res.status(403).json({ msg: "Device limit reached" });
  }
  devices.push(deviceId);
}
```
Device binding prevents credential sharing. Each login generates a `deviceId` fingerprint. If the account already has `maxDevices` different device IDs, the new login is rejected.

#### `eventController.js` — Atomic Registration

```javascript
const resolvePaidFlag = (event) => {
  if (typeof event.isPaid === "boolean") return event.isPaid;
  if (typeof event.Paid === "boolean") return event.Paid;
  if (typeof event.paid === "boolean") return event.paid;
  return false;
};
```
Defensive programming — early documents in the database used `isPaid`, later ones used `Paid`. This resolver handles all variants without requiring a migration.

The atomic update (detailed in Pipeline 4.2) uses `findOneAndUpdate` with conditions embedded in the filter clause to prevent race conditions.

#### `passController.js` — Fee Management & QR Verify

```javascript
const today = new Date().toLocaleDateString('en-CA');
```
The `'en-CA'` locale always produces `YYYY-MM-DD` regardless of the server's system timezone. Using `toISOString().slice(0, 10)` is an alternative, but `en-CA` is more explicit about intent.

---

### Middlewares

#### `authMiddleware.js`

```javascript
const authHeader = req.header("Authorization");
const token = authHeader.split(" ")[1];        // Remove "Bearer " prefix
const decoded = jwt.verify(token, JWT_SECRET); // Throws if expired or tampered
const student = await Student.findById(decoded.id);
req.student = student;
next();
```
Attaches the student object to `req` so controllers receive it without another DB query.

#### `rateLimiter.js`

```javascript
export const studentLoginLimiter = createLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: "Too many login attempts. Try again after 15 minutes."
});

export const scanLimiter = createLimiter({
  windowMs: 1 * 60 * 1000,  // 1 minute
  max: 30
});
```
Login limiter prevents brute-force password guessing. Scan limiter prevents scanner bots from flooding the attendance system. `standardHeaders: true` exposes `RateLimit-Remaining` in response headers.

---

### Utils

#### `emailQueue.js`

```javascript
import pLimit from 'p-limit';
const concurrency = parseInt(process.env.EMAIL_CONCURRENCY || '5', 10);
const limit = pLimit(concurrency);
export const enqueueEmail = (fn) => limit(() => fn());
```
`EMAIL_CONCURRENCY` is configurable via environment variable. Default of 5 works within Resend's free tier. Can be increased on paid plans.

#### `branchNormalizer.js`

```javascript
const BRANCH_MAP = {
  CSE:  ["cse", "computer science", "computer science engineering", "cse(ai)"],
  CSAI: ["csai", "computer science and ai", "cse ai", "cse-ai"],
  ME:   ["me", "mechanical", "mechanical engineering", "mech"],
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
Teachers upload Excel files from different departments with inconsistent branch naming. This normalizer maps all variants to a canonical code, preventing data fragmentation across collections.

#### `permissions.js` — RBAC Engine

```javascript
export const ROLE_LEVEL = { superadmin: 4, admin: 3, hod: 2, dean: 2, cc: 1 };

export function canCreate(creatorRole, targetRole) {
  if (creatorRole === "superadmin") return true;
  if (creatorRole === "admin") return ["hod", "dean", "cc"].includes(targetRole);
  return false;
}
```
Centralizing permission logic here means controllers don't contain scattered if-else chains. Any permission change is made in one place.

---

## 6. Frontend Deep Dive

### `src/App.jsx` — Routing & Launch Gate

```javascript
const targetTime = new Date("2026-02-03T15:30:00").getTime();
const [isLive, setIsLive] = useState(Date.now() >= targetTime);

useEffect(() => {
  if (isLive) return;
  const timer = setInterval(() => {
    if (Date.now() >= targetTime) { setIsLive(true); clearInterval(timer); }
  }, 30000);
  return () => clearInterval(timer); // Cleanup prevents memory leak
}, [isLive, targetTime]);

if (!isLive) return <ComingSoonExact />;
```
A JavaScript timestamp comparison gates the entire application. The site automatically goes live at the configured date — no server restart, no code change required. The `clearInterval` cleanup in the `useEffect` return function prevents the interval from running after the component unmounts.

```javascript
const Itinerary = lazy(() => import('./components/itinerary/itinerary.jsx'));
const Events    = lazy(() => import('./page2/events/event.jsx'));
```
Code splitting via `React.lazy`. The Events page bundle (with GSAP, icon imports, tiltcard) is not downloaded until the user navigates to `/events`. This reduces the initial JS payload by ~40%.

```javascript
const TeacherLayout = () => (
  <div style={{ backgroundImage: `url(${teacherBg})`, backgroundAttachment: 'fixed' }}>
    <Outlet />
  </div>
);
// ...
<Route path="/teacher" element={<TeacherLayout />}>
  <Route path="login"     element={<TeacherLogin />} />
  <Route path="dashboard" element={<Dashboard />} />
</Route>
```
React Router v7 nested routes. `<Outlet />` is a placeholder that renders the matched child route. Both `/teacher/login` and `/teacher/dashboard` share the TeacherLayout wrapper and its fixed background image.

---

### Student Login (`components/login/login.jsx`)

```javascript
const normalizeToken = (value) => {
  if (!value) return null;
  return value.startsWith("Bearer ") ? value.slice(7) : value;
};
```
Defensive cleanup — ensures the stored token never accidentally includes the "Bearer " prefix, which would break Authorization headers.

**EncryptButton scramble animation:**
```javascript
const scramble = () => {
  let pos = 0;
  intervalRef.current = setInterval(() => {
    const scrambled = TARGET_TEXT.split("").map((char, index) =>
      pos / CYCLES_PER_LETTER > index
        ? char                                           // Revealed letter
        : CHARS[Math.floor(Math.random() * CHARS.length)] // Random symbol
    ).join("");
    setText(scrambled);
    pos++;
    if (pos >= TARGET_TEXT.length * CYCLES_PER_LETTER) stopScramble();
  }, SHUFFLE_TIME);
};
```
`CYCLES_PER_LETTER = 2` means each character is shown as a random symbol for 2 frames (100ms) before being revealed. The effect reads left-to-right — as `pos` increases, more characters to the left are fixed while the right side continues scrambling.

---

### Events Page (`page2/events/event.jsx`)

**Multi-filter system:**
```javascript
const filteredCards = cards.filter((card) => {
  const matchesDay      = !activeDay    || cardDayStr === activeDay;
  const matchesCategory = !activeFilter || category   === activeFilter;
  let   matchesPrice    = true;
  if (priceFilter === "free") matchesPrice = !isPaid;
  else if (priceFilter === "paid") matchesPrice = isPaid;
  return matchesDay && matchesCategory && matchesPrice;
});
```
Three independent AND filters. `!activeDay` means "no filter applied" — all days pass. This pattern is cleaner than nested conditions.

**Throttled mouse tracking for torch effect:**
```javascript
const handleMouseMove = (e) => {
  if (!timeoutId) {
    timeoutId = setTimeout(() => {
      setMousePosition({ x: e.clientX, y: e.clientY });
      timeoutId = null;
    }, 16); // ~60fps
  }
};
```
`mousemove` can fire hundreds of times per second. Without throttling, each move would trigger a React state update and re-render the SVG torch. `setTimeout(16)` caps updates at ~60fps — matching the screen refresh rate and avoiding wasted renders.

---

### Teacher Dashboard (`page2/teacher/dashboard.jsx`)

```javascript
const API_BASE = import.meta.env.VITE_API_BASE || "https://ren-old.onrender.com/api";
```
`import.meta.env` is Vite's environment variable system. Only variables prefixed with `VITE_` are exposed to browser code. The fallback URL ensures the dashboard still works if the env var is not set.

```javascript
const filteredStudents = useMemo(() => {
  // filtering logic across 500+ students
}, [students, searchTerm, showPaidOnly, showUnpaidOnly, activeYearFilter, activeBranchFilter]);
```
`useMemo` memoizes the filtered result. Without it, every keystroke in the search box re-filters all students. With it, the filter only recomputes when the students array or filter criteria actually change.

---

### Custom Cursor (`components/cursor/cursor.jsx`)

```javascript
const dx = x - lastPos.current.x;
const dy = y - lastPos.current.y;
const distance = Math.sqrt(dx * dx + dy * dy);
if (distance > 18) {
  popWord(x, y);
  lastPos.current = { x, y };
}
```
Distance threshold prevents word spam when the cursor moves slowly. Words only spawn when the mouse has moved more than 18px from the last spawn point. `lastPos` is a `useRef` — updating it does not trigger a re-render.

---

### Preloader (`page2/preloader/LoadingContext.jsx`)

```javascript
const navEntry = performance.getEntriesByType("navigation")[0];
if (navEntry?.type === "navigate") { setIsLoading(true); }
```
Distinguishes between browser navigation types. The preloader should only appear on a fresh page load (`"navigate"`), not on React Router's client-side transitions (`"popstate"` / no reload).

---

## 7. Database Design

```
MongoDB Collections:
├── students        — College students (email unique index, events array)
├── teachers        — Admin / HOD / Dean / CC / SuperAdmin users
├── events          — Festival events with UI metadata
├── festivalpasses  — One per student, Day1/Day2/Day3 attendance tracking
├── outsiderpasses  — External visitor passes (MASTER or EVENT type)
├── festivaldays    — Date string → Day number mapping
├── appadmins       — App-level scan admin accounts
└── appstudents     — App-level student credential accounts
```

### Entity Relationships

```
Student  (1) ←──────────────── (1)  FestivalPass
                                     [student: ObjectId ref]

Student  (1) ──────────────── (N)   Events
                                     [events: [ObjectId] in student doc]

Student  (N) ────────────────► (1)  Teacher
                                     [markedBy: ObjectId ref]

Teacher creates Teacher (hierarchical RBAC, canCreate() function)
```

### Why Denormalized Events Array?

Storing event IDs inside the student document (rather than a separate `registrations` collection) trades write complexity for read performance. Getting a student's registered events is a single document read with no join. The tradeoff is that deleting an event requires scanning all student documents — acceptable for a festival with a fixed, pre-loaded event set.

---

## 8. Authentication & Security Model

### JWT Lifecycle

```
Login → Server signs JWT with { id, role, ... } and JWT_SECRET
     → Token sent to frontend → stored in localStorage
     → Every API request: Authorization: Bearer <token>
     → Middleware: jwt.verify(token, JWT_SECRET)
         Verifies signature (prevents tampering)
         Checks expiry (1d for students, 7d for teachers)
     → Decoded payload used to fetch user from DB
     → Fresh DB fetch ensures deleted users cannot still use their token
```

### Security Layers

| Layer | Implementation | What It Prevents |
|---|---|---|
| Password storage | bcrypt with 10–12 rounds | Rainbow table attacks; identical passwords produce different hashes |
| Authentication | JWT — signed, expiring | Session hijacking; expired tokens rejected automatically |
| Authorization | RBAC in controllers | Privilege escalation; HOD cannot access another branch's students |
| Rate limiting | express-rate-limit | Brute-force login attacks; scan flooding |
| Device binding | `devices[]` array in account | Credential sharing between multiple users |
| Input normalization | email/phone/branch normalizers | Data inconsistency; duplicate accounts |
| Atomic DB operations | `findOneAndUpdate` | Race conditions; double registration; token over-spending |
| CORS whitelist | Explicit origin list | Cross-origin request forgery from arbitrary websites |

---

## 9. Deployment Architecture

```
┌────────────────────────────────────────────┐
│           Cloudflare CDN                   │
│    ren2026-assests.b-cdn.net               │
│                                            │
│  - .webp images (backgrounds, gallery)    │
│  - .mp4 videos (intro, performances)      │
│  - .ttf fonts (Bebas Neue, Armageda)       │
│  - Cache-Control: max-age=31536000 (1yr)  │
└──────────────────────┬─────────────────────┘
                       │
          ┌────────────▼────────────┐
          │         Netlify         │
          │  jecrcrenaissance.co.in  │
          │                         │
          │  Vite dist/ folder      │
          │  Custom domain + SSL    │
          │  Edge CDN (built-in)    │
          │  netlify.toml rules:    │
          │   /api/* → Render proxy │
          │   /*     → index.html   │
          └────────────┬────────────┘
                       │ Proxy (HTTPS)
          ┌────────────▼────────────┐
          │         Render          │
          │  ren-old.onrender.com   │
          │                         │
          │  Node.js 20 LTS         │
          │  512 MB RAM (free tier) │
          │  Auto-deploy from main  │
          │  PORT from env          │
          │  0.0.0.0 binding        │
          └────────────┬────────────┘
                       │ mongoose.connect()
          ┌────────────▼────────────┐
          │     MongoDB Atlas       │
          │  Shared cluster (M0)    │
          │  512 MB storage         │
          │  Automatic backups      │
          │  Mumbai region (ap-s1)  │
          └─────────────────────────┘
```

**netlify.toml explained:**

```toml
[[redirects]]
  from   = "/api/*"
  to     = "https://ren-old.onrender.com/:splat"
  status = 200
  force  = true
```
`status = 200` means this is a proxy, not a redirect. The browser's URL bar does not change. `:splat` captures everything after `/api/` and appends it to the target URL. `force = true` ensures this rule runs even if a static file with the same path exists.

```toml
[[redirects]]
  from   = "/*"
  to     = "/index.html"
  status = 200
```
SPA fallback. Without this, refreshing `jecrcrenaissance.co.in/events` would return a 404 because there is no `/events.html` file. Netlify serves `index.html`, React boots, React Router reads the URL, and renders the Events page.

---

## 10. Environment Variables

### Backend (`.env`)

```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/renaissance2026
JWT_SECRET=a-long-random-string-stored-securely
PORT=5000
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
VERIFIED_FROM_EMAIL=renaissance@jecrcfoundation.com
EMAIL_CONCURRENCY=5
BOOTSTRAP_ADMIN=true         # Set to true ONLY on first deploy, then remove
ADMIN_EMAIL=admin@jecrc.ac.in
ADMIN_PASSWORD=strong_password_here
```

### Frontend (`.env`)

```env
VITE_API_BASE=https://ren-old.onrender.com/api
```

> **Security note:** `VITE_` prefixed variables are bundled into the frontend JavaScript and visible in the browser. Never put secrets (API keys, DB URIs) in frontend environment variables.

---

## 11. Technical Interview Questions & Answers

### JavaScript / Node.js

**Q1. What is the difference between `require()` and `import`?**

`require()` is CommonJS — synchronous, evaluated at runtime, can be called conditionally inside functions. `import` is ES Modules — static, analyzed at parse time before any code runs, supports tree-shaking (dead code elimination). This project uses `"type": "module"` in `package.json`, so all files use `import`. The practical benefit is that bundlers can eliminate unused exports, reducing bundle size.

---

**Q2. Explain `async/await` vs `.then()/.catch()`. When do you choose one over the other?**

Both are syntactic patterns over Promises. `async/await` reads like synchronous code — easier to follow in complex logic chains. `.then()/.catch()` is preferred for fire-and-forget patterns:

```javascript
bookTicket(student._id).catch(err => console.error(err));
```
Here we explicitly don't `await` because we want the HTTP response to return immediately. If we used `await`, the response would be delayed by the entire email generation + API call duration (~3s).

---

**Q3. What is the Node.js Event Loop? How does it apply to this project?**

Node.js is single-threaded but uses the Event Loop to handle concurrent operations non-blockingly. When the server calls `mongoose.findById()`, the JS thread does not block — it registers a callback and moves on. When MongoDB responds, the callback is pushed to the event queue and executed on the next loop tick.

This means one Node.js process handles hundreds of concurrent connections simultaneously. In this project: 100 students registering simultaneously each trigger DB queries, Canvas generation, and API calls — all non-blocking, all interleaved by the event loop.

---

**Q4. What is `Promise.all` and when should you use it?**

`Promise.all([p1, p2, p3])` runs all promises concurrently and resolves when all complete (or rejects when any one fails). Total time = `max(p1, p2, p3)`.

Sequential `await p1; await p2;` total time = `p1 + p2 + p3`.

Use `Promise.all` when the operations are independent. In this project, generating passes for multiple events could be parallelized with `Promise.all`.

---

**Q5. How was memory leak prevented in `cursor.jsx`?**

The `useEffect` returns a cleanup function:
```javascript
return () => window.removeEventListener("mousemove", handleMouseMove);
```
Without cleanup, when the cursor component unmounts (e.g., user navigates to teacher panel), the event listener stays alive in memory, referencing a React state setter of an unmounted component. Every mouse move would try to update dead state — React warns about this and it accumulates over time.

---

### React

**Q6. `useState` vs `useRef` — how do you choose?**

- `useState` — when the value change should trigger a re-render (e.g., showing an error message, updating a list)
- `useRef` — when you need to store a value between renders but changes should NOT trigger re-renders (e.g., interval ID, previous mouse position, DOM element reference)

In `cursor.jsx`, `lastPos.current` stores the previous mouse position. Updating it on every mouse move would cause 60 re-renders per second if it were `useState`. As a ref, the component reads it silently.

---

**Q7. Explain `useMemo` with a real example from this project.**

```javascript
const filteredStudents = useMemo(() => {
  return students.filter(s => s.name.toLowerCase().includes(searchTerm));
}, [students, searchTerm]);
```

Without `useMemo`, this filter runs on every render — including renders triggered by unrelated state changes (e.g., a modal opening). With `useMemo`, React skips the computation if `students` and `searchTerm` haven't changed since the last render. For a list of 500+ students, this is a meaningful performance save.

---

**Q8. What is `React.lazy()` and `Suspense`?**

`React.lazy(() => import('./Events'))` tells Webpack/Vite to put the Events component in a separate JS chunk. The chunk is only downloaded when React tries to render `<Events />` for the first time.

`<Suspense fallback={<LoadingCards />}>` catches the loading state — while the chunk downloads, the fallback UI is shown. Once downloaded and executed, the real component renders.

The practical result: the initial page load JS bundle is smaller → faster First Contentful Paint → better user experience and Core Web Vitals score.

---

**Q9. What is Context API? How was it used here?**

`createContext()` creates a global state container. `<LoadingContext.Provider value={...}>` wraps the tree, making the value available to any descendant component via `useContext(LoadingContext)` — without passing props down through every intermediate component.

In this project, `isLoading` and `setIsLoading` are shared between `App.jsx` (which renders the preloader) and the `Preloader` component itself (which calls `setIsLoading(false)` when its animation ends).

---

**Q10. How do nested routes work in React Router v7?**

```jsx
<Route path="/teacher" element={<TeacherLayout />}>
  <Route path="login"     element={<TeacherLogin />} />
  <Route path="dashboard" element={<Dashboard />} />
</Route>
```

When the URL is `/teacher/dashboard`:
1. React Router matches `/teacher` → renders `<TeacherLayout />`
2. Inside `TeacherLayout`, `<Outlet />` renders the matched child → `<Dashboard />`

This allows the layout (background image, wrapper styles) to persist while the inner content changes. Without nested routes, you'd repeat the layout in every page component.

---

### MongoDB / Mongoose

**Q11. Why is `findOneAndUpdate` atomic? How does it prevent race conditions?**

A race condition occurs when two operations read the same value, both decide to act on it, and both succeed — resulting in inconsistency.

**Without atomic operation:**
1. Request A reads `student.token = 1`
2. Request B reads `student.token = 1`
3. Both see token > 0 → both deduct → token becomes -1

**With `findOneAndUpdate`:**
```javascript
Student.findOneAndUpdate(
  { _id: id, token: { $gt: 0 }, events: { $ne: eventId } },
  { $inc: { token: -1 }, $addToSet: { events: eventId } }
)
```
MongoDB processes this as one indivisible operation. When Request A holds the document lock and decrements token to 0, Request B's filter `token: { $gt: 0 }` finds no match and returns null. No duplicate deduction possible.

---

**Q12. How does Mongoose `populate()` work? How is it different from SQL JOIN?**

`populate("student")` in a FestivalPass query: Mongoose executes two separate DB queries.
1. `FestivalPass.findById(id)` → gets pass document with `student: ObjectId("abc123")`
2. `Student.findById("abc123")` → gets student document
3. Mongoose replaces the ObjectId in the result with the student object

SQL `JOIN` is a single query combining rows from two tables on matching column values.

The difference: SQL JOIN is a relational query done in one operation by the DB engine. MongoDB's `populate` is an application-level join using two queries. For complex data relationships, MongoDB's `$lookup` aggregation pipeline can do it in one DB roundtrip like SQL.

---

**Q13. What is the difference between `unique: true` and `sparse: true` on a Mongoose index?**

- `unique: true` — MongoDB creates a unique index. Any two documents with the same value on this field will fail to insert. This includes `null` — two documents with `fieldName: null` would also violate uniqueness.
- `sparse: true` — The index only includes documents where the field exists and is not null. Two documents with `fieldName: null` are both fine with a sparse unique index.

`qrToken` uses `{ unique: true, sparse: true }` because outsider passes are created before a QR token is generated. Multiple passes temporarily have `qrToken: null` and must coexist.

---

**Q14. `$push` vs `$addToSet` — what is the difference?**

- `$push` appends a value to an array unconditionally. Calling it twice with the same value produces `[eventId, eventId]`.
- `$addToSet` only adds the value if it is not already present — set semantics. Idempotent.

The `events` array on a student document uses `$addToSet` to guarantee idempotent registration. Even if the same request is received twice (network retry), the event ID appears only once.

---

**Q15. Explain Mongoose's conditional `required` validator.**

```javascript
branch: {
  type: String,
  required: function() { return ["hod", "cc"].includes(this.role); }
}
```

The `required` option accepts a function. When Mongoose validates the document, it calls the function with `this` bound to the document instance. If the function returns `true`, the field is required. This allows schema-level conditional validation without application-level if-else.

---

### Security

**Q16. What are bcrypt salt rounds? Why 10?**

bcrypt's work factor is `2^rounds` iterations. Rounds=10 means 1,024 iterations per hash — approximately 100ms on modern hardware. This is intentionally slow to make brute-force attacks impractical (10,000 passwords/sec becomes 10 passwords/sec).

The balance: rounds too low = faster cracking. Rounds too high = server load on every login. 10 is the widely accepted default for web applications. The admin bootstrap uses 12 (4,096 iterations) for the highest-value account.

---

**Q17. JWT is stateless — what are the tradeoffs?**

**Advantage:** Any server replica can verify a JWT using the shared secret — no shared session store needed, easy horizontal scaling.

**Disadvantage:** Tokens cannot be revoked before expiry. If a user's token is stolen, it remains valid until it expires. The mitigation in this project is storing `devices[]` on the account — when a device is removed from the array, the server can reject tokens from that device even before expiry.

---

**Q18. Why was CORS needed? What would happen without it?**

CORS is enforced by browsers, not servers. The browser's Same-Origin Policy blocks JavaScript from reading responses from a different origin (protocol + domain + port).

Frontend at `netlify.app` making a request to `render.com` — different origin. The browser sends a preflight `OPTIONS` request. If the backend's response doesn't include `Access-Control-Allow-Origin: https://renaissance2026.netlify.app`, the browser blocks the response. The request reaches the server fine — the server processes it — but the browser hides the response from the JavaScript code.

Without `cors()` middleware, every API call from the frontend would silently fail in the browser (though work fine from Postman or curl).

---

**Q19. How does rate limiting prevent brute-force attacks?**

A brute-force attack tries all possible passwords systematically. A 6-character lowercase password has 26^6 = ~300 million combinations. At 1000 requests/second, that's 3.5 days.

With `max: 10` per 15-minute window per IP: the attacker gets 10 attempts every 15 minutes = 40 attempts per hour. At that rate, cracking a 6-character lowercase password would take 300,000,000 / 40 = 7.5 million hours. Impractical.

---

**Q20. Why is input normalization necessary?**

Real-world users are inconsistent. Without normalization:
- `"CSE"`, `"cse"`, `"Computer Science Engineering"` would be stored as three different branch values
- `"john@gmail.com"` and `"JOHN@GMAIL.COM"` would be treated as two different accounts
- Phone `"9876543210"`, `"+919876543210"`, `"98765 43210"` would be three different records

Normalization at write time ensures one canonical representation. The `branchNormalizer` maps 20+ variants per branch to a single code. The email field uses Mongoose's `lowercase: true` for automatic normalization on save.

---

### Performance

**Q21. What is `p-limit` and why was it used for the email queue?**

`p-limit(n)` wraps Promises with a concurrency cap — at most `n` promises run simultaneously.

Without it: 100 students register in 2 minutes → 100 simultaneous `resend.emails.send()` calls → Resend's API rate limit triggered → emails start failing with 429 errors.

With `p-limit(5)`: jobs queue up, 5 run at a time, each takes ~500ms, the queue drains gradually, all 100 emails are delivered successfully within ~10 seconds.

---

**Q22. How does Vite's `manualChunks` improve performance?**

```javascript
// vite.config.js
manualChunks: {
  vendor: ["framer-motion", "gsap"],
  icons:  ["lucide-react"]
}
```

Without `manualChunks`: all code (app code + libraries) bundled in one file. Every deploy, users re-download everything — even if only one component changed.

With `manualChunks`: vendor chunk (Framer Motion, GSAP) is separate. These libraries change rarely. Browsers cache the vendor chunk. When app code is updated and deployed, users only re-download the app chunk. Vendor chunk served from cache → faster repeat loads.

---

**Q23. What is gzip compression middleware doing? Give numbers.**

The `compression()` middleware adds `Content-Encoding: gzip` to responses. The response body is compressed using gzip before transmission and decompressed by the browser.

Typical results on this project's data:
- Events list JSON (50 events): ~45 KB uncompressed → ~8 KB gzipped (82% reduction)
- Student list JSON (500 students): ~200 KB uncompressed → ~28 KB gzipped (86% reduction)

Smaller payload = faster network transfer = faster page render = lower Render.com bandwidth cost.

---

**Q24. Why is the Canvas ticket image 5880×2209 pixels?**

Print quality at 300 DPI on A4 landscape:
- A4 landscape = 11.69 × 8.27 inches
- 11.69 × 300 = 3507px width ... but 5880 targets a higher-resolution print at 500 DPI

The file is delivered as an email attachment, not displayed in the browser. For printing (the primary use case of an event pass), high resolution prevents pixelation. The PNG is compressed well enough that email size is not a concern.

---

### Architecture & Design Patterns

**Q25. Describe the MVC pattern as implemented in this project.**

- **Model** — `models/` folder. Mongoose schemas define data structure, validation, and relationships. No business logic.
- **View** — React frontend. Purely presentational. Receives data via API, renders it.
- **Controller** — `controllers/` folder. Business logic: validate input, check permissions, transform data, call models, call services.
- **Routes** — URL-to-controller mapping. No logic, just wiring.
- **Services/Utils** — `utils/` folder. Reusable logic that is not tied to a specific route: email sending, image generation, normalization.

---

**Q26. Explain the fire-and-forget pattern. Where and why was it used?**

Fire-and-forget: start an async operation without awaiting it, log errors in a `.catch()`.

```javascript
bookTicket(student._id, pass, events).catch(err => console.error(err));
// HTTP response returned here, immediately
res.status(200).json({ message: "Registered successfully" });
```

Used after event registration and fee marking. Email + canvas generation takes 2–4 seconds. Making the user wait blocks the HTTP connection and makes the UI feel slow. Returning the success response immediately gives instant feedback. The email arrives in the student's inbox seconds later.

The tradeoff: if the email fails, the user doesn't know. This is acceptable for a festival registration — the registration itself is confirmed in the DB, and the pass can be resent manually.

---

**Q27. What is the Strategy Pattern? Where was it applied?**

Strategy Pattern: a family of algorithms encapsulated in separate objects/functions, interchangeable at runtime based on a context value.

```javascript
router.post("/scan", scanLimiter, async (req, res) => {
  const { type, passId } = req.body;
  const normalizedType = String(type).toUpperCase();

  if (normalizedType === "INSIDER")              return verifyPass(req, res);
  if (normalizedType.startsWith("OUTSIDER"))     return verifyOutsiderPass(passId);
  return res.status(400).json({ message: "Invalid QR" });
});
```

The `type` field selects the verification strategy. Adding a new pass type (e.g., `"STAFF"`) only requires adding one branch — no modification to existing strategies.

---

**Q28. Why use a Netlify proxy instead of calling the Render backend directly from the frontend?**

Three reasons:

1. **CORS simplification** — With the proxy, the browser always calls `jecrcrenaissance.co.in/api/...` (same origin). No cross-origin preflight. The CORS headers on the backend become optional for browser clients (still needed for direct API access from Postman etc.).

2. **Backend URL obscurity** — The Render URL (`ren-old.onrender.com`) is not exposed in the frontend bundle. Users cannot directly query the backend, bypassing the proxy's potential future rate limiting or WAF.

3. **Easy migration** — If the backend moves from Render to another host, only the `netlify.toml` `to` URL changes. The frontend code is untouched.

---

**Q29. What does `performance.getEntriesByType("navigation")` detect?**

The Navigation Timing API returns information about the current page load. The `type` property of the navigation entry can be:
- `"navigate"` — fresh URL entered or link clicked (full page load)
- `"reload"` — F5 / browser reload
- `"back_forward"` — browser back/forward buttons
- `"prerender"` — page preloaded in background

The preloader fires only on `"navigate"`. React Router's client-side transitions don't trigger a page reload — there is no navigation entry — so the preloader correctly skips for SPA navigations.

---

**Q30. What are the tradeoffs of storing event IDs inside the student document vs. a separate registrations collection?**

| Aspect | Denormalized (events in student doc) | Normalized (separate registrations collection) |
|---|---|---|
| Read student's events | O(1) — single document read | O(n) — join or second query |
| Write (register) | `$addToSet` on student doc | Insert new registration document |
| Delete an event | Scan all student documents | Delete from registrations collection |
| Scale | Document size grows with events | Unbounded, each registration is a small record |
| Consistency | Harder to enforce constraints | Easier with foreign key equivalents |

For this use case — fixed event set, finite registrations per student (max ~10 events) — the denormalized approach is the right choice. Student dashboards load in one query, which is the hot path.

---

> **Interview Tip:** Interviewers care more about *why* you made a decision than *what* you did. For every technology choice or pattern, practice explaining the alternatives you considered and why you rejected them. The race condition prevention in event registration and the fire-and-forget email pattern are the two most interview-worthy problems in this codebase — understand them deeply.

---

**Project:** Renaissance 2026 — Annual Festival, JECRC Foundation  
**Tech Head:** Devang Sharma  
**Stack:** Node.js + Express + MongoDB (Backend) | React + Vite + Tailwind CSS (Frontend)  
**Deployment:** Render (Backend) · Netlify (Frontend) · MongoDB Atlas (Database) · Cloudflare (CDN)
