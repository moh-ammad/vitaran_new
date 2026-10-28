import type { RequestHandler } from "express";
import type { AnalysisQuery } from "../schemas/analysis.schema.js";
import * as analysisService from "../services/analysis.service.js";
import type { SchoolAccountDto } from "../services/school.service.js";
import type { TeacherAccountDto } from "../services/teacher.service.js";
import { sendSuccess } from "../utils/api-response.js";

export const getAdminAnalysis: RequestHandler = async (req, res) => {
  sendSuccess(res, await analysisService.getAnalysis(req.query as AnalysisQuery));
};

export const getSchoolAnalysis: RequestHandler = async (req, res) => {
  const school = res.locals.school as SchoolAccountDto;
  sendSuccess(
    res,
    await analysisService.getAnalysis(req.query as AnalysisQuery, { kind: "school", schoolId: school.id }),
  );
};

export const getTeacherAnalysis: RequestHandler = async (req, res) => {
  sendSuccess(
    res,
    await analysisService.getAnalysis(req.query as AnalysisQuery, {
      kind: "teacher",
      teacher: res.locals.teacher as TeacherAccountDto,
    }),
  );
};
