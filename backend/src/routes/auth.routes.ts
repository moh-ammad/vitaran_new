import { Router } from "express";
import { getCurrentAdmin, login } from "../controllers/auth.controller.js";
import { requireAdmin } from "../middleware/authenticate.js";
import { loginRateLimit } from "../middleware/rate-limit.js";
import { validate } from "../middleware/validate.js";
import { loginSchema } from "../schemas/auth.schema.js";

export const authRouter = Router();

authRouter.post("/login", validate(loginSchema), loginRateLimit, login);
authRouter.get("/me", requireAdmin, getCurrentAdmin);
