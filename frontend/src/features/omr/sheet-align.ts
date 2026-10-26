export type FrameCheck = { ok: boolean; reason: string; thumb: Uint8Array };

const THUMB = 64;

/**
 * Live check on a video frame. The teacher frames questions 1–100 only, so nothing printed in the
 * header (logo, corner dots) is required: the frame must show light paper with bubble-sized ink,
 * and be held still. Reading the grid is left to the server, which handles any framing.
 */
export function checkFrame(data: ImageData, previous: Uint8Array | null): FrameCheck {
  const { width, height, data: px } = data;
  const thumbW = THUMB;
  const thumbH = Math.max(1, Math.round((THUMB * height) / width));
  const thumb = new Uint8Array(thumbW * thumbH);
  const gray: number[] = [];
  for (let ty = 0; ty < thumbH; ty++) {
    const y = Math.min(height - 1, Math.floor(((ty + 0.5) * height) / thumbH));
    for (let tx = 0; tx < thumbW; tx++) {
      const x = Math.min(width - 1, Math.floor(((tx + 0.5) * width) / thumbW));
      const i = (y * width + x) * 4;
      const v = Math.round(0.299 * px[i]! + 0.587 * px[i + 1]! + 0.114 * px[i + 2]!);
      thumb[ty * thumbW + tx] = v;
    }
  }
  for (let y = 0; y < height; y += 3) {
    const row = y * width;
    for (let x = 0; x < width; x += 3) {
      const i = (row + x) * 4;
      gray.push(Math.min(px[i]!, px[i + 1]!, px[i + 2]!));
    }
  }
  const sorted = [...gray].sort((a, b) => a - b);
  const paper = sorted[Math.floor(sorted.length * 0.7)] ?? 0;
  if (paper < 90) return { ok: false, reason: "More light — the sheet looks too dark", thumb };
  const ink = gray.filter((v) => v < paper * 0.6).length / gray.length;
  if (ink < 0.015) return { ok: false, reason: "Point the camera at questions 1–100", thumb };
  if (ink > 0.45) return { ok: false, reason: "Move back — show questions 1–100 on white paper", thumb };

  if (!previous || previous.length !== thumb.length) return { ok: false, reason: "Hold still", thumb };
  let moved = 0;
  for (let i = 0; i < thumb.length; i++) moved += Math.abs(thumb[i]! - previous[i]!);
  if (moved / thumb.length > 7) return { ok: false, reason: "Hold still", thumb };
  return { ok: true, reason: "Hold still…", thumb };
}
