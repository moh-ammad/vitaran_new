import type { RequestHandler } from "express";
import { verifyAdminToken } from "../services/auth.service.js";
import { AppError } from "../utils/app-error.js";

const BEARER_PREFIX = "Bearer ";

export const requireAdmin: RequestHandler = async (req, res, next) => {
  const header = req.get("authorization");

  if (!header?.startsWith(BEARER_PREFIX)) {
    next(new AppError(401, "Authentication required"));
    return;
  }

  try {
    res.locals.admin = await verifyAdminToken(
      header.slice(BEARER_PREFIX.length).trim(),
    );
    next();
  } catch (error) {
    next(error);
  }
};
