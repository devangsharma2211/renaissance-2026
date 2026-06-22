import jwt from "jsonwebtoken";
import Student from "../models/student.js";

const authMiddleware = async (req, res, next) => {
  const authHeader = req.header("Authorization");  // Get Authorization header

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided. Authorization denied." });
  }

  const token = authHeader.split(" ")[1]; // Extract the token after 'Bearer'

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const student = await Student.findById(decoded.id);

    if (!student) {
      return res.status(404).json({ message: "Student not found." });
    }

    req.student = student; // Attach student info to request object
    next();
  } catch (error) {
    console.error(error);
    res.status(401).json({ message: "Invalid token." });
  }
};

export default authMiddleware;
