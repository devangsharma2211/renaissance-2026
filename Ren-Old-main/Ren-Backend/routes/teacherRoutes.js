import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import zod from "zod";
import multer from "multer";

import Teacher from "../models/Teacher.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import Student from "../models/student.js";
import OutsiderPass from "../models/OutsiderPass.js";
import Event from "../models/event.js";
import ExcelJS from "exceljs";

import password_generator from "../utils/teacher/password.js";
import bookTicket from "../utils/teacher/qrgen.js";

import { teacherAuth } from "../middlewares/teacherAuth.js";
import { teacherLoginLimiter } from "../middlewares/rateLimiter.js";
import { canCreate, canDelete, ROLE_LEVEL } from "../utils/permissions.js";

import { CheckStudents, RegisterStudents } from "../controllers/uploadController.js";
import { toggleStudentFee } from "../controllers/passController.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });
const jwtSecret = process.env.JWT_SECRET;

//   VALIDATION                                  

const loginSchema = zod.object({
  email: zod.string().email(),
  password: zod.string()
});

const createTeacherSchema = zod.object({
  name: zod.string(),
  email: zod.string().email(),
  password: zod.string().min(6),
  role: zod.enum(["admin", "hod", "dean"]),
  branch: zod.string().optional(),
  year: zod.number().optional()
});

const canCreateRole = (creatorRole, targetRole) => {
  if (creatorRole === "superadmin") return true;

  if (creatorRole === "admin") {
    return ["hod", "dean"].includes(targetRole);
  }

  return false;
};

/*                                   LOGIN                                    */


router.post("/login", teacherLoginLimiter, async (req, res) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ msg: "Invalid credentials format" });
    }

    const { email, password } = parsed.data;
    const passwordInput = (password ?? "").toString();

    const escapeRegExp = (str) =>
      str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const normalizedEmail = email.trim().toLowerCase();
    const teacher = await Teacher.findOne({
      email: new RegExp(`^\\s*${escapeRegExp(normalizedEmail)}\\s*$`, "i")
    });
    if (!teacher) {
      return res.status(404).json({ msg: "Teacher not found" });
    }

    let stored = (teacher.password || "").toString().trim();
    // Normalize bcrypt $2y$ prefix (old PHP/legacy hashes)
    if (/^\$2y\$/.test(stored)) {
      stored = stored.replace(/^\$2y\$/, "$2b$");
    }
    const isBcrypt = /^\$2[abxy]\$/.test(stored) || stored.startsWith("$2");
    let isMatch = false;
    if (isBcrypt) {
      try {
        isMatch = await bcrypt.compare(passwordInput, stored);
      } catch (err) {
        isMatch = false;
      }
    } else {
      // Legacy plain-text password fallback
      isMatch = stored === passwordInput || stored === passwordInput.trim();
      if (isMatch) {
        teacher.password = await bcrypt.hash(passwordInput, 10);
        await teacher.save();
      }
    }
    if (!isMatch) {
      return res.status(403).json({ msg: "Invalid credentials" });
    }

    const token = jwt.sign(
      {
        id: teacher._id,
        role: teacher.role,
        branch: teacher.branch || null,
        year: teacher.year || null
      },
      jwtSecret,
      { expiresIn: "7d" }
    );

    res.status(200).json({ token });
  } catch (err) {
    console.error("Teacher login error:", err);
    res.status(500).json({ msg: "Server error" });
  }
});




/*                        CREATE TEACHER (RBAC SAFE)                           */


router.post("/teachers", teacherAuth, async (req, res) => {
  try {
    const creator = req.user; // from JWT
    const { name, email, password, role, branch, year } = req.body;

    //Role hierarchy check
    if (!canCreateRole(creator.role, role)) {
      return res.status(403).json({
        msg: "You are not allowed to create this role"
      });
    }

    // Field enforcement
    if (["admin", "superadmin"].includes(role)) {
      if (branch || year) {
        return res.status(400).json({
          msg: "Admin/Superadmin cannot have branch or year"
        });
      }
    }

    if (["hod"].includes(role) && !branch) {
      return res.status(400).json({
        msg: "Branch is required for HOD"
      });
    }

    const teacher = new Teacher({
      name,
      email,
      password : await bcrypt.hash(password, 10),
      role,
      branch: branch || undefined,
      year: role === "dean" ? (year ?? 1) : (year || undefined)
    });

    await teacher.save();

    res.status(201).json({
      success: true,
      msg: "Teacher created successfully"
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});




/*                         LIST TEACHERS (ROLE AWARE)                          */


router.get("/teachers", teacherAuth, async (req, res) => {
  try {
    const requester = req.user;
    const { role } = req.query;

    let query = {};

    if (role) {
      const roles = role
        .split(",")
        .map((r) => r.trim())
        .filter(Boolean);

      const invalidRole = roles.find((r) => !ROLE_LEVEL[r]);
      if (invalidRole) {
        return res.status(400).json({ msg: "Invalid role filter" });
      }

      const forbiddenRole = roles.find(
        (r) => ROLE_LEVEL[r] >= ROLE_LEVEL[requester.role]
      );
      if (forbiddenRole) {
        return res.status(403).json({ msg: "Not allowed to view this role" });
      }

      query.role = roles.length === 1 ? roles[0] : { $in: roles };
    }

    const teachers = await Teacher.find(query, {
      password: 0,
      __v: 0
    })
      .select("name email role branch year")
      .sort({ role: 1, name: 1 })
      .lean();

    res.status(200).json({
      success: true,
      count: teachers.length,
      data: teachers
    });

  } catch (err) {
    console.error("Fetch teachers error:", err);
    res.status(500).json({ msg: "Failed to fetch teachers" });
  }
});



/*                            DELETE TEACHER                                  */


router.delete("/teachers/:id", teacherAuth, async (req, res) => {
  try {
    const actor = req.user;
    const target = await Teacher.findById(req.params.id);

    if (!target) {
      return res.status(404).json({ msg: "Teacher not found" });
    }

    if (actor.id === target.id) {
      return res.status(400).json({ msg: "Cannot delete yourself" });
    }

    if (!canDelete(actor.role, target.role)) {
      return res.status(403).json({ msg: "Not allowed to delete this role" });
    }

    await Teacher.findByIdAndDelete(target.id);

    res.status(200).json({
      success: true,
      msg: "Teacher deleted successfully"
    });

  } catch (err) {
    console.error("Delete teacher error:", err);
    res.status(500).json({ msg: "Failed to delete teacher" });
  }
});


/*                             LIST STUDENTS                                  */


router.get("/students", teacherAuth, async (req, res) => {
  try {
    const { role, branch, year } = req.user;
    let query = {};

    if (role === "superadmin" || role === "admin") {
      query = {};
    } else if (role === "hod") {
      // HODs can see only 2nd, 3rd, 4th year students in their branch
      query = { branch, Year: { $ne: 1 } };
    } else if (role === "dean") {
      query = { Year: Number(year ?? 1) };
    } else if (role === "cc") {
      query = { branch, Year: Number(year) };
    } else {
      return res.status(403).json({ msg: "Not allowed to view students" });
    }

    // Get counts without loading full documents into memory
    const [stats] = await Student.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          paidCount: { $sum: { $cond: ["$isPaid", 1, 0] } },
          ticketCount: {
            $sum: {
              $cond: ["$isPaid", { $ifNull: ["$token", 0] }, 0]
            }
          }
        }
      }
    ]);

    const students = await Student.find(query)
      .select("name email phone branch Year isPaid token")
      .sort({ Year: 1, name: 1 })
      .lean();

    res.status(200).json({
      success: true,
      count: stats?.count ?? students.length,
      paidCount: stats?.paidCount ?? 0,
      ticketCount: stats?.ticketCount ?? 0, // Sum of all student event tokens (insider tickets)
      data: students
    });

  } catch (err) {
    console.error("Fetch students error:", err);
    res.status(500).json({ msg: "Error fetching students" });
  }
});


/*                         EXCEL UPLOAD (INSIDER)                              */


router.post(
  "/check-excel",
  teacherAuth,
  upload.single("file"),
  (req, res, next) => {
    if (!["superadmin", "admin"].includes(req.user.role)) {
      return res.status(403).json({ msg: "Access denied" });
    }
    next();
  },
  CheckStudents
);

router.patch(
  "/students/fee",
  teacherAuth,
  toggleStudentFee
);

router.get("/teachers/:id/marked-students", teacherAuth, async (req, res) => {
  try {
    const requester = req.user;

    if (!["admin", "superadmin"].includes(requester.role)) {
      return res.status(403).json({ msg: "Not allowed" });
    }

    const teacherId = req.params.id;
    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
      return res.status(404).json({ msg: "Teacher not found" });
    }

    const students = await Student.find(
      { markedBy: teacherId },
      { name: 1, email: 1, branch: 1, Year: 1, isPaid: 1 }
    ).sort({ Year: 1, name: 1 }).lean();

    return res.status(200).json({ success: true, data: students });
  } catch (err) {
    console.error("Fetch marked students error:", err);
    return res.status(500).json({ msg: "Failed to fetch marked students" });
  }
});

router.post(
  "/register-excel",
  teacherAuth,
  upload.single("file"),
  (req, res, next) => {
    if (!["superadmin", "admin"].includes(req.user.role)) {
      return res.status(403).json({ msg: "Access denied" });
    }
    next();
  },
  RegisterStudents
);

/*                     EVENT REGISTRATION EXCEL EXPORT                        */

router.get("/students/excel", teacherAuth, async (req, res) => {
  try {
    const { role, branch, year } = req.user;
    let query = {};

    if (role === "superadmin" || role === "admin") {
      query = {};
    } else if (role === "hod") {
      query = { branch, Year: { $ne: 1 } };
    } else if (role === "dean") {
      query = { Year: Number(year ?? 1) };
    } else if (role === "cc") {
      query = { branch, Year: Number(year) };
    } else {
      return res.status(403).json({ msg: "Not allowed to export students" });
    }

    const students = await Student.find(query)
      .select("name email phone branch Year isPaid token")
      .sort({ Year: 1, name: 1 })
      .lean();

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Students");
    sheet.columns = [
      { header: "Name", key: "name", width: 26 },
      { header: "Email", key: "email", width: 34 },
      { header: "Phone", key: "phone", width: 16 },
      { header: "Branch", key: "branch", width: 12 },
      { header: "Year", key: "year", width: 8 },
      { header: "Fee Paid", key: "isPaid", width: 10 },
      { header: "Tokens", key: "token", width: 8 }
    ];
    sheet.getRow(1).font = { bold: true };

    students.forEach((s) => {
      sheet.addRow({
        name: s.name || "",
        email: s.email || "",
        phone: s.phone || "",
        branch: s.branch || "",
        year: s.Year ?? "",
        isPaid: s.isPaid ? "Yes" : "No",
        token: s.token ?? 0
      });
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="students.xlsx"'
    );
    res.setHeader("Cache-Control", "no-store");

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error("Students export error:", err);
    res.status(500).json({ msg: "Failed to export students" });
  }
});

router.get("/events/registrations-excel", teacherAuth, async (req, res) => {
  try {
    const requester = req.user;
    if (!["superadmin", "admin"].includes(requester.role)) {
      return res.status(403).json({ msg: "Not allowed" });
    }

    const [events, students] = await Promise.all([
      Event.find().select("_id title").sort({ title: 1 }).lean(),
      Student.find()
        .select("name email phone branch Year year events")
        .lean()
    ]);

    const map = new Map();
    for (const e of events) {
      map.set(String(e._id), []);
    }
    const unknownEventRows = [];

    const eventTitleById = new Map();
    for (const e of events) {
      eventTitleById.set(String(e._id), e.title || "");
    }

    for (const s of students) {
      const eventIds = Array.isArray(s.events) ? s.events : [];
      for (const evId of eventIds) {
        const key = String(evId);
        const row = {
          name: s.name || "",
          email: s.email || "",
          phone: s.phone || "",
          branch: s.branch || "",
          year: s.Year ?? s.year ?? ""
        };
        if (!map.has(key)) {
          unknownEventRows.push({
            ...row,
            eventId: key
          });
          continue;
        }
        map.get(key).push(row);
      }
    }

    const workbook = new ExcelJS.Workbook();
    const usedNames = new Set();

    const makeSheetName = (raw, index) => {
      const cleaned = String(raw || `EVENT-${index + 1}`)
        .replace(/[\\/?*:[\]]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      let name = cleaned.slice(0, 31) || `EVENT-${index + 1}`;
      let suffix = 1;
      while (usedNames.has(name)) {
        const base = name.slice(0, 28);
        name = `${base}-${suffix}`;
        suffix += 1;
      }
      usedNames.add(name);
      return name;
    };

    // Master sheet: all students + their event titles
    const masterSheet = workbook.addWorksheet("Ren Event Data");
    masterSheet.columns = [
      { header: "Name", key: "name", width: 26 },
      { header: "Email", key: "email", width: 34 },
      { header: "Phone", key: "phone", width: 16 },
      { header: "Branch", key: "branch", width: 12 },
      { header: "Year", key: "year", width: 8 },
      { header: "Events", key: "events", width: 60 }
    ];
    masterSheet.getRow(1).font = { bold: true };
    students.forEach((s) => {
      const eventIds = Array.isArray(s.events) ? s.events : [];
      const titles = eventIds.map((id) => eventTitleById.get(String(id)) || `Unknown(${String(id)})`);
      masterSheet.addRow({
        name: s.name || "",
        email: s.email || "",
        phone: s.phone || "",
        branch: s.branch || "",
        year: s.Year ?? s.year ?? "",
        events: titles.join(", ")
      });
    });

    events.forEach((event, idx) => {
      const sheetName = makeSheetName(event.title, idx);
      const sheet = workbook.addWorksheet(sheetName);
      sheet.columns = [
        { header: "Name", key: "name", width: 26 },
        { header: "Email", key: "email", width: 34 },
        { header: "Phone", key: "phone", width: 16 },
        { header: "Branch", key: "branch", width: 12 },
        { header: "Year", key: "year", width: 8 }
      ];
      sheet.getRow(1).font = { bold: true };

      const rows = map.get(String(event._id)) || [];
      rows.forEach((r) => sheet.addRow(r));
    });

    if (unknownEventRows.length) {
      const unknownSheet = workbook.addWorksheet("Unknown Events");
      unknownSheet.columns = [
        { header: "Event ID", key: "eventId", width: 28 },
        { header: "Name", key: "name", width: 26 },
        { header: "Email", key: "email", width: 34 },
        { header: "Phone", key: "phone", width: 16 },
        { header: "Branch", key: "branch", width: 12 },
        { header: "Year", key: "year", width: 8 }
      ];
      unknownSheet.getRow(1).font = { bold: true };
      unknownEventRows.forEach((r) => unknownSheet.addRow(r));
    }

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="Ren Event Data.xlsx"'
    );
    res.setHeader("Cache-Control", "no-store");

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error("Event registrations export error:", err);
    res.status(500).json({ msg: "Failed to export registrations" });
  }
});



/*                          // STUDENT SEARCH                                   */


router.get("/search-student", teacherAuth, async (req, res) => {
  try {
    const { query } = req.query;
    const results = await Student.find({
      name: { $regex: query, $options: "i" }
    }).limit(10);

    res.json(results);
  } catch (err) {
    res.status(500).json({ msg: "Search failed" });
  }
});

router.get("/outsiders", authMiddleware, async (req, res) => {
  const outsiders = await OutsiderPass.find()
    .sort({ createdAt: -1 })
    .lean();
  res.json({ success: true, data: outsiders });
});


/*                        MANUAL STUDENT ADD (RBAC SAFE)                      */

router.post("/students/manual", teacherAuth, async (req, res) => {
  try {
    const { name, email, branch, Year, isPaid } = req.body;
    const actor = req.user;

    if (!name || !email || !branch || !Year) {
      return res.status(400).json({ msg: "Missing fields" });
    }

    // RBAC
    if (
      actor.role === "hod"
        ? branch !== actor.branch
        : actor.role === "dean"
        ? Year !== (actor.year ?? 1)
        : actor.role === "cc"
        ? branch !== actor.branch || Year !== actor.year
        : false
    ) {
      return res.status(403).json({ msg: "Not allowed to add student" });
    }

    const exists = await Student.findOne({ email });
    if (exists) {
      return res.status(409).json({ msg: "Student already exists" });
    }

    const student = await Student.create({
      name,
      email,
      branch,
      Year,
      isPaid: !!isPaid,
      markedBy: isPaid ? actor.id : null,
      markedAt: isPaid ? new Date() : null,
      token: 0,
      password: null
    });

    // If requested, mark as paid and issue pass (reuses same logic as toggleStudentFee -> bookTicket)
    if (isPaid) {
      const plainPassword = await password_generator(8);
      const hashedPassword = await bcrypt.hash(plainPassword, 10);

      student.password = hashedPassword;
      student.token = (student.token || 0) + 4;
      await student.save();

      // Fire-and-forget to keep UI responsive
      bookTicket(
        student._id,
        student.name,
        student.Year,
        student.branch,
        student.email,
        plainPassword
      ).catch((e) => {
        console.warn('Async pass/email failed:', e?.message || e);
      });

      return res.status(201).json({ success: true, msg: 'Student added and marked paid', data: student });
    }

    res.status(201).json({
      success: true,
      msg: "Student added successfully (fee not paid)",
      data: student
    });

  } catch (err) {
    console.error("Manual student add error:", err);
    res.status(500).json({ msg: "Failed to add student" });
  }
});

// Backwards-compatible alias for older frontends
router.post('/manualentry', teacherAuth, async (req, res) => {
  // Duplicate of /students/manual to preserve compatibility with older frontends
  try {
    const { name, email, branch, Year, isPaid } = req.body;
    const actor = req.user;

    if (!name || !email || !branch || !Year) {
      return res.status(400).json({ msg: "Missing fields" });
    }

    // RBAC
    if (
      actor.role === "hod"
        ? branch !== actor.branch
        : actor.role === "dean"
        ? Year !== (actor.year ?? 1)
        : actor.role === "cc"
        ? branch !== actor.branch || Year !== actor.year
        : false
    ) {
      return res.status(403).json({ msg: "Not allowed to add student" });
    }

    const exists = await Student.findOne({ email });
    if (exists) {
      return res.status(409).json({ msg: "Student already exists" });
    }

    const student = await Student.create({
      name,
      email,
      branch,
      Year,
      isPaid: !!isPaid,
      markedBy: isPaid ? actor.id : null,
      markedAt: isPaid ? new Date() : null,
      token: 0,
      password: null
    });

    if (isPaid) {
      const plainPassword = await password_generator(8);
      const hashedPassword = await bcrypt.hash(plainPassword, 10);

      student.password = hashedPassword;
      student.token = (student.token || 0) + 4;
      await student.save();

      bookTicket(
        student._id,
        student.name,
        student.Year,
        student.branch,
        student.email,
        plainPassword
      ).catch((e) => {
        console.warn('Async pass/email failed:', e?.message || e);
      });

      return res.status(201).json({ success: true, msg: 'Student added and marked paid', data: student });
    }

    res.status(201).json({ success: true, msg: "Student added successfully (fee not paid)", data: student });

  } catch (err) {
    console.error("Manual student add (alias) error:", err);
    res.status(500).json({ msg: "Failed to add student" });
  }
});

export default router;
