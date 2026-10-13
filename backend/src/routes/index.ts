import { Router } from "express";
import { answerKeyRouter } from "./answer-key.routes.js";
import { authRouter } from "./auth.routes.js";
import { healthRouter } from "./health.routes.js";
import { schoolAnswerKeyRouter } from "./school-answer-key.routes.js";
import { schoolRouter } from "./school.routes.js";

export const apiRouter = Router();

apiRouter.use("/health", healthRouter);
apiRouter.use("/auth", authRouter);
apiRouter.use("/schools", schoolRouter);
apiRouter.use("/answer-keys", answerKeyRouter);
apiRouter.use("/school/answer-keys", schoolAnswerKeyRouter);
