import { z } from "zod";
import { Subject, TeacherStatus } from "../generated/prisma/enums.js";

const email = z.email().trim().toLowerCase().max(254);

const phone = z
  .string()
  .transform((value) => value.replace(/[\s-]/g, ""))
  .pipe(z.string().regex(/^\+?\d{10,14}$/, "Invalid phone number"));

const password = z.string().min(1, "Password is required").max(128);

const assignmentSchema = z.object({
  programId: z.uuid(),
  classLevel: z.number().int().min(1).max(12),
  subject: z.enum(Subject),
});

const classTeacherSlotSchema = z.object({
  programId: z.uuid(),
  classLevel: z.number().int().min(1).max(12),
});

const teacherFields = {
  name: z.string().trim().min(2).max(120),
  email,
  phone,
  status: z.enum(TeacherStatus),
  assignments: z
    .array(assignmentSchema)
    .min(1, "Assign at least one class and subject")
    .transform((assignments) => {
      const seen = new Set<string>();
      return assignments.filter((item) => {
        const key = `${item.programId}:${item.classLevel}:${item.subject}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }),
  /** Classes this teacher should own as class teacher (at most one teacher per program+class). */
  classTeacherFor: z
    .array(classTeacherSlotSchema)
    .default([])
    .transform((slots) => {
      const seen = new Set<string>();
      return slots.filter((item) => {
        const key = `${item.programId}:${item.classLevel}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }),
};

export const createTeacherSchema = z.object({
  ...teacherFields,
  status: teacherFields.status.default(TeacherStatus.ACTIVE),
  password,
});

export const updateTeacherSchema = z
  .object({ ...teacherFields, password })
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
  });

export const setTeacherStatusSchema = z.object({
  status: z.enum(TeacherStatus),
});

export const teacherIdParamsSchema = z.object({
  id: z.uuid(),
});

export const listTeachersQuerySchema = z.object({
  schoolId: z.uuid().optional(),
  search: z.string().trim().max(100).optional(),
  status: z.enum(TeacherStatus).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(20),
});

export const setClassTeacherSchema = z.object({
  programId: z.uuid(),
  classLevel: z.number().int().min(1).max(12),
  /** Pass null/omit to clear; otherwise the sole class teacher for that class. */
  teacherId: z.uuid().nullable(),
});

export type CreateTeacherInput = z.infer<typeof createTeacherSchema>;
export type UpdateTeacherInput = z.infer<typeof updateTeacherSchema>;
export type ListTeachersQuery = z.infer<typeof listTeachersQuerySchema>;
export type SetTeacherStatusInput = z.infer<typeof setTeacherStatusSchema>;
export type SetClassTeacherInput = z.infer<typeof setClassTeacherSchema>;
