import { Router } from "express";
import multer from "multer";
import {
  getStudentOmScanReview,
  getTeacherOmScan,
  listStudentOmScans,
  listOmResultReleases,
  listTeacherOmScans,
  previewOmScanTarget,
  scanOmr,
  setOmResultRelease,
} from "../controllers/om-scan.controller.js";
import { requireStudent, requireTeacher } from "../middleware/authenticate.js";
import { omrScanRateLimit } from "../middleware/rate-limit.js";
import { validate } from "../middleware/validate.js";
import { omResultReleaseSchema, omScanIdentitySchema, omScanTargetQuerySchema } from "../schemas/om-scan.schema.js";
import { AppError } from "../utils/app-error.js";
import { z } from "zod";

const IMAGE_MAX = 16 * 1024 * 1024;

const readImage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: IMAGE_MAX, files: 1 },
  fileFilter: (_req, file, done) => {
    if (!/^image\/(jpeg|png|webp|jpg)/.test(file.mimetype) && !/\.(jpe?g|png|webp)$/i.test(file.originalname)) {
      done(new AppError(400, "Only JPG or PNG OMR photos"));
      return;
    }
    done(null, true);
  },
}).single("file");

export const teacherOmScanRouter = Router();
teacherOmScanRouter.use(requireTeacher);
teacherOmScanRouter.get("/", listTeacherOmScans);
teacherOmScanRouter.get("/target", validate(omScanTargetQuerySchema, "query"), previewOmScanTarget);
teacherOmScanRouter.get("/releases", listOmResultReleases);
teacherOmScanRouter.put("/releases", validate(omResultReleaseSchema), setOmResultRelease);
teacherOmScanRouter.get("/:id", validate(z.object({ id: z.uuid() }), "params"), getTeacherOmScan);
teacherOmScanRouter.post("/", omrScanRateLimit, readImage, validate(omScanIdentitySchema), scanOmr);

export const studentOmScanRouter = Router();
studentOmScanRouter.use(requireStudent);
studentOmScanRouter.get("/", listStudentOmScans);
studentOmScanRouter.get(
  "/:testId/review",
  validate(z.object({ testId: z.string().trim().min(1).max(64) }), "params"),
  getStudentOmScanReview,
);
