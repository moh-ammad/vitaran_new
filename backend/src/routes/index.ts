import { Router } from "express";
import { getAdminDashboard } from "../controllers/dashboard.controller.js";
import { requireAdmin } from "../middleware/authenticate.js";
import {
  answerKeyRouter,
  schoolAnswerKeyRouter,
  teacherAnswerKeyRouter,
} from "./answer-key.routes.js";
import { authRouter } from "./auth.routes.js";
import { healthRouter } from "./health.routes.js";
import { adminEventsRouter, schoolEventsRouter, studentEventsRouter, teacherEventsRouter } from "./live.routes.js";
import { studentOmScanRouter, teacherOmScanRouter } from "./om-scan.routes.js";
import {
  analysisRouter,
  schoolAnalysisRouter,
  studentAnalysisRouter,
  teacherAnalysisRouter,
} from "./analysis.routes.js";
import {
  resultRouter,
  schoolResultRouter,
  studentResultRouter,
  teacherResultRouter,
} from "./result.routes.js";
import { programCatalogRouter, programRouter } from "./program.routes.js";
import { schoolRouter } from "./school.routes.js";
import { adminSchoolSectionRouter, schoolSectionRouter } from "./section.routes.js";
import {
  adminSchoolStudentRouter,
  adminStudentRouter,
  schoolStudentRouter,
  teacherStudentRouter,
} from "./student.routes.js";
import { schoolTeacherRouter, teacherRouter } from "./teacher.routes.js";

export const apiRouter = Router();

apiRouter.use("/health", healthRouter);
apiRouter.use("/auth", authRouter);
apiRouter.get("/dashboard", requireAdmin, getAdminDashboard);
apiRouter.use("/admin/events", adminEventsRouter);
apiRouter.use("/schools", schoolRouter);
apiRouter.use("/schools/:schoolId/sections", adminSchoolSectionRouter);
apiRouter.use("/schools/:schoolId/students", adminSchoolStudentRouter);
apiRouter.use("/students", adminStudentRouter);
apiRouter.use("/programs", programRouter);
apiRouter.use("/catalog/programs", programCatalogRouter);
apiRouter.use("/teachers", teacherRouter);
apiRouter.use("/answer-keys", answerKeyRouter);
apiRouter.use("/results", resultRouter);
apiRouter.use("/analysis", analysisRouter);
apiRouter.use("/school/teachers", schoolTeacherRouter);
apiRouter.use("/school/sections", schoolSectionRouter);
apiRouter.use("/school/students", schoolStudentRouter);
apiRouter.use("/school/answer-keys", schoolAnswerKeyRouter);
apiRouter.use("/school/results", schoolResultRouter);
apiRouter.use("/school/analysis", schoolAnalysisRouter);
apiRouter.use("/school/events", schoolEventsRouter);
apiRouter.use("/teacher/events", teacherEventsRouter);
apiRouter.use("/student/events", studentEventsRouter);
apiRouter.use("/teacher/answer-keys", teacherAnswerKeyRouter);
apiRouter.use("/teacher/results", teacherResultRouter);
apiRouter.use("/teacher/analysis", teacherAnalysisRouter);
apiRouter.use("/teacher/students", teacherStudentRouter);
apiRouter.use("/teacher/omr-scans", teacherOmScanRouter);
apiRouter.use("/student/omr-scans", studentOmScanRouter);
apiRouter.use("/student/results", studentResultRouter);
apiRouter.use("/student/analysis", studentAnalysisRouter);
