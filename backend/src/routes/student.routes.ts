import { Router } from "express";
import { z } from "zod";
import { getTeacherDashboard } from "../controllers/portal.controller.js";
import {
  createAdminSchoolStudent,
  createStudent,
  deleteAdminSchoolStudent,
  deleteAdminStudent,
  deleteStudent,
  getAdminSchoolStudent,
  getAdminStudent,
  getStudent,
  getAdminSchoolStudentCounts,
  getSchoolStudentCounts,
  listAdminSchoolStudents,
  listAdminStudents,
  listStudents,
  listTeacherStudents,
  resetAdminStudentPassword,
  resetStudentPassword,
  sendAdminStudentCredentials,
  sendStudentCredentials,
  setStudentStatus,
  updateAdminSchoolStudent,
  updateAdminStudent,
  updateStudent,
} from "../controllers/student.controller.js";
import { requireAdmin, requireSchool, requireTeacher } from "../middleware/authenticate.js";
import { validate } from "../middleware/validate.js";
import {
  createStudentSchema,
  listStudentsQuerySchema,
  resetStudentPasswordSchema,
  setStudentStatusSchema,
  studentIdParamsSchema,
  updateStudentSchema,
} from "../schemas/student.schema.js";

const validateStudentId = validate(studentIdParamsSchema, "params");
const schoolIdParams = z.object({ schoolId: z.uuid() });
const schoolStudentParams = z.object({ schoolId: z.uuid(), id: z.uuid() });

/** School portal: manage this school's students. */
export const schoolStudentRouter = Router();
schoolStudentRouter.use(requireSchool);
schoolStudentRouter.get("/counts", getSchoolStudentCounts);
schoolStudentRouter.get("/", validate(listStudentsQuerySchema, "query"), listStudents);
schoolStudentRouter.post("/", validate(createStudentSchema), createStudent);
schoolStudentRouter.get("/:id", validateStudentId, getStudent);
schoolStudentRouter.patch("/:id", validateStudentId, validate(updateStudentSchema), updateStudent);
schoolStudentRouter.patch(
  "/:id/status",
  validateStudentId,
  validate(setStudentStatusSchema),
  setStudentStatus,
);
schoolStudentRouter.post("/:id/send-credentials", validateStudentId, sendStudentCredentials);
schoolStudentRouter.post(
  "/:id/reset-password",
  validateStudentId,
  validate(resetStudentPasswordSchema),
  resetStudentPassword,
);
schoolStudentRouter.delete("/:id", validateStudentId, deleteStudent);

/** Admin: students under a school. */
export const adminSchoolStudentRouter = Router({ mergeParams: true });
adminSchoolStudentRouter.use(requireAdmin);
adminSchoolStudentRouter.get(
  "/counts",
  validate(schoolIdParams, "params"),
  getAdminSchoolStudentCounts,
);
adminSchoolStudentRouter.get(
  "/",
  validate(schoolIdParams, "params"),
  validate(listStudentsQuerySchema, "query"),
  listAdminSchoolStudents,
);
adminSchoolStudentRouter.post(
  "/",
  validate(schoolIdParams, "params"),
  validate(createStudentSchema),
  createAdminSchoolStudent,
);
adminSchoolStudentRouter.get(
  "/:id",
  validate(schoolStudentParams, "params"),
  getAdminSchoolStudent,
);
adminSchoolStudentRouter.patch(
  "/:id",
  validate(schoolStudentParams, "params"),
  validate(updateStudentSchema),
  updateAdminSchoolStudent,
);
adminSchoolStudentRouter.delete(
  "/:id",
  validate(schoolStudentParams, "params"),
  deleteAdminSchoolStudent,
);

/** Admin: flat student routes (short URLs — no school id in path). */
export const adminStudentRouter = Router();
adminStudentRouter.use(requireAdmin);
adminStudentRouter.get("/", validate(listStudentsQuerySchema, "query"), listAdminStudents);
adminStudentRouter.get("/:id", validateStudentId, getAdminStudent);
adminStudentRouter.patch("/:id", validateStudentId, validate(updateStudentSchema), updateAdminStudent);
adminStudentRouter.delete("/:id", validateStudentId, deleteAdminStudent);
adminStudentRouter.post("/:id/send-credentials", validateStudentId, sendAdminStudentCredentials);
adminStudentRouter.post(
  "/:id/reset-password",
  validateStudentId,
  validate(resetStudentPasswordSchema),
  resetAdminStudentPassword,
);

/** Teacher portal: roster for assigned / class-teacher classes. */
export const teacherStudentRouter = Router();
teacherStudentRouter.use(requireTeacher);
teacherStudentRouter.get("/dashboard", getTeacherDashboard);
teacherStudentRouter.get("/", validate(listStudentsQuerySchema, "query"), listTeacherStudents);
