import { Router } from "express";
import {
  answerKeyRouter,
  schoolAnswerKeyRouter,
  teacherAnswerKeyRouter,
} from "./answer-key.routes.js";
import { authRouter } from "./auth.routes.js";
import { healthRouter } from "./health.routes.js";
import { schoolEventsRouter, teacherEventsRouter } from "./live.routes.js";
import {
  resultRouter,
  schoolResultRouter,
  teacherResultRouter,
} from "./result.routes.js";
import { programCatalogRouter, programRouter } from "./program.routes.js";
import { schoolRouter } from "./school.routes.js";
import { schoolTeacherRouter, teacherRouter } from "./teacher.routes.js";

export const apiRouter = Router();

apiRouter.use("/health", healthRouter);
apiRouter.use("/auth", authRouter);
apiRouter.use("/schools", schoolRouter);
apiRouter.use("/programs", programRouter);
apiRouter.use("/catalog/programs", programCatalogRouter);
apiRouter.use("/teachers", teacherRouter);
apiRouter.use("/answer-keys", answerKeyRouter);
apiRouter.use("/results", resultRouter);
apiRouter.use("/school/teachers", schoolTeacherRouter);
apiRouter.use("/school/answer-keys", schoolAnswerKeyRouter);
apiRouter.use("/school/results", schoolResultRouter);
apiRouter.use("/school/events", schoolEventsRouter);
apiRouter.use("/teacher/events", teacherEventsRouter);
apiRouter.use("/teacher/answer-keys", teacherAnswerKeyRouter);
apiRouter.use("/teacher/results", teacherResultRouter);
