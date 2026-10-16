import { Router } from "express";
import { z } from "zod";
import { getSchoolDashboard } from "../controllers/portal.controller.js";
import {
  createTeacher,
  createTeacherForSchool,
  deleteTeacher,
  getTeacher,
  listAdminClassTeacherSlots,
  listSchoolClasses,
  listSchoolClassTeacherSlots,
  listTeachers,
  setSchoolClassTeacher,
  setTeacherStatus,
  updateTeacher,
} from "../controllers/teacher.controller.js";
import { requireAdmin, requireSchool } from "../middleware/authenticate.js";
import { validate } from "../middleware/validate.js";
import {
  createTeacherSchema,
  listTeachersQuerySchema,
  setClassTeacherSchema,
  setTeacherStatusSchema,
  teacherIdParamsSchema,
  updateTeacherSchema,
} from "../schemas/teacher.schema.js";

const validateTeacherId = validate(teacherIdParamsSchema, "params");
const schoolIdParams = z.object({ schoolId: z.uuid() });

/** Admin: manage teachers across schools. */
export const teacherRouter = Router();
teacherRouter.use(requireAdmin);
teacherRouter.get("/", validate(listTeachersQuerySchema, "query"), listTeachers);
teacherRouter.get(
  "/class-teacher-slots",
  validate(z.object({ schoolId: z.uuid() }), "query"),
  listAdminClassTeacherSlots,
);
teacherRouter.post(
  "/for-school/:schoolId",
  validate(schoolIdParams, "params"),
  validate(createTeacherSchema),
  createTeacherForSchool,
);
teacherRouter.get("/:id", validateTeacherId, getTeacher);
teacherRouter.patch("/:id", validateTeacherId, validate(updateTeacherSchema), updateTeacher);
teacherRouter.patch(
  "/:id/status",
  validateTeacherId,
  validate(setTeacherStatusSchema),
  setTeacherStatus,
);
teacherRouter.delete("/:id", validateTeacherId, deleteTeacher);

/** School portal: manage only this school's teachers + dashboard. */
export const schoolTeacherRouter = Router();
schoolTeacherRouter.use(requireSchool);
schoolTeacherRouter.get("/dashboard", getSchoolDashboard);
schoolTeacherRouter.get("/classes", listSchoolClasses);
schoolTeacherRouter.get("/class-teacher-slots", listSchoolClassTeacherSlots);
schoolTeacherRouter.put("/class-teacher", validate(setClassTeacherSchema), setSchoolClassTeacher);
schoolTeacherRouter.get("/", validate(listTeachersQuerySchema, "query"), listTeachers);
schoolTeacherRouter.post("/", validate(createTeacherSchema), createTeacher);
schoolTeacherRouter.get("/:id", validateTeacherId, getTeacher);
schoolTeacherRouter.patch("/:id", validateTeacherId, validate(updateTeacherSchema), updateTeacher);
schoolTeacherRouter.patch(
  "/:id/status",
  validateTeacherId,
  validate(setTeacherStatusSchema),
  setTeacherStatus,
);
schoolTeacherRouter.delete("/:id", validateTeacherId, deleteTeacher);
