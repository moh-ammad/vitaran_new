import type { RequestHandler } from "express";
import type { LoginInput } from "../schemas/auth.schema.js";
import { loginAdmin, type AdminProfile } from "../services/auth.service.js";
import { sendSuccess } from "../utils/api-response.js";

export const login: RequestHandler<unknown, unknown, LoginInput> = async (
  req,
  res,
) => {
  sendSuccess(res, await loginAdmin(req.body));
};

export const getCurrentAdmin: RequestHandler = (_req, res) => {
  const admin: AdminProfile = res.locals.admin;
  sendSuccess(res, { admin });
};
