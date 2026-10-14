import { Router } from "express";
import { answerKeyRouter, schoolAnswerKeyRouter } from "./answer-key.routes.js";
import { authRouter } from "./auth.routes.js";
import { healthRouter } from "./health.routes.js";
import { schoolEventsRouter } from "./live.routes.js";
import { resultRouter, schoolResultRouter } from "./result.routes.js";
import { schoolRouter } from "./school.routes.js";

export const apiRouter = Router();

apiRouter.use("/health", healthRouter);
apiRouter.use("/auth", authRouter);
apiRouter.use("/schools", schoolRouter);
apiRouter.use("/answer-keys", answerKeyRouter);
apiRouter.use("/school/answer-keys", schoolAnswerKeyRouter);
apiRouter.use("/results", resultRouter);
apiRouter.use("/school/results", schoolResultRouter);
apiRouter.use("/school/events", schoolEventsRouter);
