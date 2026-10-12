import { rateLimit } from "express-rate-limit";
import { sendError } from "../utils/api-response.js";

const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 10;

// Keyed by email because logins are proxied through the Next.js server, so the client IP is shared.
export const loginRateLimit = rateLimit({
  windowMs: LOGIN_WINDOW_MS,
  limit: LOGIN_MAX_ATTEMPTS,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  keyGenerator: (req) => {
    const email: unknown = req.body?.email;
    return typeof email === "string" ? email : "unknown";
  },
  handler: (_req, res) => {
    sendError(res, 429, "Too many login attempts. Please try again later.");
  },
});
