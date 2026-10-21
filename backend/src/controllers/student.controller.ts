import type { RequestHandler } from "express";
import type {
  CreateStudentInput,
  ListStudentsQuery,
  UpdateStudentInput,
} from "../schemas/student.schema.js";
import type { SchoolAccountDto } from "../services/school.service.js";
import * as studentService from "../services/student.service.js";
import type { TeacherAccountDto } from "../services/teacher.service.js";
import { sendSuccess } from "../utils/api-response.js";
import { StudentStatus } from "../generated/prisma/enums.js";

export const listStudents: RequestHandler = async (req, res) => {
  const school = res.locals.school as SchoolAccountDto | undefined;
  sendSuccess(
    res,
    await studentService.listStudents(req.query as unknown as ListStudentsQuery, school?.id),
  );
};

export const listAdminSchoolStudents: RequestHandler = async (req, res) => {
  const schoolId = String(req.params.schoolId);
  sendSuccess(
    res,
    await studentService.listStudents(req.query as unknown as ListStudentsQuery, schoolId),
  );
};

export const listAdminStudents: RequestHandler = async (req, res) => {
  sendSuccess(
    res,
    await studentService.listStudents(req.query as unknown as ListStudentsQuery),
  );
};

export const getAdminSchoolStudentCounts: RequestHandler = async (req, res) => {
  sendSuccess(res, await studentService.getSchoolStudentCounts(String(req.params.schoolId)));
};

export const getSchoolStudentCounts: RequestHandler = async (_req, res) => {
  const school = res.locals.school as SchoolAccountDto;
  sendSuccess(res, await studentService.getSchoolStudentCounts(school.id));
};

export const listTeacherStudents: RequestHandler = async (req, res) => {
  const teacher = res.locals.teacher as TeacherAccountDto;
  sendSuccess(
    res,
    await studentService.listTeacherStudents(
      teacher,
      req.query as unknown as ListStudentsQuery,
    ),
  );
};

export const getStudent: RequestHandler<{ id: string }> = async (req, res) => {
  const school = res.locals.school as SchoolAccountDto | undefined;
  sendSuccess(res, await studentService.getStudent(req.params.id, school?.id));
};

export const getAdminSchoolStudent: RequestHandler<{ schoolId: string; id: string }> = async (
  req,
  res,
) => {
  sendSuccess(res, await studentService.getStudent(req.params.id, req.params.schoolId));
};

/** Admin: fetch any student by id (no school slug in the URL). */
export const getAdminStudent: RequestHandler<{ id: string }> = async (req, res) => {
  sendSuccess(res, await studentService.getStudent(req.params.id));
};

export const updateAdminStudent: RequestHandler<{ id: string }, unknown, UpdateStudentInput> = async (
  req,
  res,
) => {
  sendSuccess(res, await studentService.updateStudent(req.params.id, req.body));
};

export const deleteAdminStudent: RequestHandler<{ id: string }> = async (req, res) => {
  sendSuccess(res, await studentService.deleteStudent(req.params.id));
};

export const resetAdminStudentPassword: RequestHandler<
  { id: string },
  unknown,
  { password: string }
> = async (req, res) => {
  sendSuccess(res, await studentService.resetStudentPassword(req.params.id, req.body.password));
};

export const sendAdminStudentCredentials: RequestHandler<{ id: string }> = async (req, res) => {
  sendSuccess(res, await studentService.sendStudentCredentials(req.params.id));
};

export const createStudent: RequestHandler<unknown, unknown, CreateStudentInput> = async (
  req,
  res,
) => {
  const school = res.locals.school as SchoolAccountDto;
  sendSuccess(res, await studentService.createStudent(school.id, req.body), 201);
};

export const createAdminSchoolStudent: RequestHandler<
  { schoolId: string },
  unknown,
  CreateStudentInput
> = async (req, res) => {
  sendSuccess(res, await studentService.createStudent(req.params.schoolId, req.body), 201);
};

export const updateStudent: RequestHandler<{ id: string }, unknown, UpdateStudentInput> = async (
  req,
  res,
) => {
  const school = res.locals.school as SchoolAccountDto | undefined;
  sendSuccess(res, await studentService.updateStudent(req.params.id, req.body, school?.id));
};

export const updateAdminSchoolStudent: RequestHandler<
  { schoolId: string; id: string },
  unknown,
  UpdateStudentInput
> = async (req, res) => {
  sendSuccess(
    res,
    await studentService.updateStudent(req.params.id, req.body, req.params.schoolId),
  );
};

export const setStudentStatus: RequestHandler<
  { id: string },
  unknown,
  { status: StudentStatus }
> = async (req, res) => {
  const school = res.locals.school as SchoolAccountDto | undefined;
  sendSuccess(
    res,
    await studentService.setStudentStatus(req.params.id, req.body.status, school?.id),
  );
};

export const resetStudentPassword: RequestHandler<
  { id: string },
  unknown,
  { password: string }
> = async (req, res) => {
  const school = res.locals.school as SchoolAccountDto | undefined;
  sendSuccess(
    res,
    await studentService.resetStudentPassword(req.params.id, req.body.password, school?.id),
  );
};

export const sendStudentCredentials: RequestHandler<{ id: string }> = async (req, res) => {
  const school = res.locals.school as SchoolAccountDto | undefined;
  sendSuccess(res, await studentService.sendStudentCredentials(req.params.id, school?.id));
};

export const deleteStudent: RequestHandler<{ id: string }> = async (req, res) => {
  const school = res.locals.school as SchoolAccountDto | undefined;
  sendSuccess(res, await studentService.deleteStudent(req.params.id, school?.id));
};

export const deleteAdminSchoolStudent: RequestHandler<{ schoolId: string; id: string }> = async (
  req,
  res,
) => {
  sendSuccess(res, await studentService.deleteStudent(req.params.id, req.params.schoolId));
};
