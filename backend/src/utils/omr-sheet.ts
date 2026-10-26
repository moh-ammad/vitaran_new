import sharp from "sharp";
import { createWorker, PSM, type Worker } from "tesseract.js";
import {
  applyHomography,
  asRgba,
  CANONICAL_HEIGHT,
  CANONICAL_WIDTH,
  destToSrcHomography,
  findPaperQuad,
  findRegistrationQuad,
  grayFromRgba,
  quadQuality,
  sharpness,
  warpQuad,
  type Quad,
  type Rgba,
} from "./omr-geometry.js";
import { layoutOmrBubbles, type OmBubble, type OmFlag, type OmLayout } from "./omr-layout.js";

export type { OmBubble, OmFlag } from "./omr-layout.js";

export type OmRead = {
  ok: boolean;
  reason: string;
  rollNo: string;
  rollCandidates: string[];
  name: string;
  schoolName: string;
  examDate: string;
  testId: string;
  testCandidates: string[];
  answers: Record<string, string>;
  flags: OmFlag[];
  markCount: number;
  bubbles: OmBubble[];
  bubbleRadius: number;
  warpedPng: Buffer | null;
};

let ocrWorker: Promise<Worker> | null = null;

async function worker() {
  if (!ocrWorker) {
    ocrWorker = createWorker("eng").then(async (w) => {
      await w.setParameters({ tessedit_pageseg_mode: PSM.SINGLE_LINE });
      return w;
    });
  }
  return ocrWorker;
}

let ocrQueue: Promise<unknown> = Promise.resolve();

/** One shared worker: parameters and recognise must run as a pair, so calls are queued. */
function ocrImage(
  png: Buffer,
  whitelist: string,
  psm: typeof PSM.SINGLE_CHAR | typeof PSM.SINGLE_LINE | typeof PSM.SINGLE_WORD,
  keep = /[^A-Z0-9]/g,
) {
  const run = ocrQueue.then(async () => {
    const w = await worker();
    await w.setParameters({
      tessedit_char_whitelist: whitelist,
      tessedit_pageseg_mode: psm,
      user_defined_dpi: "300",
    });
    const text = (await w.recognize(png)).data.text.toUpperCase();
    return text.replace(keep, "");
  });
  ocrQueue = run.catch(() => undefined);
  return run;
}

type Box = { left: number; top: number; width: number; height: number };

/**
 * Printed boxes and dotted lines stay; handwriting is darker. Drop the rules, keep the pen,
 * then enlarge so tesseract sees a line of letters instead of a 20-pixel scribble.
 */
async function inkField(png: Buffer, box: Box, height = 144) {
  const { data, info } = await sharp(png).extract(box).greyscale().normalize().raw().toBuffer({ resolveWithObject: true });
  const W = info.width;
  const H = info.height;
  const sorted = [...data].sort((a, b) => a - b);
  const paper = sorted[Math.floor(sorted.length * 0.85)] ?? 255;
  const pen = sorted[Math.floor(sorted.length * 0.08)] ?? 0;
  if (paper - pen < 28) {
    return sharp(png).extract(box).greyscale().normalize().resize({ height, kernel: "lanczos3" }).png().toBuffer();
  }
  const thr = pen + (paper - pen) * 0.42;
  const ink = Buffer.alloc(W * H, 255);
  for (let i = 0; i < W * H; i++) if (data[i]! < thr) ink[i] = 0;

  for (let y = 0; y < H; y++) {
    let n = 0;
    for (let x = 0; x < W; x++) if (ink[y * W + x] === 0) n += 1;
    if (n > W * 0.4) ink.fill(255, y * W, y * W + W);
  }
  for (let x = 0; x < W; x++) {
    let n = 0;
    for (let y = 0; y < H; y++) if (ink[y * W + x] === 0) n += 1;
    if (n > H * 0.72) for (let y = 0; y < H; y++) ink[y * W + x] = 255;
  }

  let x0 = W;
  let y0 = H;
  let x1 = 0;
  let y1 = 0;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (ink[y * W + x] !== 0) continue;
      x0 = Math.min(x0, x);
      x1 = Math.max(x1, x);
      y0 = Math.min(y0, y);
      y1 = Math.max(y1, y);
    }
  }
  const pad = Math.max(4, Math.round(((y1 - y0 + 1) || H) * 0.28));
  const left = x1 > x0 ? Math.max(0, x0 - pad) : 0;
  const top = y1 > y0 ? Math.max(0, y0 - pad) : 0;
  const width = x1 > x0 ? Math.min(W - left, x1 - x0 + 1 + pad * 2) : W;
  const cropH = y1 > y0 ? Math.min(H - top, y1 - y0 + 1 + pad * 2) : H;
  return sharp(ink, { raw: { width: W, height: H, channels: 1 } })
    .extract({ left, top, width, height: cropH })
    .resize({ height, kernel: "lanczos3" })
    .withMetadata({ density: 300 })
    .png()
    .toBuffer();
}

function fixGlyph(char: string) {
  if (char === "O" || char === "Q") return "0";
  if (char === "I") return "1";
  return char;
}

function cleanToken(text: string) {
  return [...text].map(fixGlyph).join("");
}

function clampBox(width: number, height: number, box: { left: number; top: number; width: number; height: number }) {
  const left = Math.max(0, Math.min(width - 8, box.left));
  const top = Math.max(0, Math.min(height - 8, box.top));
  return {
    left,
    top,
    width: Math.max(8, Math.min(width - left, box.width)),
    height: Math.max(8, Math.min(height - top, box.height)),
  };
}

function insetBox(box: { left: number; top: number; width: number; height: number }, pad: number) {
  const dx = Math.max(1, Math.round(box.width * pad));
  const dy = Math.max(1, Math.round(box.height * pad));
  return {
    left: box.left + dx,
    top: box.top + dy,
    width: Math.max(4, box.width - dx * 2),
    height: Math.max(4, box.height - dy * 2),
  };
}

function uniqueTokens(values: string[]) {
  return [...new Set(values.map(cleanToken).filter((text) => text.length >= 4))].sort((a, b) => b.length - a.length);
}

const ROLL_CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

async function dumpCrop(name: string, png: Buffer) {
  if (!process.env.OMR_DEBUG_CROPS) return;
  const { writeFile } = await import("node:fs/promises");
  await writeFile(`${process.env.OMR_DEBUG_CROPS}/id-${name}.png`, png);
}

async function readRollStrip(png: Buffer, width: number, height: number, strip: Box) {
  const line = await inkField(png, strip, 120);
  await dumpCrop("roll", line);
  const cellW = strip.width / 7;
  const cells = await Promise.all(
    Array.from({ length: 7 }, (_, i) =>
      inkField(
        png,
        insetBox(
          clampBox(width, height, {
            left: Math.round(strip.left + i * cellW),
            top: strip.top,
            width: Math.round(cellW),
            height: strip.height,
          }),
          0.08,
        ),
        96,
      ),
    ),
  );
  const [lineText, ...cellTexts] = await Promise.all([
    ocrImage(line, ROLL_CHARS, PSM.SINGLE_LINE),
    ...cells.map((crop) => ocrImage(crop, ROLL_CHARS, PSM.SINGLE_CHAR)),
  ]);
  const joined = cellTexts.map((text) => fixGlyph((text.match(/[A-Z0-9]/) ?? [""])[0]!)).join("");
  return uniqueTokens([lineText, joined, cellTexts.join("")]);
}

/**
 * The header is printed at fixed offsets from the answer grid, so fields are located in grid units:
 * `a` across (0 = Q1 A centre, 1 = Q81 D centre) and `b` in answer rows (negative = above Q1).
 */
type GridFrame = { ox: number; oy: number; ux: number; uy: number; vx: number; vy: number };

function gridFrame(bubbles: OmBubble[]): GridFrame | null {
  const at = (q: number, option: string) => bubbles.find((b) => b.question === q && b.option === option);
  const o = at(1, "A");
  const r = at(81, "D");
  const down = at(5, "A");
  if (!o || !r || !down) return null;
  return { ox: o.x, oy: o.y, ux: r.x - o.x, uy: r.y - o.y, vx: (down.x - o.x) / 4, vy: (down.y - o.y) / 4 };
}

type PhotoFields = {
  png: Buffer;
  width: number;
  height: number;
  frame: GridFrame;
  quad: Quad;
};

function gridDest(frame: GridFrame, a: number, b: number) {
  return { x: frame.ox + a * frame.ux + b * frame.vx, y: frame.oy + a * frame.uy + b * frame.vy };
}

/**
 * Teacher takes one photo. Bubbles are read on the warped sheet; identity is cropped from the
 * original pixels of the header (a virtual zoom), so handwriting is not squeezed through 1000×1414.
 */
function photoBox(fields: PhotoFields, a0: number, a1: number, b0: number, b1: number) {
  const h = destToSrcHomography(fields.quad, CANONICAL_WIDTH, CANONICAL_HEIGHT);
  const corners = [gridDest(fields.frame, a0, b0), gridDest(fields.frame, a1, b0), gridDest(fields.frame, a0, b1), gridDest(fields.frame, a1, b1)].map((p) =>
    applyHomography(h, p.x, p.y),
  );
  const left = Math.min(...corners.map((p) => p.x));
  const top = Math.min(...corners.map((p) => p.y));
  return clampBox(fields.width, fields.height, {
    left: Math.round(left),
    top: Math.round(top),
    width: Math.round(Math.max(...corners.map((p) => p.x)) - left),
    height: Math.round(Math.max(...corners.map((p) => p.y)) - top),
  });
}

function pickRoll(candidates: string[]) {
  const scored = candidates
    .map((value) => ({
      value,
      n:
        (value.length === 7 ? 20 : 0) +
        (/[A-Z]/.test(value) && /\d/.test(value) ? 12 : 0) +
        value.length,
    }))
    .sort((a, b) => b.n - a.n);
  return scored[0]?.value ?? "";
}

function digitRuns(text: string) {
  return [...text.matchAll(/\d+/g)].map((m) => m[0]);
}

function parseDate(raw: string) {
  const cleaned = raw.replace(/\|/g, "/");
  const digits = digitRuns(cleaned).join("");
  if (digits.length === 8) return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
  const match = cleaned.match(/(\d{1,2})\D+(\d{1,2})\D+(\d{4})/);
  if (match) return `${match[1]!.padStart(2, "0")}/${match[2]!.padStart(2, "0")}/${match[3]}`;
  return digits.length >= 6 ? digits : "";
}

export function parseTestIdCandidates(raws: string[], dateDigits = "") {
  const out: string[] = [];
  for (const raw of raws) {
    for (const run of digitRuns(raw)) {
      if (run.length < 4 || run.length > 6) continue;
      if (dateDigits.length >= 6 && dateDigits.includes(run)) continue;
      out.push(run);
    }
  }
  return [...new Set(out)];
}

function wordsOnly(text: string) {
  return text
    .replace(/[^A-Z ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tidyName(text: string) {
  const words = wordsOnly(text);
  const cut = words.search(/\b(SCHOOL|CLASS|SECTION|BITS)\b/);
  return (cut > 0 ? words.slice(0, cut) : words).trim();
}

function tidySchool(text: string) {
  const words = wordsOnly(text);
  const match = words.match(/([A-Z]+(?:\s+[A-Z]+)*)\s+SCHOOL/);
  if (match) return `${match[1]} SCHOOL`;
  if (words.includes("SCHOOL")) return words;
  return words;
}

async function ocrField(png: Buffer, box: Box, whitelist: string, keep = /[^A-Z0-9]/g) {
  const [ink, gray] = await Promise.all([
    inkField(png, box),
    sharp(png).extract(box).greyscale().normalize().resize({ height: 144, kernel: "lanczos3" }).withMetadata({ density: 300 }).png().toBuffer(),
  ]);
  const [inkText, grayText] = await Promise.all([
    ocrImage(ink, whitelist, PSM.SINGLE_LINE, keep),
    ocrImage(gray, whitelist, PSM.SINGLE_LINE, keep),
  ]);
  return inkText.replace(/ /g, "").length >= grayText.replace(/ /g, "").length ? { text: inkText, crop: ink } : { text: grayText, crop: gray };
}

async function readHeaderFields(fields: PhotoFields) {
  const header = photoBox(fields, -0.04, 1.05, -21.8, -8.6);
  const zoomed = await sharp(fields.png)
    .extract(header)
    .greyscale()
    .normalize()
    .resize({ height: Math.max(420, header.height * 3), kernel: "lanczos3" })
    .withMetadata({ density: 300 })
    .png()
    .toBuffer();
  await dumpCrop("header", zoomed);
  const zoomMeta = await sharp(zoomed).metadata();
  const zoomW = zoomMeta.width ?? header.width;
  const zoomH = zoomMeta.height ?? header.height;
  // Fractions of the grid-anchored header crop (logo row to the Test ID line).
  const frac = (left: number, top: number, right: number, bottom: number) =>
    clampBox(zoomW, zoomH, {
      left: Math.round(zoomW * left),
      top: Math.round(zoomH * top),
      width: Math.round(zoomW * (right - left)),
      height: Math.round(zoomH * (bottom - top)),
    });
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const [name, school, date, test, roll] = await Promise.all([
    ocrField(zoomed, frac(0.175, 0.345, 0.52, 0.44), letters, /[^A-Z ]/g),
    ocrField(zoomed, frac(0.52, 0.45, 0.9, 0.57), `${letters} `, /[^A-Z ]/g),
    ocrField(zoomed, frac(0.475, 0.7, 0.75, 0.81), "0123456789/|", /[^0-9/|]/g),
    ocrField(zoomed, frac(0.44, 0.83, 0.64, 0.95), "0123456789"),
    readRollStrip(zoomed, zoomW, zoomH, frac(0.012, 0.59, 0.248, 0.685)),
  ]);
  await Promise.all([
    dumpCrop("name", name.crop),
    dumpCrop("school", school.crop),
    dumpCrop("date", date.crop),
    dumpCrop("test", test.crop),
  ]);
  const examDate = parseDate(date.text);
  const testCandidates = parseTestIdCandidates([test.text], digitRuns(examDate).join(""));
  return {
    rollNo: pickRoll(roll),
    rollCandidates: roll,
    name: tidyName(name.text),
    schoolName: tidySchool(school.text),
    examDate,
    testId: testCandidates[0] ?? "",
    testCandidates,
  };
}

function warpTarget(rgba: { width: number; height: number }) {
  const aspect = rgba.width / Math.max(1, rgba.height);
  if (aspect >= 0.58 && aspect <= 0.86) {
    return { width: CANONICAL_WIDTH, height: CANONICAL_HEIGHT };
  }
  const height = Math.round(CANONICAL_WIDTH / aspect);
  return { width: CANONICAL_WIDTH, height: Math.max(500, Math.min(1800, height)) };
}

const UPRIGHT_GRID_CENTRE = 0.46;
/** Q1 sits ~45% down the corner-dot rectangle; anything above 30% is a wrong dot pair. */
const SHEET_GRID_TOP_MIN = 0.3;

const EMPTY_HEADER = {
  rollNo: "",
  rollCandidates: [] as string[],
  name: "",
  schoolName: "",
  examDate: "",
  testId: "",
  testCandidates: [] as string[],
};

async function photoFields(image: Buffer, rgba: Rgba, frame: GridFrame, quad: Quad, turn: number): Promise<PhotoFields> {
  const upright = await sharp(image).rotate().toBuffer();
  const png = await sharp(upright)
    .rotate(turn || undefined)
    .resize({ width: rgba.width, height: rgba.height, fit: "fill" })
    .png()
    .toBuffer();
  return { png, width: rgba.width, height: rgba.height, frame, quad };
}

/**
 * Phone photos on a white desk hide the page edge. The printed crimson dots are the warp that
 * keeps A–D on the right bubbles; paper-edge and the whole frame are fallbacks.
 */
export async function locateGrid(rgba: Rgba, focus: number) {
  const dots = findRegistrationQuad(rgba);
  const paper = findPaperQuad(rgba);
  const wholePhoto: Quad = [
    { x: 0, y: 0 },
    { x: rgba.width - 1, y: 0 },
    { x: rgba.width - 1, y: rgba.height - 1 },
    { x: 0, y: rgba.height - 1 },
  ];
  const a4 = { width: CANONICAL_WIDTH, height: CANONICAL_HEIGHT };
  const near = (a: Quad, b: Quad) => a.every((p, i) => Math.hypot(p.x - b[i]!.x, p.y - b[i]!.y) < 12);
  // `sheet`: the quad is the printed corner-dot rectangle, so the grid must sit below the header.
  const attempts: Array<{ quad: Quad; size: { width: number; height: number }; sheet: boolean }> = [];
  if (dots) attempts.push({ quad: dots, size: a4, sheet: true });
  if (paper && quadQuality(paper, rgba.width, rgba.height, focus).ok && (!dots || !near(paper, dots))) {
    attempts.push({ quad: paper, size: quadTarget(paper), sheet: false });
  }
  attempts.push({ quad: wholePhoto, size: warpTarget(rgba), sheet: false });

  const run = async (attempt: (typeof attempts)[number]) => {
    const warped = await warpQuad(rgba, attempt.quad, attempt.size.width, attempt.size.height);
    const layout = layoutOmrBubbles(warped.rgba);
    // The side dots beside Q2–Q3 can pass for the top pair; then the grid lands in the header.
    if (attempt.sheet && layout.measured) {
      const top = Math.min(...layout.bubbles.map((b) => b.y)) / warped.rgba.height;
      if (top < SHEET_GRID_TOP_MIN) layout.measured = false;
    }
    return { quad: attempt.quad, warped, layout };
  };
  const clean = (layout: OmLayout) =>
    layout.measured && layout.flags.every((f) => !f.reason.startsWith("Could not locate"));

  let best = await run(attempts[0]!);
  for (const attempt of attempts.slice(1)) {
    if (clean(best.layout)) break;
    const retry = await run(attempt);
    const better =
      Number(retry.layout.measured) - Number(best.layout.measured) ||
      best.layout.flags.length - retry.layout.flags.length ||
      retry.layout.markCount - best.layout.markCount;
    if (better > 0) best = retry;
  }
  return { rgba, usedQuad: best.quad, warped: best.warped, layout: best.layout };
}

/** Warp size that keeps the quad's own proportions; a bubbles-only photo is not stretched to A4. */
function quadTarget(quad: Quad) {
  const [tl, tr, br, bl] = quad;
  const width = (Math.hypot(tr.x - tl.x, tr.y - tl.y) + Math.hypot(br.x - bl.x, br.y - bl.y)) / 2;
  const height = (Math.hypot(bl.x - tl.x, bl.y - tl.y) + Math.hypot(br.x - tr.x, br.y - tr.y)) / 2;
  return warpTarget({ width: Math.max(1, width), height: Math.max(1, height) });
}

/**
 * Bubbles are always read. `identity: false` skips the handwritten header when the teacher has
 * typed the roll number, test ID and date.
 */
export async function readOmrSheet(image: Buffer, options: { identity?: boolean } = {}): Promise<OmRead> {
  const fail = (reason: string): OmRead => ({
    ok: false,
    reason,
    rollNo: "",
    rollCandidates: [],
    name: "",
    schoolName: "",
    examDate: "",
    testId: "",
    testCandidates: [],
    answers: {},
    flags: [],
    markCount: 0,
    bubbles: [],
    bubbleRadius: 0,
    warpedPng: null,
  });

  const first = await asRgba(image);
  const focus = sharpness(grayFromRgba(first));
  if (focus < 12) return fail("Image is blurry; hold still");

  // The photo is read as it arrives. Only when no grid is found, or the grid sits in the top half
  // of a full sheet (an upside-down page), are the other three turns tried.
  // Upright full sheet: grid centre ~0.6 of the warp. Upside down: ~0.4. Bubbles-only crop: ~0.5.
  const gridCentre = (attempt: Awaited<ReturnType<typeof locateGrid>>) => {
    if (!attempt.layout.measured || !gridFrame(attempt.layout.bubbles)) return -1;
    const ys = attempt.layout.bubbles.map((b) => b.y);
    return (Math.min(...ys) + Math.max(...ys)) / 2 / attempt.warped.rgba.height;
  };
  let found = await locateGrid(first, focus);
  let foundCentre = gridCentre(found);
  let turn: 0 | 90 | 180 | 270 = 0;
  if (foundCentre < UPRIGHT_GRID_CENTRE) {
    const others: Array<90 | 180 | 270> = foundCentre >= 0 || first.width <= first.height ? [180, 90, 270] : [90, 270, 180];
    for (const next of others) {
      const attempt = await locateGrid(await asRgba(image, next), focus);
      const centre = gridCentre(attempt);
      if (centre > foundCentre + 0.05) {
        found = attempt;
        foundCentre = centre;
        turn = next;
      }
      if (foundCentre >= UPRIGHT_GRID_CENTRE) break;
    }
  }
  const { rgba, usedQuad, warped, layout } = found;
  if (!layout.measured) return fail("Could not find the answer grid. Show questions 1–100, edge to edge.");
  const frame = gridFrame(layout.bubbles);
  if (!frame) return fail("Could not find the answer grid. Show questions 1–100, edge to edge.");
  const header =
    options.identity === false
      ? EMPTY_HEADER
      : await readHeaderFields(await photoFields(image, rgba, frame, usedQuad, turn));
  const identity = {
    rollNo: header.rollNo,
    rollCandidates: header.rollCandidates,
    name: header.name,
    schoolName: header.schoolName,
    examDate: header.examDate,
    testId: header.testId,
    testCandidates: header.testCandidates,
    bubbles: layout.bubbles,
    bubbleRadius: layout.radius,
    warpedPng: warped.png,
  };
  if (layout.markCount === 0 && layout.flags.length === 0) {
    return {
      ...fail("No filled answers found. Show questions 1–100 and retake."),
      ...identity,
    };
  }
  return {
    ok: true,
    reason: "locked",
    ...identity,
    answers: layout.answers,
    flags: layout.flags,
    markCount: layout.markCount,
  };
}

export function levenshtein(a: string, b: string) {
  const s = a.toUpperCase();
  const t = b.toUpperCase();
  const rows = t.length + 1;
  const cols = s.length + 1;
  const dp = Array.from({ length: rows }, () => Array<number>(cols).fill(0));
  for (let i = 0; i < cols; i++) dp[0]![i] = i;
  for (let j = 0; j < rows; j++) dp[j]![0] = j;
  for (let j = 1; j < rows; j++) {
    for (let i = 1; i < cols; i++) {
      const cost = s[i - 1] === t[j - 1] ? 0 : 1;
      dp[j]![i] = Math.min(dp[j]![i - 1]! + 1, dp[j - 1]![i]! + 1, dp[j - 1]![i - 1]! + cost);
    }
  }
  return dp[t.length]![s.length]!;
}

export async function closeOmrOcr() {
  if (!ocrWorker) return;
  const w = await ocrWorker;
  ocrWorker = null;
  await w.terminate();
}

function isSubsequence(needle: string, haystack: string) {
  let i = 0;
  for (const ch of haystack) {
    if (ch === needle[i]) i += 1;
    if (i === needle.length) return true;
  }
  return needle.length > 0 && i === needle.length;
}

export function matchAny(raws: string[], candidates: string[], max = 2) {
  for (const raw of raws) {
    const hit = uniqueClosest(raw, candidates, max);
    if (hit) return hit;
  }
  const needles = raws.map((raw) => cleanToken(raw)).filter((raw) => raw.length >= 4);
  const hits = [
    ...new Set(
      candidates.filter((value) => {
        const hay = value.toUpperCase();
        return needles.some((needle) => isSubsequence(needle, hay) || isSubsequence(hay, needle));
      }),
    ),
  ];
  return hits.length === 1 ? hits[0]! : null;
}

const LOOK_ALIKE: Record<string, string> = { S: "5", Z: "2", B: "8", O: "0", Q: "0", D: "0", I: "1", L: "1", G: "6" };

/** Handwritten S/5, Z/2, B/8, O/0, I/1, G/6 are indistinguishable to OCR; compare them as one glyph. */
function shapeKey(value: string) {
  return [...value.toUpperCase()].map((ch) => LOOK_ALIKE[ch] ?? ch).join("");
}

/** Unique closest candidate within `max` edits. Null if none or a tie. */
export function uniqueClosest(raw: string, candidates: string[], max = 2) {
  const needle = shapeKey(raw.trim());
  if (!needle) return null;
  const exact = candidates.filter((c) => shapeKey(c) === needle);
  if (exact.length === 1) return exact[0]!;
  if (exact.length > 1) return null;
  const scored = candidates
    .map((value) => ({ value, d: levenshtein(needle, shapeKey(value)) }))
    .filter((row) => row.d <= max)
    .sort((a, b) => a.d - b.d || a.value.localeCompare(b.value));
  if (!scored[0] || (scored[1] && scored[1].d === scored[0].d)) return null;
  return scored[0].value;
}
