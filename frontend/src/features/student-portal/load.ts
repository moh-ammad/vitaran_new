import "server-only";
import { listStudentOmScans } from "@/services/om-scans";
import { listStudentResultRows } from "@/services/results";
import { percentOf, type StudentTest } from "./types";

/**
 * Uploaded result sheets plus OMR scans the class teacher has published. When both exist for a
 * test, the OMR scan wins because it carries per-question detail.
 */
export async function loadStudentTests(): Promise<StudentTest[]> {
  const [scans, sheets] = await Promise.all([listStudentOmScans(), listStudentResultRows()]);
  const byTest = new Map<string, StudentTest>();
  for (const row of sheets) {
    byTest.set(row.testId, {
      key: row.resultSetId,
      testId: row.testId,
      testNumber: row.testNumber,
      date: row.updatedAt.slice(0, 10),
      source: "sheet",
      programName: row.programName,
      classLevel: row.classLevel,
      sectionName: row.sectionName,
      subjects: row.subjects,
      total: row.total,
      maxTotal: row.maxTotal,
      percentage: row.percentage,
      counts: null,
      rank: null,
      classSize: null,
    });
  }
  for (const scan of scans) {
    byTest.set(scan.testId, {
      key: scan.id,
      testId: scan.testId,
      testNumber: scan.testNumber,
      date: scan.examDate ?? scan.createdAt.slice(0, 10),
      source: "omr",
      programName: scan.student.programName,
      classLevel: scan.student.classLevel,
      sectionName: scan.student.sectionName,
      subjects: scan.subjectScores.map((row) => ({
        subject: row.subject,
        score: row.total,
        max: row.maxTotal,
        correct: row.correct,
        wrong: row.wrong,
        blank: row.blank,
      })),
      total: scan.total,
      maxTotal: scan.maxTotal,
      percentage: percentOf(scan.total, scan.maxTotal),
      counts: {
        correct: scan.correct,
        wrong: scan.wrong,
        blank: Math.max(0, scan.blank - scan.flags.length),
        invalid: scan.flags.length,
      },
      rank: scan.rank,
      classSize: scan.classSize,
    });
  }
  return [...byTest.values()];
}
