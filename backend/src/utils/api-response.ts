import type { Response } from "express";
import type { ApiFailure, ApiSuccess } from "../types/api.js";

export function sendSuccess<T>(res: Response, data: T, statusCode = 200): void {
  const body: ApiSuccess<T> = {
    success: true,
    data,
  };

  res.status(statusCode).json(body);
}

export function sendError(
  res: Response,
  statusCode: number,
  message: string,
  details?: unknown,
): void {
  const body: ApiFailure = {
    success: false,
    error: {
      message,
      ...(details !== undefined ? { details } : {}),
    },
  };

  res.status(statusCode).json(body);
}
