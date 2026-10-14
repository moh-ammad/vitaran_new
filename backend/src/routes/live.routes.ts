import { Router } from "express";
import { streamSchoolEvents } from "../controllers/live.controller.js";
import { requireSchool } from "../middleware/authenticate.js";

/** Live updates for a signed-in school. */
export const schoolEventsRouter = Router();

schoolEventsRouter.use(requireSchool);

schoolEventsRouter.get("/", streamSchoolEvents);
