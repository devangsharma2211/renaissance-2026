import express from "express";
import { verifyPass } from "../controllers/passController.js";
import { verifyOutsiderPass } from "../controllers/outsiderPassController.js";
import { scanLimiter } from "../middlewares/rateLimiter.js";

const router = express.Router();

router.post("/scan", scanLimiter, async (req, res) => {
  const { type, passId } = req.body;
  const normalizedType = String(type || "").toUpperCase();

  if (normalizedType === "INSIDER") {
    return verifyPass(req, res);
  }

  if (normalizedType.startsWith("OUTSIDER") || normalizedType === "OUT") {
    try {
      const result = await verifyOutsiderPass(passId);
      const status = result && typeof result.status === 'number' ? result.status : (result.valid ? 200 : 400);
      return res.status(status).json(result);
    } catch (err) {
      console.error('Outsider scan error:', err);
      return res.status(500).json({ valid: false, msg: 'Server error' });
    }
  }

  return res.status(400).json({ message: "Invalid QR" });
});


export default router;
