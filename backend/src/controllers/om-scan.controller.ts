import type { RequestHandler } from "express";
import type { OmResultReleaseInput, OmScanIdentityInput, OmScanTargetQuery } from "../schemas/om-scan.schema.js";
import * as omScanService from "../services/om-scan.service.js";
import type { TeacherAccountDto } from "../services/teacher.service.js";
import { sendSuccess } from "../utils/api-response.js";
import { AppError } from "../utils/app-error.js";

export const scanOmr: RequestHandler = async (req, res) => {
  const file = req.file;
  if (!file?.buffer) throw new AppError(400, "Attach an OMR sheet image");
  sendSuccess(
    res,
    await omScanService.scanOmrSheet(
      res.locals.teacher as TeacherAccountDto,
      req.body as OmScanIdentityInput,
      file.buffer,
      file.originalname,
    ),
    201,
  );
};

export const previewOmScanTarget: RequestHandler = async (req, res) => {
  sendSuccess(
    res,
    await omScanService.previewOmScanTarget(
      res.locals.teacher as TeacherAccountDto,
      req.query as unknown as OmScanTargetQuery,
    ),
  );
};

export const listOmResultReleases: RequestHandler = async (_req, res) => {
  sendSuccess(res, await omScanService.listOmResultReleases(res.locals.teacher as TeacherAccountDto));
};

export const setOmResultRelease: RequestHandler = async (req, res) => {
  sendSuccess(
    res,
    await omScanService.setOmResultRelease(res.locals.teacher as TeacherAccountDto, req.body as OmResultReleaseInput),
  );
};

export const listTeacherOmScans: RequestHandler = async (req, res) => {
  const testId = typeof req.query.testId === "string" ? req.query.testId : undefined;
  sendSuccess(res, await omScanService.listTeacherOmScans(res.locals.teacher as TeacherAccountDto, testId));
};

export const getTeacherOmScan: RequestHandler<{ id: string }> = async (req, res) => {
  sendSuccess(res, await omScanService.getTeacherOmScan(res.locals.teacher as TeacherAccountDto, req.params.id));
};

export const listStudentOmScans: RequestHandler = async (_req, res) => {
  const student = res.locals.student as { id: string };
  sendSuccess(res, await omScanService.listStudentOmScans(student.id));
};

export const getStudentOmScanReview: RequestHandler<{ testId: string }> = async (req, res) => {
  const student = res.locals.student as { id: string };
  sendSuccess(res, await omScanService.getStudentOmScanReview(student.id, req.params.testId));
};
