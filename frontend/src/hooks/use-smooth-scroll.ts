"use client";

import { useEffect } from "react";

const LINE_HEIGHT_PX = 16;
const SETTLE_PX = 0.5;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
const maxScroll = () => document.documentElement.scrollHeight - window.innerHeight;

// `html` has `scroll-behavior: smooth`, which would fight per-frame scrolling.
const jumpTo = (top: number) => window.scrollTo({ top, behavior: "instant" });

const prefersReducedMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Popups lock page scroll with `overflow: hidden`; respect that. */
const isPageScrollLocked = () =>
  [document.documentElement, document.body].some(
    (element) => getComputedStyle(element).overflowY === "hidden",
  );

/** Leaves wheel events alone inside elements that scroll on their own (lists, textareas). */
function isInsideScrollable(target: EventTarget | null) {
  for (let node = target as HTMLElement | null; node && node !== document.body; node = node.parentElement) {
    const { overflowY } = getComputedStyle(node);
    if ((overflowY === "auto" || overflowY === "scroll") && node.scrollHeight > node.clientHeight) {
      return true;
    }
  }
  return false;
}

const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2);

/** Eased page scroll that brings `element` into view below the sticky header. */
export function smoothScrollToElement(element: Element, { offset = 96, duration = 700 } = {}) {
  const start = window.scrollY;
  const end = clamp(start + element.getBoundingClientRect().top - offset, 0, maxScroll());

  if (prefersReducedMotion() || Math.abs(end - start) < 1) {
    jumpTo(end);
    return;
  }

  const startedAt = performance.now();
  const frame = (now: number) => {
    const progress = Math.min((now - startedAt) / duration, 1);
    jumpTo(start + (end - start) * easeInOutCubic(progress));
    if (progress < 1) requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

/** Glides the page toward each wheel target instead of jumping, for a slower, smoother feel. */
export function useSmoothWheelScroll(enabled = true, ease = 0.08) {
  useEffect(() => {
    if (!enabled || prefersReducedMotion()) return;

    let target = window.scrollY;
    let frame = 0;

    const step = () => {
      // The page can shrink mid-glide; never chase a position that no longer exists.
      target = clamp(target, 0, maxScroll());
      const before = window.scrollY;
      const distance = target - before;

      if (Math.abs(distance) < SETTLE_PX) {
        jumpTo(target);
        frame = 0;
        return;
      }

      jumpTo(before + distance * ease);
      // Sub-pixel steps may not move the page at all; finish instead of looping.
      if (Math.abs(window.scrollY - before) < 0.1) {
        jumpTo(target);
        frame = 0;
        return;
      }
      frame = requestAnimationFrame(step);
    };

    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey || event.defaultPrevented) return;
      if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
      if (isPageScrollLocked() || isInsideScrollable(event.target)) return;

      event.preventDefault();
      if (!frame) target = window.scrollY;

      const delta =
        event.deltaMode === WheelEvent.DOM_DELTA_LINE
          ? event.deltaY * LINE_HEIGHT_PX
          : event.deltaMode === WheelEvent.DOM_DELTA_PAGE
            ? event.deltaY * window.innerHeight
            : event.deltaY;

      target = clamp(target + delta, 0, maxScroll());
      if (!frame) frame = requestAnimationFrame(step);
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      window.removeEventListener("wheel", onWheel);
      cancelAnimationFrame(frame);
    };
  }, [enabled, ease]);
}
