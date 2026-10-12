import type { RequestHandler } from "express";
import { getHealthStatus } from "../services/health.service.js";
import { sendSuccess } from "../utils/api-response.js";

export const getHealth: RequestHandler = (_req, res) => {
  sendSuccess(res, getHealthStatus());
};
