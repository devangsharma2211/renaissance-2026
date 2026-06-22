import jwt from "jsonwebtoken";
import AppAdmin from "../models/AppAdmin.js";

const jwtSecret = process.env.JWT_SECRET;

const appAdminAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ msg: "Authorization token missing" });
    }
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, jwtSecret);
    const admin = await AppAdmin.findById(decoded.id);
    if (!admin) {
      return res.status(401).json({ msg: "Unauthorized" });
    }
    req.admin = admin;
    req.deviceId = decoded.deviceId || null;
    next();
  } catch (err) {
    return res.status(401).json({ msg: "Invalid token" });
  }
};

export default appAdminAuth;
