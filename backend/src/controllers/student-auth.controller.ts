import type { RequestHandler } from "express";
import type { StudentLoginInput } from "../schemas/auth.schema.js";
import { loginStudent } from "../services/student-auth.service.js";
import type { StudentAccountDto } from "../services/student.service.js";
import { sendSuccess } from "../utils/api-response.js";

export const studentLogin: RequestHandler<unknown, unknown, StudentLoginInput> = async (
  req,
  res,
) => {
  sendSuccess(res, await loginStudent(req.body));
};

export const getCurrentStudent: RequestHandler = (_req, res) => {
  const student: StudentAccountDto = res.locals.student;
  sendSuccess(res, { student });
};
