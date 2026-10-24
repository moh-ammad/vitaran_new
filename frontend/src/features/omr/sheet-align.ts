export type Mark = { x: number; y: number };
export type AlignStatus = { ok: boolean; reason: string; marks?: { tl: Mark; tr: Mark } };

/**
 * Every Vitaran OMR sheet prints crimson registration dots: one beside the logo (top-left) and one
 * top-right, level with each other. They are found on any background, unlike the paper edge on a
 * white desk. Positions below are in units of the top-left → top-right dot distance.
 */
const GRID_BOTTOM = 1.4;
const MIN_SPAN = 0.55;
const MAX_TILT = 0.05;

function isRegistrationInk(r: number, g: number, b: number) {
  return r > 50 && r > g * 2.2 + 15 && r > b * 1.25 && g < 90;
}

function crimsonDots(data: ImageData) {
  const { width, height, data: px } = data;
  const ink = new Uint8Array(width * height);
  for (let i = 0; i < width * height; i++) {
    ink[i] = isRegistrationInk(px[i * 4] ?? 0, px[i * 4 + 1] ?? 0, px[i * 4 + 2] ?? 0) ? 1 : 0;
  }
  const seen = new Uint8Array(width * height);
  const dots: Mark[] = [];
  const maxArea = width * width * 0.004;
  for (let start = 0; start < width * height; start++) {
    if (!ink[start] || seen[start]) continue;
    const stack = [start];
    seen[start] = 1;
    let area = 0;
    let sx = 0;
    let sy = 0;
    let minX = width;
    let maxX = 0;
    let minY = height;
    let maxY = 0;
    while (stack.length) {
      const i = stack.pop()!;
      const x = i % width;
      const y = (i / width) | 0;
      area += 1;
      sx += x;
      sy += y;
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
      for (const [nx, ny] of [
        [x + 1, y],
        [x - 1, y],
        [x, y + 1],
        [x, y - 1],
      ] as const) {
        if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
        const ni = ny * width + nx;
        if (seen[ni] || !ink[ni]) continue;
        seen[ni] = 1;
        stack.push(ni);
      }
    }
    const w = maxX - minX + 1;
    const h = maxY - minY + 1;
    // Round dots only: the logo bars are tall, text strokes are thin.
    if (area < 3 || area > maxArea || w > h * 2 || h > w * 2) continue;
    dots.push({ x: sx / area, y: sy / area });
  }
  return dots;
}

/** Live check on a video frame: lock only when the printed marks say the whole sheet is readable. */
export function sheetAlignment(data: ImageData): AlignStatus {
  const { width, height } = data;
  const dots = crimsonDots(data);
  if (dots.length < 2) return { ok: false, reason: "Point the camera at questions 1–100" };

  const tl = dots.reduce((a, b) => (b.x + b.y < a.x + a.y ? b : a));
  const tr = dots.reduce((a, b) => (b.x - b.y > a.x - a.y ? b : a));
  const span = Math.hypot(tr.x - tl.x, tr.y - tl.y);
  if (tl === tr || tr.x - tl.x < width * 0.2) return { ok: false, reason: "Show the top of the sheet (logo and red dots)" };
  if (Math.abs(tr.y - tl.y) > span * MAX_TILT) return { ok: false, reason: "Straighten the sheet — keep the top edge level" };
  if (span < width * MIN_SPAN) return { ok: false, reason: "Move closer" };
  if (tl.y + span * GRID_BOTTOM > height) return { ok: false, reason: "Move back — keep questions 1–100 in view" };
  return { ok: true, reason: "Hold still…", marks: { tl, tr } };
}

/** True when the marks moved less than `tolerance` of the frame width since the last frame. */
export function isSteady(prev: AlignStatus["marks"], next: AlignStatus["marks"], width: number, tolerance = 0.012) {
  if (!prev || !next) return false;
  const moved = Math.max(
    Math.hypot(prev.tl.x - next.tl.x, prev.tl.y - next.tl.y),
    Math.hypot(prev.tr.x - next.tr.x, prev.tr.y - next.tr.y),
  );
  return moved <= width * tolerance;
}
