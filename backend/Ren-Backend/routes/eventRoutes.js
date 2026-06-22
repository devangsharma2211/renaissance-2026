import express from "express";
import { 
  getTokenCount,
  registerForEvent,
  getAllEvents
} from "../controllers/eventController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

// router.get("/", authMiddleware,getAllEvents);
router.get("/getToken", authMiddleware, getTokenCount);
router.post("/register",authMiddleware, registerForEvent);
router.get("/list", getAllEvents);


export default router;
