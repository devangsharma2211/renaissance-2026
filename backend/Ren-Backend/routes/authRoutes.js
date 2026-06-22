import express from "express";
import { loginAppAdmin, logoutAppAdmin, createStudent, listStudents, deleteStudent } from "../controllers/authController.js";
import appAdminAuth from "../middlewares/appAdminAuth.js";
import appUserAuth from "../middlewares/appUserAuth.js";

const router = express.Router();

router.post("/login", loginAppAdmin);
router.post("/logout", appUserAuth, logoutAppAdmin);
router.post("/students", appAdminAuth, createStudent);
router.get("/students", appAdminAuth, listStudents);
router.delete("/students/:id", appAdminAuth, deleteStudent);

export default router;
