import { Router } from "express";
import { getAdminAnalysis, getSchoolAnalysis, getTeacherAnalysis } from "../controllers/analysis.controller.js";
import { requireAdmin, requireSchool, requireTeacher } from "../middleware/authenticate.js";
import { validate } from "../middleware/validate.js";
import { analysisQuerySchema } from "../schemas/analysis.schema.js";

export const analysisRouter = Router();
analysisRouter.use(requireAdmin);
analysisRouter.get("/", validate(analysisQuerySchema, "query"), getAdminAnalysis);

export const schoolAnalysisRouter = Router();
schoolAnalysisRouter.use(requireSchool);
schoolAnalysisRouter.get("/", validate(analysisQuerySchema, "query"), getSchoolAnalysis);

export const teacherAnalysisRouter = Router();
teacherAnalysisRouter.use(requireTeacher);
teacherAnalysisRouter.get("/", validate(analysisQuerySchema, "query"), getTeacherAnalysis);
