import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import AppAdmin from "../models/AppAdmin.js";
import AppStudent from "../models/AppStudent.js";

const jwtSecret = process.env.JWT_SECRET;
const maxDevices = 1;

const normalizeEmail = (email) => (email || "").toString().trim().toLowerCase();

export const loginAppAdmin = async (req, res) => {
  try {
    const { email, password, deviceId } = req.body || {};
    if (!email || !password || !deviceId) {
      return res.status(400).json({ msg: "Email, password, and deviceId are required" });
    }

    const normalizedEmail = normalizeEmail(email);
    let account = await AppAdmin.findOne({ email: normalizedEmail });
    let role = "admin";
    if (!account) {
      account = await AppStudent.findOne({ email: normalizedEmail });
      role = "student";
    }

    if (!account) {
      return res.status(401).json({ msg: "Invalid credentials" });
    }

    const ok = await bcrypt.compare(password, account.password);
    if (!ok) {
      return res.status(401).json({ msg: "Invalid credentials" });
    }

    const devices = Array.isArray(account.devices) ? account.devices : [];
    if (!devices.includes(deviceId)) {
      if (devices.length >= maxDevices) {
        return res.status(403).json({ msg: "Device limit reached" });
      }
      devices.push(deviceId);
      account.devices = devices;
      await account.save();
    }

    if (!jwtSecret) {
      return res.status(500).json({ msg: "JWT_SECRET missing" });
    }

    const token = jwt.sign(
      { id: account._id, email: account.email, deviceId, role },
      jwtSecret,
      { expiresIn: "7d" }
    );

    const userPayload = { email: account.email, name: account.name, role };

    return res.status(200).json({
      token,
      user: userPayload,
      admin: role === "admin" ? userPayload : undefined
    });
  } catch (err) {
    console.error("App admin login error:", err);
    return res.status(500).json({ msg: "Server error" });
  }
};

export const logoutAppAdmin = async (req, res) => {
  try {
    const user = req.appUser;
    const deviceId = req.deviceId;
    if (!user) {
      return res.status(401).json({ msg: "Unauthorized" });
    }

    if (deviceId) {
      const devices = Array.isArray(user.devices) ? user.devices : [];
      user.devices = devices.filter((d) => d !== deviceId);
      await user.save();
    }

    return res.status(200).json({ msg: "Logged out" });
  } catch (err) {
    console.error("App admin logout error:", err);
    return res.status(500).json({ msg: "Server error" });
  }
};

export const createStudent = async (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    if (!name || !email || !password) {
      return res.status(400).json({ msg: "Name, email, and password are required" });
    }

    const normalizedEmail = normalizeEmail(email);

    const adminExists = await AppAdmin.findOne({ email: normalizedEmail });
    if (adminExists) {
      return res.status(409).json({ msg: "Email is already used by an admin" });
    }

    const studentExists = await AppStudent.findOne({ email: normalizedEmail });
    if (studentExists) {
      return res.status(409).json({ msg: "Student already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const student = await AppStudent.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashed,
      createdBy: req.admin?._id
    });

    return res.status(201).json({
      student: { id: student._id, name: student.name, email: student.email }
    });
  } catch (err) {
    console.error("Create student error:", err);
    return res.status(500).json({ msg: "Server error" });
  }
};

export const listStudents = async (_req, res) => {
  try {
    const students = await AppStudent.find({})
      .select("name email createdAt")
      .sort({ createdAt: -1 });
    return res.status(200).json({ students });
  } catch (err) {
    console.error("List students error:", err);
    return res.status(500).json({ msg: "Server error" });
  }
};

export const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ msg: "Student id required" });
    }
    const student = await AppStudent.findByIdAndDelete(id);
    if (!student) {
      return res.status(404).json({ msg: "Student not found" });
    }
    return res.status(200).json({ msg: "Student deleted" });
  } catch (err) {
    console.error("Delete student error:", err);
    return res.status(500).json({ msg: "Server error" });
  }
};
