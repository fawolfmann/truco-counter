// Pure game logic. Every function returns a new state; nothing is mutated.

export const TEAMS = Object.freeze(["nos", "ellos"]);
export const TARGETS = Object.freeze([15, 30]);
export const POINTS_PER_BOX = 5;
export const HALF = 15; // the line between "malas" and "buenas"
export const MAX_HISTORY = 300;
export const MAX_NAME_LENGTH = 16;

export const DEFAULT_NAMES = Object.freeze({ nos: "Nosotros", ellos: "Ellos" });

export function newGame({ target = 30, names = DEFAULT_NAMES } = {}) {
  return {
    v: 1,
    target: TARGETS.includes(target) ? target : 30,
    names: { nos: cleanName(names.nos, "nos"), ellos: cleanName(names.ellos, "ellos") },
    scores: { nos: 0, ellos: 0 },
    history: [],
  };
}

export function cleanName(value, team) {
  const trimmed = String(value ?? "").replace(/\s+/g, " ").trim().slice(0, MAX_NAME_LENGTH);
  return trimmed || DEFAULT_NAMES[team];
}

/** Adds (or with a negative delta removes) points, clamped to [0, target]. No-op if nothing changes. */
export function addPoints(state, team, delta) {
  if (!TEAMS.includes(team) || !Number.isInteger(delta) || delta === 0) return state;
  const current = state.scores[team];
  const next = Math.min(state.target, Math.max(0, current + delta));
  const applied = next - current;
  if (applied === 0) return state;
  return {
    ...state,
    scores: { ...state.scores, [team]: next },
    history: [...state.history, { team, delta: applied }].slice(-MAX_HISTORY),
  };
}

export function undo(state) {
  const last = state.history.at(-1);
  if (!last) return state;
  const restored = Math.min(state.target, Math.max(0, state.scores[last.team] - last.delta));
  return { ...state, scores: { ...state.scores, [last.team]: restored }, history: state.history.slice(0, -1) };
}

export const canUndo = (state) => state.history.length > 0;

/** Same names and target, scores back to zero. */
export const restart = (state) => newGame({ target: state.target, names: state.names });

export function rename(state, names) {
  return { ...state, names: { nos: cleanName(names.nos, "nos"), ellos: cleanName(names.ellos, "ellos") } };
}

/** Changing the target clamps the scores (e.g. 22 -> 15) and drops the undo history, which no longer applies. */
export function setTarget(state, target) {
  if (!TARGETS.includes(target) || target === state.target) return state;
  const clamp = (n) => Math.min(target, n);
  return { ...state, target, scores: { nos: clamp(state.scores.nos), ellos: clamp(state.scores.ellos) }, history: [] };
}

export function winner(state) {
  return TEAMS.find((team) => state.scores[team] >= state.target) ?? null;
}

/** Sticks drawn in each box of the board: [5, 5, 3, 0, 0, 0] for 13 points out of 30. */
export function boxes(score, target) {
  const count = target / POINTS_PER_BOX;
  return Array.from({ length: count }, (_, i) => Math.min(POINTS_PER_BOX, Math.max(0, score - i * POINTS_PER_BOX)));
}

/** "6 malas", "1 buena", ... (for 30-point games); "12 puntos" for 15-point games. */
export function scoreLabel(score, target) {
  if (target !== 30) return score === 1 ? "1 punto" : `${score} puntos`;
  if (score <= HALF) return score === 1 ? "1 mala" : `${score} malas`;
  const good = score - HALF;
  return good === 1 ? "1 buena" : `${good} buenas`;
}
