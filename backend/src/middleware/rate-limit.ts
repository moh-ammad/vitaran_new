import { rateLimit } from "express-rate-limit";
import { sendError } from "../utils/api-response.js";

const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 10;

// Keyed by account because logins are proxied through the Next.js server, so the client IP is shared.
function createLoginRateLimit(field: "email" | "identifier") {
  return rateLimit({
    windowMs: LOGIN_WINDOW_MS,
    limit: LOGIN_MAX_ATTEMPTS,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    keyGenerator: (req) => {
      const account: unknown = req.body?.[field];
      return typeof account === "string" ? account : "unknown";
    },
    handler: (_req, res) => {
      sendError(res, 429, "Too many login attempts. Please try again later.");
    },
  });
}

export const loginRateLimit = createLoginRateLimit("email");
export const schoolLoginRateLimit = createLoginRateLimit("identifier");
export const teacherLoginRateLimit = createLoginRateLimit("identifier");

export const forgotPasswordRateLimit = rateLimit({
  windowMs: LOGIN_WINDOW_MS,
  limit: 8,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  keyGenerator: (req) => {
    const email: unknown = req.body?.email;
    return typeof email === "string" ? email.toLowerCase() : "unknown";
  },
  handler: (_req, res) => {
    sendError(res, 429, "Too many password reset attempts. Please try again later.");
  },
});
