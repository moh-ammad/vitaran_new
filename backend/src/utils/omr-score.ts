import type { Subject } from "../generated/prisma/enums.js";
import { asAnswers, asSubjectRanges, type AnswerOption, type SubjectRange } from "./answer-key-parse.js";

export type SubjectScore = {
  subject: Subject;
  from: number;
  to: number;
  correct: number;
  wrong: number;
  blank: number;
  total: number;
  maxTotal: number;
};

export type OmScore = {
  answers: Record<string, AnswerOption>;
  subjectScores: SubjectScore[];
  correct: number;
  wrong: number;
  blank: number;
  total: number;
  maxTotal: number;
};

const MARKS = 4;

export function scoreOmrAnswers(
  marked: Record<string, AnswerOption>,
  keyAnswers: unknown,
  rangesInput: unknown,
): OmScore {
  const key = asAnswers(keyAnswers);
  const questions = Object.keys(key)
    .map(Number)
    .filter((n) => n > 0)
    .sort((a, b) => a - b);
  const last = questions[questions.length - 1] ?? 0;
  const ranges: SubjectRange[] =
    asSubjectRanges(rangesInput).length > 0
      ? asSubjectRanges(rangesInput)
      : last > 0
        ? [{ subject: "MATHEMATICS" as Subject, from: 1, to: last, maxMarks: last * MARKS }]
        : [];

  const subjectScores: SubjectScore[] = ranges.map((range) => ({
    subject: range.subject,
    from: range.from,
    to: range.to,
    correct: 0,
    wrong: 0,
    blank: 0,
    total: 0,
    maxTotal: range.maxMarks || (range.to - range.from + 1) * MARKS,
  }));

  let correct = 0;
  let wrong = 0;
  let blank = 0;

  for (const question of questions) {
    const expected = key[String(question)];
    const got = marked[String(question)];
    const band = subjectScores.find((row) => question >= row.from && question <= row.to);
    if (!got) {
      blank += 1;
      if (band) band.blank += 1;
      continue;
    }
    if (got === expected) {
      correct += 1;
      if (band) {
        band.correct += 1;
        band.total += MARKS;
      }
    } else {
      wrong += 1;
      if (band) band.wrong += 1;
    }
  }

  return {
    answers: marked,
    subjectScores,
    correct,
    wrong,
    blank,
    total: correct * MARKS,
    maxTotal: questions.length * MARKS,
  };
}
