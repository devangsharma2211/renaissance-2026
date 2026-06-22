import dotenv from "dotenv";
import mongoose from "mongoose";
import Student from "../models/student.js";
import Event from "../models/event.js";
import { normalizeBranch } from "../utils/branchNormalizer.js";

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

const normalizeName = (name) =>
  String(name || "")
    .toLowerCase()
    .replace(/[^a-z ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const normalizeTitle = (title) =>
  String(title || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "");

const aliasTitleMap = new Map([
  ["3LEGRACE", "3LEGRACE"],
  ["3LEG RACE".replace(/[^A-Z0-9]+/g, ""), "3LEGRACE"],
  ["3L EGRACE".replace(/[^A-Z0-9]+/g, ""), "3LEGRACE"],
  ["DSABATTLEGROUND", "DSABATTLEGROUND"],
  ["DASHMASTERPOWERBICHALLENGE", "DASHMASTERPOWERBICHALLENGE"],
  ["DASHMASTERPOWERBICHALLENEGE", "DASHMASTERPOWERBICHALLENGE"],
  ["DASHMASTERPOWERBICHAALLENGE", "DASHMASTERPOWERBICHALLENGE"],
  ["DASHMASTERPOWEREBICHALLENGE", "DASHMASTERPOWERBICHALLENGE"],
  ["QFIESTA", "QFIESTA"],
  ["SITUATIONQUE", "SITUATIONALQUE"],
  ["SITUATIONALQUE", "SITUATIONALQUE"],
  ["TECHNICALPOSTERMAKING", "TECHNICALPOSTERMAKING"],
  ["BEGBORROWSTEAL", "BEGBORROWSTEAL"],
  ["FILMFLICK", "FILMFLICKSHORTFILM"],
  ["FLIMFLICK", "FILMFLICKSHORTFILM"],
  ["FILMFLICKSHORTFILM", "FILMFLICKSHORTFILM"],
  ["PROGRAMMERPLAYGROUND", "PROGRAMMERSPLAYGROUND"],
  ["PROGRAMMERSPLAYGROUND", "PROGRAMMERSPLAYGROUND"],
  ["CODEOLYMPICS", "CODEOLYMPICS"],
  ["CUT2DESIGN", "CUT2DESIGN"],
  ["OWNIT", "OWNIT"],
  ["KNOWLEDGEKNOCKOUT", "KNOWLEDGEKNOCKOUT"],
  ["CREATIVEPIXEL", "CREATIVEPIXEL"],
  ["BESTOUTOFWASTE", "BESTOUTOFWASTE"]
]);

const input = [
  { name: "abhishek soni", branch: "aids", year: 2, events: ["bgmi"] },
  { name: "tushar tailor", branch: "aids", year: 2, events: ["bgmi", "real cricket"] },
  { name: "sha hid", branch: "ce", year: 2, events: ["sprint"] },
  { name: "aaditi naruka", branch: "cse", year: 2, events: ["beg borrow steal"] },
  { name: "rahul saini", branch: "cse", year: 2, events: ["technical poster making"] },
  { name: "ridam arya", branch: "cse", year: 2, events: ["bgmi"] },
  { name: "shagun jangid", branch: "cse", year: 2, events: ["3 leg race", "q fiesta"] },
  { name: "shalini gupta", branch: "cse", year: 2, events: ["techno crazy"] },
  { name: "abhay pratap singh", branch: "csai", year: 2, events: ["subito", "beg borrow steal", "bgmi", "real cricket"] },
  { name: "abhinav bhatra", branch: "csai", year: 2, events: ["brain quest"] },
  { name: "abhijit kumar", branch: "csai", year: 2, events: ["3 leg race"] },
  { name: "abhinav purohit", branch: "csai", year: 2, events: ["dsa battle ground"] },
  { name: "aditya tukaram vanjari", branch: "csai", year: 2, events: ["tech probe", "3 leg race", "real cricket"] },
  { name: "akshat goyal", branch: "csai", year: 2, events: ["tech hunt", "real cricket", "3 l eg race"] },
  { name: "anand gaur", branch: "csai", year: 2, events: ["3 leg race", "real cricket", "situation que"] },
  { name: "arav khatore", branch: "csai", year: 2, events: ["game of cinema"] },
  { name: "aryan purswani", branch: "csai", year: 2, events: ["bgmi", "real cricket", "subito", "beg borrow steal"] },
  { name: "lokesh singh", branch: "ee", year: 2, events: ["bgmi"] },
  { name: "alvish khan", branch: "it", year: 2, events: ["real cricket"] },
  { name: "aryan sahu", branch: "it", year: 2, events: ["bgmi"] },
  { name: "devansh jain", branch: "it", year: 2, events: ["dsa battleground"] },
  { name: "param pratap singh", branch: "it", year: 2, events: ["bgmi"] },
  { name: "piyush bhakar", branch: "it", year: 2, events: ["bgmi"] },
  { name: "priyanshu sihag", branch: "it", year: 2, events: ["bgmi"] },
  { name: "shivam pareek", branch: "it", year: 2, events: ["dsa battleground", "real cricket"] },
  { name: "mehul", branch: "mech", year: 2, events: ["cad darshan"] },
  { name: "raj gupta", branch: "mech", year: 2, events: ["brain quest", "bgmi"] },
  { name: "aarav kulshrestha", branch: "aids", year: 1, events: ["metaverse sprint"] },
  { name: "akshra modi", branch: "aids", year: 1, events: ["beg borrow steal"] },
  { name: "animesh jain", branch: "aids", year: 1, events: ["blink it"] },
  { name: "anushka agrawal", branch: "aids", year: 1, events: ["game of cinema"] },
  { name: "ashita agrawal", branch: "aids", year: 1, events: ["dash master :power bi challenege"] },
  { name: "avnish bhatt", branch: "aids", year: 1, events: ["beg borrow steal"] },
  { name: "chitransh nagar", branch: "aids", year: 1, events: ["bgmi"] },
  { name: "dhruv sikri", branch: "aids", year: 1, events: ["beg borrow steal"] },
  { name: "divyansh dave", branch: "aids", year: 1, events: ["dash master powere bi challenge"] },
  { name: "naman mehandratta", branch: "aids", year: 1, events: ["bgmi", "real cricket", "tech hunt"] },
  { name: "piyush sharma", branch: "aids", year: 1, events: ["beg borrow steal"] },
  { name: "raj bhatt", branch: "aids", year: 1, events: ["3 leg race", "dash master power bi chaallenge"] },
  { name: "rakesh sharma", branch: "aids", year: 1, events: ["tech probe"] },
  { name: "ravi bhatt", branch: "aids", year: 1, events: ["3 leg race", "dash master power bi challenege"] },
  { name: "rishika garg", branch: "aids", year: 1, events: ["beg borrow steal"] },
  { name: "shivansh khandelwal", branch: "aids", year: 1, events: ["situational que"] },
  { name: "shreya singhal", branch: "aids", year: 1, events: ["beg borrow steal"] },
  { name: "siddhi jangir", branch: "aids", year: 1, events: ["beg borrow steal"] },
  { name: "surendra choudhary", branch: "aids", year: 1, events: ["bgmi"] },
  { name: "neeraj", branch: "ce", year: 1, events: ["puzzle mania"] },
  { name: "parvez khan", branch: "ce", year: 1, events: ["bgmi"] },
  { name: "purvesh shandilya", branch: "ce", year: 1, events: ["bgmi"] },
  { name: "rishi raj singh", branch: "ce", year: 1, events: ["puzzle mania"] },

  { name: "saurabh tata", branch: "ce", year: 1, events: ["bgmi"] },
  { name: "udit khandelwal", branch: "ce", year: 1, events: ["sprint"] },
  { name: "yashvardhan gurjar", branch: "ce", year: 1, events: ["bgmi"] },
  { name: "ayush yadav", branch: "csai", year: 1, events: ["flim flick"] },
  { name: "abhishek goyal", branch: "csai", year: 1, events: ["tech probe"] },
  { name: "alok kumar", branch: "csai", year: 1, events: ["bgmi"] },
  { name: "devansh rathi", branch: "csai", year: 1, events: ["bgmi"] },
  { name: "dhanvi goyal", branch: "csai", year: 1, events: ["best out of waste"] },
  { name: "gautam garg", branch: "csai", year: 1, events: ["creative pixel"] },
  { name: "krish jain", branch: "csai", year: 1, events: ["bgmi"] },
  { name: "mohit gupta", branch: "csai", year: 1, events: ["3 leg race"] },
  { name: "naman lakhani", branch: "csai", year: 1, events: ["real cricket"] },
  { name: "parth vyas", branch: "csai", year: 1, events: ["game of cinema"] },
  { name: "pulkit jain", branch: "csai", year: 1, events: ["situational que"] },
  { name: "rahul parhiar", branch: "csai", year: 1, events: ["situational que"] },
  { name: "samiksha tater", branch: "csai", year: 1, events: ["game of cinema"] },
  { name: "tanish agrawal", branch: "csai", year: 1, events: ["bgmi"] },
  { name: "tanisha jhamtani", branch: "csai", year: 1, events: ["3 leg race"] },
  { name: "yogesh timanwal", branch: "csai", year: 1, events: ["bgmi"] },
  { name: "yuvraj singh shekhawat", branch: "ccsai", year: 1, events: ["bgmi"] },

  { name: "aditi sharma", branch: "cse", year: 1, events: ["sprint"] },
  { name: "ansh saraswat", branch: "cse", year: 1, events: ["bgmi"] },
  { name: "lokesh kuldeep", branch: "cse", year: 1, events: ["beg borrow steal"] },
  { name: "mayank gupta", branch: "cse", year: 1, events: ["real cricket", "puzzle mania", "beg borrow steal"] },
  { name: "mayank parashar", branch: "cse", year: 1, events: ["puzzle mania", "beg borrow steal"] },
  { name: "mehul goyal", branch: "cse", year: 1, events: ["game of cinema", "bgmi"] },
  { name: "mohit khoiwal", branch: "cse", year: 1, events: ["bgmi"] },
  { name: "mohit mourya", branch: "cse", year: 1, events: ["beg borrow steal"] },
  { name: "navneet gurjar", branch: "cse", year: 1, events: ["sprint", "beg borrow steal"] },
  { name: "pawan das", branch: "cse", year: 1, events: ["situational que"] },
  { name: "priyanshu jain", branch: "cse", year: 1, events: ["brain quest"] },
  { name: "priyanshu palsaniya", branch: "cse", year: 1, events: ["bgmi"] },
  { name: "tanishq katara", branch: "cse", year: 1, events: ["3 leg race"] },
  { name: "vishal kumar", branch: "cse", year: 1, events: ["bgmi", "3 leg race"] },
  { name: "lavisha jain", branch: "cse", year: 1, events: ["sprint"] },

  { name: "abhishek", branch: "ece", year: 1, events: ["bgmi"] },
  { name: "arpit gupta", branch: "ece", year: 1, events: ["bgmi"] },
  { name: "chandan vaishanav", branch: "ece", year: 1, events: ["knowledge knockout", "own it", "bgmi", "real cricket"] },
  { name: "gaurav singh shekhawat", branch: "ece", year: 1, events: ["sprint"] },
  { name: "piyush choudhary", branch: "ece", year: 1, events: ["metaverse sprint"] },
  { name: "sonu yadav", branch: "ece", year: 1, events: ["sprint"] },

  { name: "janhavi gupta", branch: "it", year: 1, events: ["tech hunt"] },
  { name: "nikhil kumar", branch: "it", year: 1, events: ["code olympics"] },
  { name: "shivraj singh khangarot", branch: "it", year: 1, events: ["real cricket"] },
  { name: "sidhant sharma", branch: "it", year: 1, events: ["3 leg race"] },
  { name: "tanmay jain", branch: "it", year: 1, events: ["bgmi", "real cricket"] },
  { name: "sachin", branch: "it", year: 1, events: ["real cricket", "programmers playground"] },

  { name: "bhavaya goyal", branch: "mech", year: 1, events: ["bgmi", "3d mania"] },

  { name: "aman malav", branch: "ce", year: 3, events: ["real cricket"] },
  { name: "kishor kumar", branch: "ce", year: 3, events: ["cad darshan", "sprint"] },
  { name: "lakshya kalayan", branch: "ce", year: 3, events: ["bgmi"] },
  { name: "tarunpal singh rajpurohit", branch: "ce", year: 3, events: ["dexterity", "sprint"] },

  { name: "ayush khandelwal", branch: "it", year: 3, events: ["code olympics"] },
  { name: "bhavesh salvi", branch: "it", year: 3, events: ["dash master power bi challenge", "real cricket"] },

  { name: "hari om dabas", branch: "mech", year: 3, events: ["cut 2 design"] },
  { name: "himanshu yadav", branch: "mech", year: 3, events: ["brain quest"] },
  { name: "priyanshu soni", branch: "mech", year: 3, events: ["cut 2 design"] },
  { name: "sauarabh dubey", branch: "mech", year: 3, events: ["brain quest", "sprint"] },
  { name: "suresh prajapat", branch: "mech", year: 3, events: ["cut 2 design", "real cricket", "sprint"] },
  { name: "tushar goyal", branch: "mech", year: 3, events: ["3d mania"] },
  { name: "nishi kant kumar", branch: "mech", year: 3, events: ["brain quest"] },

  { name: "dummy", branch: "csai", year: 2, events: ["beg borrow steal", "real cricket"] }
];

const resolveBranch = (branch) => {
  const norm = normalizeBranch(branch);
  if (norm) return norm;
  const cleaned = String(branch || "").toLowerCase();
  if (cleaned.replace(/[^a-z]/g, "") === "ccsai") return "CSAI";
  if (cleaned.startsWith("mech")) return "ME";
  return norm;
};

const run = async () => {
  await mongoose.connect(uri, { autoIndex: false });

  const events = await Event.find().select("_id title isPaid category").lean();
  const eventById = new Map();
  const titleToId = new Map();
  for (const e of events) {
    const norm = normalizeTitle(e.title);
    titleToId.set(norm, String(e._id));
    eventById.set(String(e._id), e);
  }

  const stats = {
    total: input.length,
    matched: 0,
    updated: 0,
    ambiguous: 0,
    missing: 0,
    missingEvents: new Set(),
    missingStudents: [],
    ambiguousStudents: []
  };

  for (const entry of input) {
    const branch = resolveBranch(entry.branch);
    const year = Number(entry.year);
    if (!branch || !year) {
      stats.missing += 1;
      continue;
    }

    const candidates = await Student.find({ branch, Year: year }).select("_id name events isPaid token").lean();
    const targetName = normalizeName(entry.name);
    let matches = candidates.filter((c) => normalizeName(c.name) === targetName);

    if (matches.length === 0) {
      const targetTokens = targetName.split(" ").filter(Boolean);
      matches = candidates.filter((c) => {
        const candTokens = normalizeName(c.name).split(" ").filter(Boolean);
        return targetTokens.every((t) => candTokens.includes(t));
      });
    }

    if (matches.length !== 1) {
      if (matches.length > 1) {
        stats.ambiguous += 1;
        stats.ambiguousStudents.push({ name: entry.name, branch, year });
      } else {
        stats.missing += 1;
        stats.missingStudents.push({ name: entry.name, branch, year });
      }
      continue;
    }

    const student = matches[0];
    stats.matched += 1;

    const originalIds = (Array.isArray(student.events) ? student.events : []).map((id) => String(id));
    const validExisting = originalIds.filter((id) => eventById.has(id));

    const newEventIds = [];
    for (const raw of entry.events || []) {
      const norm = normalizeTitle(raw);
      const alias = aliasTitleMap.get(norm) || norm;
      const mappedId = titleToId.get(alias);
      if (!mappedId) {
        stats.missingEvents.add(raw);
        continue;
      }
      newEventIds.push(mappedId);
    }

    const merged = [...validExisting, ...newEventIds];
    const seen = new Set();
    const deduped = merged.filter((id) => {
      const key = String(id);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    let freeCount = 0;
    for (const id of deduped) {
      const ev = eventById.get(String(id));
      if (ev && ev.isPaid === false) freeCount += 1;
    }
    const baseTokens = student.isPaid ? 4 : 0;
    const newToken = Math.max(0, baseTokens - freeCount);

    const removedUnknown = originalIds.length !== validExisting.length;
    const changed =
      removedUnknown ||
      deduped.length !== validExisting.length ||
      newToken !== (student.token ?? 0);

    if (changed) {
      stats.updated += 1;
      await Student.updateOne(
        { _id: student._id },
        { $set: { events: deduped, token: newToken } }
      );
    }
  }

  console.log("✅ Manual override complete", {
    total: stats.total,
    matched: stats.matched,
    updated: stats.updated,
    ambiguous: stats.ambiguous,
    missing: stats.missing,
    missingEvents: Array.from(stats.missingEvents),
    missingStudents: stats.missingStudents,
    ambiguousStudents: stats.ambiguousStudents
  });

  await mongoose.disconnect();
};

run().catch((err) => {
  console.error("❌ Manual override failed:", err);
  process.exit(1);
});
