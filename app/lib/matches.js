// Geometry of a box of matches, in a 100x100 viewBox. Points are drawn in the order players draw them
// on paper: left side, top, right side, bottom, and the fifth one diagonally across the square.
import { POINTS_PER_BOX } from "./score.js";

const LO = 14;
const HI = 86;

/** Each stick goes from its tail (x1, y1) to its head (x2, y2), where the red tip is drawn.
 *  Heads go around like a pinwheel so each corner has exactly one. */
export const STICKS = Object.freeze([
  { x1: LO, y1: HI, x2: LO, y2: LO }, // 1: left, head up
  { x1: LO, y1: LO, x2: HI, y2: LO }, // 2: top, head right
  { x1: HI, y1: LO, x2: HI, y2: HI }, // 3: right, head down
  { x1: HI, y1: HI, x2: LO, y2: HI }, // 4: bottom, head left
  { x1: 26, y1: 74, x2: 74, y2: 26 }, // 5: diagonal, head top-right
]);

/** The sticks to draw for a box holding `count` points (0..5). */
export function sticksFor(count) {
  const n = Math.min(POINTS_PER_BOX, Math.max(0, Math.trunc(count)));
  return STICKS.slice(0, n);
}

/** Shortens a stick a bit at both ends so sticks meeting at a corner don't overlap their heads. */
export function inset({ x1, y1, x2, y2 }, by = 3) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  const ux = (dx / len) * by;
  const uy = (dy / len) * by;
  return { x1: x1 + ux, y1: y1 + uy, x2: x2 - ux, y2: y2 - uy };
}
