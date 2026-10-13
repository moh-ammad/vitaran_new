import type { RequestHandler } from "express";
import type {
  ListAnswerKeysQuery,
  UpdateAnswerKeyQuery,
  UploadAnswerKeyQuery,
} from "../schemas/answer-key.schema.js";
import * as answerKeyService from "../services/answer-key.service.js";
import type { SchoolAccountDto } from "../services/school.service.js";
import { sendSuccess } from "../utils/api-response.js";
import { sendPdf } from "../utils/pdf.js";

type IdParams = { id: string };

export const listAnswerKeys: RequestHandler = async (req, res) => {
  const { limit } = req.query as unknown as ListAnswerKeysQuery;
  sendSuccess(res, await answerKeyService.listRecentAnswerKeys(limit));
};

export const getAnswerKeyStats: RequestHandler = async (_req, res) => {
  sendSuccess(res, await answerKeyService.getAnswerKeyStats());
};

export const getAnswerKey: RequestHandler<IdParams> = async (req, res) => {
  sendSuccess(res, await answerKeyService.getAnswerKey(req.params.id));
};

export const uploadAnswerKey: RequestHandler = async (req, res) => {
  sendSuccess(
    res,
    await answerKeyService.uploadAnswerKey(req.query as unknown as UploadAnswerKeyQuery, req.body),
    201,
  );
};

export const updateAnswerKey: RequestHandler<IdParams> = async (req, res) => {
  sendSuccess(
    res,
    await answerKeyService.updateAnswerKey(
      req.params.id,
      req.query as unknown as UpdateAnswerKeyQuery,
      req.body,
    ),
  );
};

export const getAnswerKeyFile: RequestHandler<IdParams> = async (req, res) => {
  sendPdf(res, await answerKeyService.getAnswerKeyFile(req.params.id));
};

export const listSchoolAnswerKeys: RequestHandler = async (_req, res) => {
  sendSuccess(res, await answerKeyService.listSchoolAnswerKeys(res.locals.school as SchoolAccountDto));
};

export const getSchoolAnswerKeyFile: RequestHandler<IdParams> = async (req, res) => {
  sendPdf(
    res,
    await answerKeyService.getAnswerKeyFile(req.params.id, res.locals.school as SchoolAccountDto),
  );
};

export const deleteAnswerKey: RequestHandler<IdParams> = async (req, res) => {
  await answerKeyService.deleteAnswerKey(req.params.id);
  res.status(204).end();
};
