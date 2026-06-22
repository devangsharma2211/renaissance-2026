import Student from "../models/student.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt"; // Import bcrypt
import normalizePhone from "../utils/phoneNormalizer.js";

export const loginStudent = async (req, res) => {
  const { email, password, phone } = req.body;

  try {
    const normalizedEmail = (email || "").toString().trim().toLowerCase();
    const student = await Student.findOne({ email: normalizedEmail });

    if (!student) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    
    // CRITICAL SECURITY FIX: Use bcrypt to compare the plain text password with the hashed one
    const isPasswordValid = await bcrypt.compare(password, student.password);

    if (!isPasswordValid) { // Use the result of the comparison
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const normalizedPhone = normalizePhone(phone);
    const hasPhone = !!(student.phone && String(student.phone).trim());
    if (!hasPhone) {
      if (!normalizedPhone) {
        return res.status(428).json({
          message: "Phone number required (10 digits) to continue",
          needsPhone: true
        });
      }
      student.phone = normalizedPhone;
      await student.save();
    }

    // Generate JWT token (using process.env.JWT_SECRET as required)
    const token = jwt.sign({ id: student._id }, process.env.JWT_SECRET, { expiresIn: "1d" });

    res.status(200).json({
      message: "Login successful",
      token,
      student: {
        name: student.name,
        email: student.email,
        token: student.token,
        events: student.events,
      },
    });
  } catch (error) {
    console.error("Student login error:", error); 
    res.status(500).json({ message: "Server error" });
  }
};
