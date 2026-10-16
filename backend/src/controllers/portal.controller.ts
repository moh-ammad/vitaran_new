import type { RequestHandler } from "express";
import * as answerKeyService from "../services/answer-key.service.js";
import type { ContentActor } from "../services/content-access.js";
import * as resultService from "../services/result.service.js";
import type { SchoolAccountDto } from "../services/school.service.js";
import * as teacherService from "../services/teacher.service.js";
import { sendSuccess } from "../utils/api-response.js";

export const getSchoolDashboard: RequestHandler = async (_req, res) => {
  const school = res.locals.school as SchoolAccountDto;
  const actor: ContentActor = { kind: "school", school };
  const [teachers, answerKeys, results] = await Promise.all([
    teacherService.getSchoolTeacherStats(school.id),
    answerKeyService.countVisibleAnswerKeys(actor),
    resultService.countVisibleResultSets(actor),
  ]);

  sendSuccess(res, {
    teachers,
    answerKeys,
    results,
    programs: school.schoolPrograms.length,
    subjects: new Set(
      school.schoolPrograms.flatMap((row) => row.classes.flatMap((cls) => cls.subjects)),
    ).size,
  });
};
