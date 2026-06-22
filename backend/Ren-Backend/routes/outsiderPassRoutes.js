import express from "express";
import multer from "multer";
import rateLimit from 'express-rate-limit';
import { teacherAuth } from "../middlewares/teacherAuth.js";
import {
  uploadOutsiderExcel,
  uploadOutsiderEventExcel,
  createOutsiderManual,
  getAllOutsiders,
  listOutsiders
} from "../controllers/outsiderPassController.js";


const router = express.Router();
const upload = multer({ dest: "uploads/outsider/" });

// Limit upload frequency to prevent accidental floods (per user)
const uploadLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 4, // 4 uploads per minute per user/IP
  message: { message: 'Too many uploads, please wait a moment and try again.' }
});

const allowOutsiderAccess = (req, res, next) => {
  if (!["superadmin", "admin"].includes(req.user.role)) {
    return res.status(403).json({ msg: "Access denied" });
  }
  next();
};
router.post(
  "/outsider/excel",
  teacherAuth,
  allowOutsiderAccess,
  uploadLimiter,
  upload.single("file"),
  uploadOutsiderExcel
);

router.post(
  "/outsider/event-excel",
  teacherAuth,
  allowOutsiderAccess,
  uploadLimiter,
  upload.single("file"),
  uploadOutsiderEventExcel
);

router.post(
  "/outsider/manual",
  teacherAuth,
  allowOutsiderAccess,
  createOutsiderManual
);

router.get("/test", (req, res) => {
  res.json({ ok: true });
});

router.get(
  "/outsider/list",
  teacherAuth,
  allowOutsiderAccess,
  listOutsiders
);

router.get("/outsider", teacherAuth, getAllOutsiders);


console.log("✅ outsiderPassRoutes loaded");

export default router;
