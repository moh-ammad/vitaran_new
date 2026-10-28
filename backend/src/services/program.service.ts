import * as programRepository from "../repositories/program.repository.js";
import type { CreateProgramInput, UpdateProgramInput } from "../schemas/program.schema.js";
import { AppError } from "../utils/app-error.js";
import { prisma } from "../config/database.js";

function toDto(program: Awaited<ReturnType<typeof programRepository.findProgramById>>) {
  if (!program) return null;
  return {
    id: program.id,
    code: program.code,
    name: program.name,
    year: program.year,
    classFrom: program.classFrom,
    classTo: program.classTo,
    subjects: program.subjects,
    createdAt: program.createdAt.toISOString(),
    updatedAt: program.updatedAt.toISOString(),
  };
}

function slugify(name: string) {
  return name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 64);
}

export async function listPrograms() {
  return (await programRepository.findPrograms()).map((program) => toDto(program)!);
}

export async function getProgram(id: string) {
  const program = toDto(await programRepository.findProgramById(id));
  if (!program) throw new AppError(404, "Program not found");
  return program;
}

export async function createProgram(input: CreateProgramInput) {
  const code = input.code ?? slugify(input.name);
  if (!code) throw new AppError(400, "Program code is required", [{ path: ["code"], message: "Enter a code" }]);

  const existing = await programRepository.findProgramByCode(code);
  if (existing) {
    throw new AppError(409, "Program code already exists", [
      { path: ["code"], message: "This code is already used" },
    ]);
  }

  return toDto(
    await programRepository.createProgram({
      code,
      name: input.name,
      year: input.year,
      classFrom: input.classFrom,
      classTo: input.classTo,
      subjects: input.subjects,
    }),
  )!;
}

export async function updateProgram(id: string, input: UpdateProgramInput) {
  const current = await programRepository.findProgramById(id);
  if (!current) throw new AppError(404, "Program not found");

  if (input.code && input.code !== current.code) {
    const existing = await programRepository.findProgramByCode(input.code);
    if (existing) {
      throw new AppError(409, "Program code already exists", [
        { path: ["code"], message: "This code is already used" },
      ]);
    }
  }

  const classFrom = input.classFrom ?? current.classFrom;
  const classTo = input.classTo ?? current.classTo;
  if (classFrom > classTo) {
    throw new AppError(400, "Class from must be ≤ class to", [
      { path: ["classTo"], message: "Class from must be ≤ class to" },
    ]);
  }

  const updated = await programRepository.updateProgram(id, {
    name: input.name,
    year: input.year,
    classFrom: input.classFrom,
    classTo: input.classTo,
    subjects: input.subjects,
    code: input.code,
  });

  // Keep answer keys in sync when the stable code changes.
  if (input.code && input.code !== current.code) {
    await prisma.answerKey.updateMany({
      where: { programCode: current.code },
      data: { programCode: input.code },
    });
    await prisma.resultSet.updateMany({
      where: { programCode: current.code },
      data: { programCode: input.code, programKey: input.code },
    });
  }

  return toDto(updated)!;
}

export async function deleteProgram(id: string) {
  const current = await programRepository.findProgramById(id);
  if (!current) throw new AppError(404, "Program not found");

  await prisma.$transaction(async (tx) => {
    await tx.omResultRelease.deleteMany({ where: { programId: id } });
    await tx.teacherAssignment.deleteMany({ where: { programId: id } });
    await tx.classTeacher.deleteMany({ where: { programId: id } });
    await tx.student.deleteMany({ where: { programId: id } });
    await tx.schoolSection.deleteMany({ where: { programId: id } });
    await tx.schoolClass.deleteMany({ where: { programId: id } });
    await tx.schoolProgram.deleteMany({ where: { programId: id } });
    await tx.answerKey.deleteMany({ where: { programCode: current.code } });
    await tx.resultSet.deleteMany({ where: { programCode: current.code } });
    await tx.learningProgram.delete({ where: { id } });
  });
}
