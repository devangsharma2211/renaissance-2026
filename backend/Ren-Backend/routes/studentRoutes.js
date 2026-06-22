import express from "express";
import { loginStudent } from "../controllers/studentController.js";
import { studentLoginLimiter } from "../middlewares/rateLimiter.js";

const router = express.Router();

router.post("/login", studentLoginLimiter, loginStudent);

export default router;
