import { Router } from "express";
import { getCurrentAdmin, login } from "../controllers/auth.controller.js";
import { googleLogin } from "../controllers/google-auth.controller.js";
import {
  requestForgotPasswordOtp,
  verifyForgotPasswordOtp,
} from "../controllers/forgot-password.controller.js";
import { getCurrentSchool, schoolLogin } from "../controllers/school-auth.controller.js";
import { getCurrentStudent, studentLogin } from "../controllers/student-auth.controller.js";
import { getCurrentTeacher, teacherLogin } from "../controllers/teacher-auth.controller.js";
import {
  requireAdmin,
  requireSchool,
  requireStudent,
  requireTeacher,
} from "../middleware/authenticate.js";
import {
  forgotPasswordRateLimit,
  googleLoginRateLimit,
  loginRateLimit,
  schoolLoginRateLimit,
  studentLoginRateLimit,
  teacherLoginRateLimit,
} from "../middleware/rate-limit.js";
import { validate } from "../middleware/validate.js";
import {
  forgotPasswordRequestSchema,
  forgotPasswordVerifySchema,
  googleLoginSchema,
  loginSchema,
  schoolLoginSchema,
  studentLoginSchema,
} from "../schemas/auth.schema.js";

export const authRouter = Router();

authRouter.post("/login", validate(loginSchema), loginRateLimit, login);
authRouter.post(
  "/google",
  validate(googleLoginSchema),
  googleLoginRateLimit,
  googleLogin,
);
authRouter.get("/me", requireAdmin, getCurrentAdmin);

authRouter.post(
  "/school/login",
  validate(schoolLoginSchema),
  schoolLoginRateLimit,
  schoolLogin,
);
authRouter.get("/school/me", requireSchool, getCurrentSchool);

authRouter.post(
  "/teacher/login",
  validate(schoolLoginSchema),
  teacherLoginRateLimit,
  teacherLogin,
);
authRouter.get("/teacher/me", requireTeacher, getCurrentTeacher);

authRouter.post(
  "/student/login",
  validate(studentLoginSchema),
  studentLoginRateLimit,
  studentLogin,
);
authRouter.get("/student/me", requireStudent, getCurrentStudent);

authRouter.post(
  "/forgot-password",
  validate(forgotPasswordRequestSchema),
  forgotPasswordRateLimit,
  requestForgotPasswordOtp,
);
authRouter.post(
  "/forgot-password/verify",
  validate(forgotPasswordVerifySchema),
  forgotPasswordRateLimit,
  verifyForgotPasswordOtp,
);
