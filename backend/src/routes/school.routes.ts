import { Router } from "express";
import {
  createSchool,
  deleteSchool,
  getAccountAvailability,
  getSchool,
  getSchoolStats,
  listSchools,
  resetSchoolPassword,
  sendSchoolCredentials,
  updateSchool,
} from "../controllers/school.controller.js";
import { requireAdmin } from "../middleware/authenticate.js";
import { validate } from "../middleware/validate.js";
import {
  accountAvailabilityQuerySchema,
  createSchoolSchema,
  listSchoolsQuerySchema,
  resetSchoolPasswordSchema,
  schoolIdParamsSchema,
  updateSchoolSchema,
} from "../schemas/school.schema.js";

export const schoolRouter = Router();

schoolRouter.use(requireAdmin);

schoolRouter.get("/", validate(listSchoolsQuerySchema, "query"), listSchools);
schoolRouter.get("/stats", getSchoolStats);
schoolRouter.get(
  "/account-availability",
  validate(accountAvailabilityQuerySchema, "query"),
  getAccountAvailability,
);
schoolRouter.post("/", validate(createSchoolSchema), createSchool);
schoolRouter.get("/:id", validate(schoolIdParamsSchema, "params"), getSchool);
schoolRouter.patch(
  "/:id",
  validate(schoolIdParamsSchema, "params"),
  validate(updateSchoolSchema),
  updateSchool,
);
schoolRouter.post(
  "/:id/send-credentials",
  validate(schoolIdParamsSchema, "params"),
  sendSchoolCredentials,
);
schoolRouter.post(
  "/:id/reset-password",
  validate(schoolIdParamsSchema, "params"),
  validate(resetSchoolPasswordSchema),
  resetSchoolPassword,
);
schoolRouter.delete(
  "/:id",
  validate(schoolIdParamsSchema, "params"),
  deleteSchool,
);
