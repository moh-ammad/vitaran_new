import type { RequestHandler, Response } from "express";
import type { AnalysisQuery, RankingFileQuery, RankingQuery } from "../schemas/analysis.schema.js";
import * as analysisService from "../services/analysis.service.js";
import type { AnalysisActor } from "../services/analysis.service.js";
import { buildRankingFile } from "../services/ranking-export.js";
import type { SchoolAccountDto } from "../services/school.service.js";
import type { StudentAccountDto } from "../services/student.service.js";
import type { TeacherAccountDto } from "../services/teacher.service.js";
import { sendSuccess } from "../utils/api-response.js";

const signedInSchool = (res: Response): AnalysisActor => {
  const school = res.locals.school as SchoolAccountDto;
  return {
    kind: "school",
    schoolId: school.id,
    schoolName: school.name,
    schoolCode: school.code,
    programs: school.schoolPrograms,
  };
};

const signedInTeacher = (res: Response): AnalysisActor => ({
  kind: "teacher",
  teacher: res.locals.teacher as TeacherAccountDto,
});

const signedInStudent = (res: Response): AnalysisActor => ({
  kind: "student",
  student: res.locals.student as StudentAccountDto,
});

function sendRankingFile(res: Response, file: { fileName: string; mime: string; data: Uint8Array }) {
  res
    .type(file.mime)
    .set("Content-Disposition", `attachment; filename*=UTF-8''${encodeURIComponent(file.fileName)}`)
    .send(Buffer.from(file.data));
}

async function rankingFile(query: RankingFileQuery, actor?: AnalysisActor) {
  return buildRankingFile(await analysisService.getRanking(query, actor), query.format);
}

export const getAdminAnalysis: RequestHandler = async (req, res) => {
  sendSuccess(res, await analysisService.getAnalysis(req.query as AnalysisQuery));
};

export const getSchoolAnalysis: RequestHandler = async (req, res) => {
  sendSuccess(res, await analysisService.getAnalysis(req.query as AnalysisQuery, signedInSchool(res)));
};

export const getTeacherAnalysis: RequestHandler = async (req, res) => {
  sendSuccess(res, await analysisService.getAnalysis(req.query as AnalysisQuery, signedInTeacher(res)));
};

export const getAdminRanking: RequestHandler = async (req, res) => {
  sendSuccess(res, await analysisService.getRanking(req.query as RankingQuery));
};

export const getSchoolRanking: RequestHandler = async (req, res) => {
  sendSuccess(res, await analysisService.getRanking(req.query as RankingQuery, signedInSchool(res)));
};

export const getTeacherRanking: RequestHandler = async (req, res) => {
  sendSuccess(res, await analysisService.getRanking(req.query as RankingQuery, signedInTeacher(res)));
};

export const getStudentRanking: RequestHandler = async (req, res) => {
  sendSuccess(res, await analysisService.getRanking(req.query as RankingQuery, signedInStudent(res)));
};

export const getAdminRankingFile: RequestHandler = async (req, res) => {
  sendRankingFile(res, await rankingFile(req.query as unknown as RankingFileQuery));
};

export const getSchoolRankingFile: RequestHandler = async (req, res) => {
  sendRankingFile(res, await rankingFile(req.query as unknown as RankingFileQuery, signedInSchool(res)));
};

export const getTeacherRankingFile: RequestHandler = async (req, res) => {
  sendRankingFile(res, await rankingFile(req.query as unknown as RankingFileQuery, signedInTeacher(res)));
};
