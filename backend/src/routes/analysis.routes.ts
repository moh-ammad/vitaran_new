import { Router } from "express";
import {
  getAdminAnalysis,
  getAdminRanking,
  getAdminRankingFile,
  getSchoolAnalysis,
  getSchoolRanking,
  getSchoolRankingFile,
  getStudentRanking,
  getTeacherAnalysis,
  getTeacherRanking,
  getTeacherRankingFile,
} from "../controllers/analysis.controller.js";
import { requireAdmin, requireSchool, requireStudent, requireTeacher } from "../middleware/authenticate.js";
import { validate } from "../middleware/validate.js";
import { analysisQuerySchema, rankingFileQuerySchema, rankingQuerySchema } from "../schemas/analysis.schema.js";

export const analysisRouter = Router();
analysisRouter.use(requireAdmin);
analysisRouter.get("/", validate(analysisQuerySchema, "query"), getAdminAnalysis);
analysisRouter.get("/ranking/file", validate(rankingFileQuerySchema, "query"), getAdminRankingFile);
analysisRouter.get("/ranking", validate(rankingQuerySchema, "query"), getAdminRanking);

export const schoolAnalysisRouter = Router();
schoolAnalysisRouter.use(requireSchool);
schoolAnalysisRouter.get("/", validate(analysisQuerySchema, "query"), getSchoolAnalysis);
schoolAnalysisRouter.get("/ranking/file", validate(rankingFileQuerySchema, "query"), getSchoolRankingFile);
schoolAnalysisRouter.get("/ranking", validate(rankingQuerySchema, "query"), getSchoolRanking);

export const teacherAnalysisRouter = Router();
teacherAnalysisRouter.use(requireTeacher);
teacherAnalysisRouter.get("/", validate(analysisQuerySchema, "query"), getTeacherAnalysis);
teacherAnalysisRouter.get("/ranking/file", validate(rankingFileQuerySchema, "query"), getTeacherRankingFile);
teacherAnalysisRouter.get("/ranking", validate(rankingQuerySchema, "query"), getTeacherRanking);

export const studentAnalysisRouter = Router();
studentAnalysisRouter.use(requireStudent);
studentAnalysisRouter.get("/ranking", validate(rankingQuerySchema, "query"), getStudentRanking);
