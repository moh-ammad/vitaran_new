import express, { Router } from "express";
import {
  deleteAnswerKey,
  getAnswerKey,
  getAnswerKeyFile,
  getAnswerKeyStats,
  listAnswerKeys,
  updateAnswerKey,
  uploadAnswerKey,
} from "../controllers/answer-key.controller.js";
import { requireAdmin } from "../middleware/authenticate.js";
import { validate } from "../middleware/validate.js";
import {
  ANSWER_KEY_MAX_BYTES,
  answerKeyIdParamsSchema,
  listAnswerKeysQuerySchema,
  updateAnswerKeyQuerySchema,
  uploadAnswerKeyQuerySchema,
} from "../schemas/answer-key.schema.js";

const readPdfBody = express.raw({ type: "application/pdf", limit: ANSWER_KEY_MAX_BYTES });
const validateId = validate(answerKeyIdParamsSchema, "params");

export const answerKeyRouter = Router();

answerKeyRouter.use(requireAdmin);

answerKeyRouter.get("/", validate(listAnswerKeysQuerySchema, "query"), listAnswerKeys);
answerKeyRouter.post("/", validate(uploadAnswerKeyQuerySchema, "query"), readPdfBody, uploadAnswerKey);
answerKeyRouter.get("/stats", getAnswerKeyStats);
answerKeyRouter.get("/:id", validateId, getAnswerKey);
answerKeyRouter.patch(
  "/:id",
  validateId,
  validate(updateAnswerKeyQuerySchema, "query"),
  readPdfBody,
  updateAnswerKey,
);
answerKeyRouter.get("/:id/file", validateId, getAnswerKeyFile);
answerKeyRouter.delete("/:id", validateId, deleteAnswerKey);
