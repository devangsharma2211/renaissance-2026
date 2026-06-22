import jwt from "jsonwebtoken";
import AppAdmin from "../models/AppAdmin.js";
import AppStudent from "../models/AppStudent.js";

const jwtSecret = process.env.JWT_SECRET;

const appUserAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ msg: "Authorization token missing" });
    }
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, jwtSecret);

    let user = null;
    if (decoded.role === "admin") {
      user = await AppAdmin.findById(decoded.id);
    } else if (decoded.role === "student") {
      user = await AppStudent.findById(decoded.id);
    } else if (decoded.role === "staff") {
      user = await AppStudent.findById(decoded.id);
    } else {
      user = await AppAdmin.findById(decoded.id) || await AppStudent.findById(decoded.id);
    }

    if (!user) {
      return res.status(401).json({ msg: "Unauthorized" });
    }

    req.appUser = user;
    req.deviceId = decoded.deviceId || null;
    req.appRole = decoded.role || "student";
    next();
  } catch (err) {
    return res.status(401).json({ msg: "Invalid token" });
  }
};

export default appUserAuth;
