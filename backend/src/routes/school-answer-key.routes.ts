import { Router } from "express";
import {
  getSchoolAnswerKeyFile,
  listSchoolAnswerKeys,
} from "../controllers/answer-key.controller.js";
import { requireSchool } from "../middleware/authenticate.js";
import { validate } from "../middleware/validate.js";
import { answerKeyIdParamsSchema } from "../schemas/answer-key.schema.js";

/** Answer keys as seen by a signed-in school. */
export const schoolAnswerKeyRouter = Router();

schoolAnswerKeyRouter.use(requireSchool);

schoolAnswerKeyRouter.get("/", listSchoolAnswerKeys);
schoolAnswerKeyRouter.get(
  "/:id/file",
  validate(answerKeyIdParamsSchema, "params"),
  getSchoolAnswerKeyFile,
);
