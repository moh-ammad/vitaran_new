import type { Subject } from "@/types/school";

export const SUBJECT_COLORS: Record<Subject, string> = {
  MATHEMATICS: "#191c5f",
  PHYSICS: "#3b3f8f",
  CHEMISTRY: "#38bdf8",
  BIOLOGY: "#15803d",
  SCIENCE: "#a16207",
};

/** Paper order on the OMR sheet: Maths, Physics, Chemistry, Biology. */
export const MPCB: Subject[] = ["MATHEMATICS", "PHYSICS", "CHEMISTRY", "BIOLOGY"];

export const MIX_COLORS = {
  Correct: "#059669",
  Wrong: "#e11d48",
  Blank: "#a1a1aa",
  Invalid: "#d97706",
} as const;
