import { PDFParse } from "pdf-parse";
import sharp from "sharp";
import { Subject } from "../generated/prisma/enums.js";
import { readKeyGrid } from "./answer-key-grid.js";

export const ANSWER_OPTIONS = ["A", "B", "C", "D"] as const;
export type AnswerOption = (typeof ANSWER_OPTIONS)[number];

export type SubjectRange = {
  subject: Subject;
  from: number;
  to: number;
  maxMarks: number;
};

export type ParsedAnswerKey = {
  testId: string | null;
  answers: Record<string, AnswerOption>;
  explanations: Record<string, string>;
  subjectRanges: SubjectRange[];
};

const MARKS_PER_QUESTION = 4;
const BLOCK = 25;
const MPC = [Subject.MATHEMATICS, Subject.PHYSICS, Subject.CHEMISTRY] as const;
const MPCB = [...MPC, Subject.BIOLOGY] as const;

const HEADING: Record<string, Subject> = {
  mathematics: Subject.MATHEMATICS,
  maths: Subject.MATHEMATICS,
  math: Subject.MATHEMATICS,
  physics: Subject.PHYSICS,
  chemistry: Subject.CHEMISTRY,
  biology: Subject.BIOLOGY,
  science: Subject.SCIENCE,
};

const isOption = (value: string): value is AnswerOption =>
  ANSWER_OPTIONS.includes(value as AnswerOption);

async function screenshotPage(parser: PDFParse, page: number, scale: number) {
  const shots = await parser.getScreenshot({
    partial: [page],
    scale,
    imageDataUrl: false,
  });
  const shot = shots.pages[0];
  if (!shot) throw new Error(`PDF page ${page} is empty`);
  return Buffer.from(shot.data);
}

async function cropBand(png: Buffer, top: number, height: number) {
  const meta = await sharp(png).metadata();
  const width = meta.width ?? 0;
  const pageHeight = meta.height ?? 0;
  const topPx = Math.round(pageHeight * top);
  const heightPx = Math.round(pageHeight * height);
  return sharp(png)
    .extract({
      left: Math.round(width * 0.04),
      top: topPx,
      width: Math.round(width * 0.92),
      height: Math.min(heightPx, pageHeight - topPx),
    })
    .png()
    .toBuffer();
}

function collectAnswers(text: string) {
  const answers: Record<string, AnswerOption> = {};
  for (const match of text.matchAll(/(\d{1,3})\s*[).:\-]\s*([A-D])(?:[A-D])?\b/g)) {
    const question = Number(match[1]);
    const option = match[2];
    if (question >= 1 && question <= 200 && option && isOption(option)) {
      answers[String(question)] = option;
    }
  }
  return answers;
}

function collectHeadings(text: string) {
  const found: Subject[] = [];
  for (const match of text.matchAll(
    /(?:^|\n)\s*(mathematics|maths|math|physics|chemistry|biology|science)\s*(?:\n|$)/gi,
  )) {
    const subject = HEADING[match[1]!.toLowerCase()];
    if (subject && !found.includes(subject)) found.push(subject);
  }
  return found;
}

function lastQuestion(answers: Record<string, AnswerOption>, extras: number[]) {
  const nums = [...Object.keys(answers).map(Number), ...extras];
  const max = nums.length ? Math.max(...nums) : 0;
  if (max > BLOCK * 3) return BLOCK * 4;
  if (max > BLOCK * 2) return BLOCK * 3;
  return max;
}

function rangesFor(subjects: readonly Subject[], last: number): SubjectRange[] {
  return subjects
    .map((subject, index) => {
      const from = index * BLOCK + 1;
      const to = Math.min((index + 1) * BLOCK, last);
      const count = Math.max(0, to - from + 1);
      return { subject, from, to, maxMarks: count * MARKS_PER_QUESTION };
    })
    .filter((range) => range.to >= range.from && last >= range.from);
}

/** Friend’s rule: paper order is always M-P-C, plus Biology when there are 100 questions. */
function subjectOrder(headings: Subject[], last: number) {
  const canonical = last > BLOCK * 3 ? MPCB : MPC;
  const fromHeadings = canonical.filter((subject) => headings.includes(subject));
  if (fromHeadings.length >= 3) return fromHeadings;
  if (headings.includes(Subject.SCIENCE) && headings.length >= 2) {
    return [Subject.MATHEMATICS, Subject.SCIENCE].filter((subject) => headings.includes(subject));
  }
  return [...canonical];
}

function explanationChunks(text: string) {
  const start = text.search(/EXPLANATIONS?/i);
  const body = start >= 0 ? text.slice(start) : text;
  const chunks = new Map<number, string>();
  const matches = [...body.matchAll(/(?:^|\n)\s*(\d{1,3})\s*[.)]\s+/g)];
  for (let index = 0; index < matches.length; index++) {
    const match = matches[index]!;
    const question = Number(match[1]);
    if (question < 1 || question > 200) continue;
    const from = (match.index ?? 0) + match[0].length;
    const to = matches[index + 1]?.index ?? body.length;
    chunks.set(question, body.slice(from, to).trim());
  }
  return chunks;
}

function parseChunk(chunk: string): { answer: AnswerOption | null; explanation: string } {
  const answerMatch =
    chunk.match(/Answer\s*:?\s*([A-D])\s*[\]).:]/i) ??
    chunk.match(/^\s*([A-D])\s*[\]).:]/) ??
    chunk.match(/\bmatches\s+([A-D])\b/i);
  const answer = answerMatch?.[1] && isOption(answerMatch[1]) ? answerMatch[1] : null;
  const explMatch = chunk.match(/Explanation\s*:\s*([\s\S]+)/i);
  let explanation = (explMatch?.[1] ?? chunk.replace(/^[\s\S]*?Answer\s*:?[^\n]*\n?/i, "")).trim();
  explanation = explanation
    .replace(/(?:^|\n)\s*(mathematics|maths|physics|chemistry|biology|science)\s*$/i, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, 2000);
  return { answer, explanation };
}

export function parseAnswerKeyText(text: string): ParsedAnswerKey {
  const testId = text.match(/Test\s*I[D1]\s*:?\s*([A-Z0-9-]{2,20})/i)?.[1] ?? null;
  const fromKey = collectAnswers(text);
  const headings = collectHeadings(text);
  const explanations: Record<string, string> = {};
  const fromExpl: Record<string, AnswerOption> = {};

  for (const [question, chunk] of explanationChunks(text)) {
    const parsed = parseChunk(chunk);
    if (parsed.answer) fromExpl[String(question)] = parsed.answer;
    if (parsed.explanation) explanations[String(question)] = parsed.explanation;
  }

  const answers = { ...fromExpl, ...fromKey };
  const last = lastQuestion(answers, [...explanationChunks(text).keys()]);
  const subjects = subjectOrder(headings, last || Object.keys(answers).length);
  const subjectRanges = rangesFor(subjects, last || subjects.length * BLOCK);

  return { testId, answers, explanations, subjectRanges };
}

/**
 * Answers live in the KEY grid on page 1 (10×10). Skip explanation pages —
 * reparse stays fast and options come from the printed key, not OCR guesses.
 */
export async function parseAnswerKeyPdf(pdf: Buffer): Promise<ParsedAnswerKey> {
  const parser = new PDFParse({ data: pdf });
  try {
    const page = await screenshotPage(parser, 1, 2);
    const answers = await readKeyGrid(await cropBand(page, 0.26, 0.36));
    const last = lastQuestion(answers, []);
    const subjects = subjectOrder([], last || Object.keys(answers).length);
    const subjectRanges = rangesFor(subjects, last || subjects.length * BLOCK);
    return { testId: null, answers, explanations: {}, subjectRanges };
  } finally {
    await parser.destroy();
  }
}

export function asAnswers(value: unknown): Record<string, AnswerOption> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const answers: Record<string, AnswerOption> = {};
  for (const [question, option] of Object.entries(value as Record<string, unknown>)) {
    if (/^\d+$/.test(question) && typeof option === "string" && isOption(option)) {
      answers[question] = option;
    }
  }
  return answers;
}

export function asExplanations(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const explanations: Record<string, string> = {};
  for (const [question, text] of Object.entries(value as Record<string, unknown>)) {
    if (/^\d+$/.test(question) && typeof text === "string" && text.trim()) {
      explanations[question] = text;
    }
  }
  return explanations;
}

export function asSubjectRanges(value: unknown): SubjectRange[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((row) => {
    if (!row || typeof row !== "object") return [];
    const { subject, from, to, maxMarks } = row as Record<string, unknown>;
    if (typeof subject !== "string" || !(subject in Subject)) return [];
    if (typeof from !== "number" || typeof to !== "number") return [];
    return [
      {
        subject: subject as Subject,
        from,
        to,
        maxMarks: typeof maxMarks === "number" ? maxMarks : Math.max(0, to - from + 1) * MARKS_PER_QUESTION,
      },
    ];
  });
}

export function defaultSubjectRanges(lastQuestion: number): SubjectRange[] {
  return rangesFor(lastQuestion > BLOCK * 3 ? MPCB : MPC, lastQuestion);
}

export type AnswerCorrection = {
  question: number;
  from: AnswerOption | null;
  to: AnswerOption | null;
  explanation: string;
};

/** Questions where admin changed the printed KEY option. Explanation rides along. */
export function diffCorrections(
  printedAnswers: Record<string, AnswerOption>,
  answers: Record<string, AnswerOption>,
  _printedExplanations: Record<string, string>,
  explanations: Record<string, string>,
): AnswerCorrection[] {
  const questions = new Set([...Object.keys(printedAnswers), ...Object.keys(answers)]);
  return [...questions]
    .map(Number)
    .filter((question) => question > 0)
    .sort((a, b) => a - b)
    .flatMap((question) => {
      const key = String(question);
      const from = printedAnswers[key] ?? null;
      const to = answers[key] ?? from;
      if (!to || to === from) return [];
      return [{ question, from, to, explanation: (explanations[key] ?? "").trim() }];
    });
}
