/** How many Test No options to show for a catalog program code. */
export function testNumberCountForProgram(programCode: string | undefined): number {
  if (!programCode) return 12;
  const code = programCode.toUpperCase();
  // Olympiad tracks use 24 tests; Integrated and everything else use 12.
  if (code === "OLYMPIAD" || code === "OLYMPIAD_PRIMARY" || code.includes("OLYMPIAD")) {
    return 24;
  }
  return 12;
}

export function testNumberItemsForProgram(programCode: string | undefined) {
  const count = testNumberCountForProgram(programCode);
  return Array.from({ length: count }, (_, index) => {
    const value = String(index + 1);
    return { value, label: `Test ${value}` };
  });
}

export function classItemsFromLevels(levels: number[]) {
  return [...new Set(levels)]
    .sort((a, b) => a - b)
    .map((level) => ({ value: String(level), label: `Class ${level}` }));
}

/** Regular keys: full catalog range for the program. */
export function classLevelsFromProgram(program: {
  classFrom: number;
  classTo: number;
} | null): number[] {
  if (!program) return [];
  const from = Math.min(program.classFrom, program.classTo);
  const to = Math.max(program.classFrom, program.classTo);
  return Array.from({ length: to - from + 1 }, (_, index) => from + index);
}
