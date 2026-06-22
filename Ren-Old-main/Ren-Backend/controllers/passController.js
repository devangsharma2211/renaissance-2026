import FestivalPass from "../models/FestivalPass.js";
import FestivalDay from "../models/FestivalDay.js";
import bookTicket from "../utils/teacher/qrgen.js";
import bcrypt from "bcrypt";
import password_generator from "../utils/teacher/password.js";
import Student from "../models/student.js";



// Toggle student's fee payment status and manage festival pass accordingly
export const toggleStudentFee = async (req, res) => {
  try {
    const { id, isPaid } = req.body;
    const actor = req.user;

    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({ msg: "Student not found" });
    }

    // RBAC check
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

    let pass = await FestivalPass.findOne({ student: student._id });

    // ---------- UNCHECK ----------
    if (isPaid === false) {
      student.isPaid = false;
      student.markedBy = null;
      student.markedAt = null;
      await student.save();

      if (pass) {
        pass.isActive = false;
        await pass.save();
      }

      return res.status(200).json({ msg: "Payment revoked, pass disabled" });
    }

    // ---------- CHECK ----------
    student.isPaid = true;
    student.markedBy = actor.id;
    student.markedAt = new Date();

    // First time payment
    if (!pass) {
      const plainPassword = await password_generator(8);
      const hashedPassword = await bcrypt.hash(plainPassword, 10);

      student.password = hashedPassword;

      pass = await FestivalPass.create({
        student: student._id,
        Day1: false,
        Day2: false,
        Day3: false,
        isActive: true
      });

      // Grant 4 free-event tokens (technical + splash + BGMI + REAL CRICKET)
      student.token = (student.token || 0) + 4;

      await student.save();

      // Fire-and-forget email/QR generation to keep UI responsive
      bookTicket(
        student._id,
        student.name,
        student.Year,
        student.branch,
        student.email,
        plainPassword
      ).catch((err) => {
        console.error("Async bookTicket error:", err?.message || err);
      });

      return res.status(200).json({ msg: "Fee marked & pass issued", tokens: student.token });
    }

    // Re-check (pass exists)
    pass.isActive = true;
    await pass.save();
    await student.save();

    return res.status(200).json({ msg: "Fee marked & pass reactivated" });

  } catch (err) {
    console.error("Toggle fee error:", err);
    res.status(500).json({ msg: "Fee update failed" });
  }
};

export const verifyPass = async (req, res) => {
  try {

    const { passId } = req.body;

    if (!passId) {
      return res.status(400).json({ valid: false, msg: "passId required" });
    }

    // 1. Find pass first
      const pass = await FestivalPass
      .findById(passId)
      .populate("student");


    if (!pass) {
      return res.status(404).json({ valid: false, msg: "Invalid pass" });
    }

      // 2. THEN check isActive
      if (!pass.isActive) {
        return res.status(403).json({
          valid: false,
          msg: "Pass inactive. Fee not paid or revoked.",
          student: {
            name: pass.student.name,
            email: pass.student.email,
            branch: pass.student.branch,
            year: pass.student.Year
          }
          } );
      }

    // Resolve today's festival day
    const today = new Date().toLocaleDateString('en-CA'); 
    const festDay = await FestivalDay.findOne({ date: today });

    if (!festDay) {
      return res.status(403).json({
        valid: false,
        msg: "Festival not active today"
      });
    }

    // Map day → field
    const dayField =
      festDay.day === 1 ? "Day1" :
      festDay.day === 2 ? "Day2" :
      "Day3";

    // Already scanned check
    if (pass[dayField]) {
      return res.status(409).json({
        valid: false,
        msg: `Already scanned for Day ${festDay.day}`,
        student: {
          name: pass.student.name,
          email: pass.student.email,
          branch: pass.student.branch,
          year: pass.student.year ?? pass.student.Year,
        }
      });
    }

    // Mark attendance
    pass[dayField] = true;
    await pass.save();

    return res.status(200).json({
      valid: true,
      msg: `Attendance marked for Day ${festDay.day}`,
      student: {
        name: pass.student.name,
        email: pass.student.email,
        branch: pass.student.branch,
        year: pass.student.year ?? pass.student.Year,
        day: festDay.day
      }
    });

  } catch (err) {
    console.error("Scan error:", err);
    return res.status(500).json({ valid: false, msg: "Server error" });
  }
};
