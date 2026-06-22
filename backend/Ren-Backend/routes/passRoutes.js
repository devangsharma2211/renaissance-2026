import express from "express";
import { verifyPass } from "../controllers/passController.js";

const router = express.Router();

router.post("/verify", verifyPass);

export default router;
