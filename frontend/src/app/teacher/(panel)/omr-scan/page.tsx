import { PageHeader } from "@/features/admin/page-header";
import { programLabel } from "@/features/schools/constants";
import { verifyTeacherSession } from "@/features/teacher-auth/session";
import { OmrScanForm, type OmrTestOption } from "@/features/teacher-portal/omr-scan-form";
import { listTeacherAnswerKeys } from "@/services/answer-keys";
import { listTeacherResultSets } from "@/services/results";

function buildTestOptions(
  answerKeys: Awaited<ReturnType<typeof listTeacherAnswerKeys>>,
  resultSets: Awaited<ReturnType<typeof listTeacherResultSets>>,
  assignedClasses: Set<string>,
): OmrTestOption[] {
  const map = new Map<string, OmrTestOption>();

  for (const key of answerKeys) {
    const slot = `${key.program}:${key.classLevel}`;
    if (assignedClasses.size > 0 && !assignedClasses.has(slot)) continue;
    const id = `${key.program}:${key.testNumber}`;
    const existing = map.get(id);
    if (existing) {
      if (!existing.classLevels.includes(key.classLevel)) {
        existing.classLevels.push(key.classLevel);
        existing.classLevels.sort((a, b) => a - b);
      }
      continue;
    }
    map.set(id, {
      testNumber: key.testNumber,
      programCode: key.program,
      programName: programLabel(key.program),
      classLevels: [key.classLevel],
    });
  }

  for (const set of resultSets) {
    const programCode = set.program ?? "CUSTOM";
    const programName = programLabel(programCode, set.programName);
    const id = `${programCode}:${set.testNumber}`;
    const classLevels = set.classes
      .map((row) => row.classLevel)
      .filter((level) => assignedClasses.size === 0 || assignedClasses.has(`${programCode}:${level}`));
    if (classLevels.length === 0) continue;

    const existing = map.get(id);
    if (existing) {
      for (const level of classLevels) {
        if (!existing.classLevels.includes(level)) existing.classLevels.push(level);
      }
      existing.classLevels.sort((a, b) => a - b);
      existing.programName = programName;
      continue;
    }

    map.set(id, {
      testNumber: set.testNumber,
      programCode,
      programName,
      classLevels: [...classLevels].sort((a, b) => a - b),
    });
  }

  return [...map.values()].sort((a, b) => b.testNumber - a.testNumber);
}

export default async function TeacherOmrScanPage() {
  const [teacher, answerKeys, resultSets] = await Promise.all([
    verifyTeacherSession(),
    listTeacherAnswerKeys(),
    listTeacherResultSets(),
  ]);

  const assignedClasses = new Set(
    teacher.assignments.map((row) => `${row.programCode}:${row.classLevel}`),
  );

  // Prefer assignment-filtered options; if keys use program enum codes matching assignments, filter applies.
  const tests = buildTestOptions(answerKeys, resultSets, assignedClasses);

  return (
    <>
      <PageHeader
        title="OMR Scan"
        description="Upload or capture OMR sheets for your tests and classes."
      />
      <OmrScanForm tests={tests} teacherName={teacher.name} />
    </>
  );
}
