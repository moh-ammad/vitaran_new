import { Router } from "express";
import { getCurrentAdmin, login } from "../controllers/auth.controller.js";
import { getCurrentSchool, schoolLogin } from "../controllers/school-auth.controller.js";
import { requireAdmin, requireSchool } from "../middleware/authenticate.js";
import { loginRateLimit, schoolLoginRateLimit } from "../middleware/rate-limit.js";
import { validate } from "../middleware/validate.js";
import { loginSchema, schoolLoginSchema } from "../schemas/auth.schema.js";

export const authRouter = Router();

authRouter.post("/login", validate(loginSchema), loginRateLimit, login);
authRouter.get("/me", requireAdmin, getCurrentAdmin);

authRouter.post(
  "/school/login",
  validate(schoolLoginSchema),
  schoolLoginRateLimit,
  schoolLogin,
);
authRouter.get("/school/me", requireSchool, getCurrentSchool);
