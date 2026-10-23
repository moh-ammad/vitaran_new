import { Router } from "express";
import { streamSchoolEvents, streamStudentEvents, streamTeacherEvents } from "../controllers/live.controller.js";
import { requireSchool, requireStudent, requireTeacher } from "../middleware/authenticate.js";

/** Live updates for a signed-in school. */
export const schoolEventsRouter = Router();
schoolEventsRouter.use(requireSchool);
schoolEventsRouter.get("/", streamSchoolEvents);

/** Live updates for a signed-in teacher. */
export const teacherEventsRouter = Router();
teacherEventsRouter.use(requireTeacher);
teacherEventsRouter.get("/", streamTeacherEvents);

/** Live updates for a signed-in student. */
export const studentEventsRouter = Router();
studentEventsRouter.use(requireStudent);
studentEventsRouter.get("/", streamStudentEvents);
