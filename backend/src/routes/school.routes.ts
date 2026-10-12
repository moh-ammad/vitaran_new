import { Router } from "express";
import {
  createSchool,
  deleteSchool,
  getSchool,
  getSchoolStats,
  listSchools,
  updateSchool,
} from "../controllers/school.controller.js";
import { requireAdmin } from "../middleware/authenticate.js";
import { validate } from "../middleware/validate.js";
import {
  createSchoolSchema,
  listSchoolsQuerySchema,
  schoolIdParamsSchema,
  updateSchoolSchema,
} from "../schemas/school.schema.js";

export const schoolRouter = Router();

schoolRouter.use(requireAdmin);

schoolRouter.get("/", validate(listSchoolsQuerySchema, "query"), listSchools);
schoolRouter.get("/stats", getSchoolStats);
schoolRouter.post("/", validate(createSchoolSchema), createSchool);
schoolRouter.get("/:id", validate(schoolIdParamsSchema, "params"), getSchool);
schoolRouter.patch(
  "/:id",
  validate(schoolIdParamsSchema, "params"),
  validate(updateSchoolSchema),
  updateSchool,
);
schoolRouter.delete(
  "/:id",
  validate(schoolIdParamsSchema, "params"),
  deleteSchool,
);
