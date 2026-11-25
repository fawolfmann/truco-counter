// Persists the current game in localStorage so it survives reloads, closing the tab and going offline.
// Everything read back is validated: a corrupt or old value becomes a fresh game instead of breaking the app.
import { MAX_HISTORY, TARGETS, TEAMS, cleanName, newGame } from "./score.js";

export const STORAGE_KEY = "truco-counter:v1";

const isScore = (n, target) => Number.isInteger(n) && n >= 0 && n <= target;
const isMove = (m) => m && TEAMS.includes(m.team) && Number.isInteger(m.delta) && m.delta !== 0;

/** Returns a valid game state from a stored JSON string, or null if it cannot be trusted. */
export function parseState(raw) {
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!data || data.v !== 1 || !TARGETS.includes(data.target)) return null;
  const { target, scores, names, history } = data;
  if (!scores || !TEAMS.every((t) => isScore(scores[t], target))) return null;
  return {
    v: 1,
    target,
    names: { nos: cleanName(names?.nos, "nos"), ellos: cleanName(names?.ellos, "ellos") },
    scores: { nos: scores.nos, ellos: scores.ellos },
    history: Array.isArray(history) ? history.filter(isMove).map(({ team, delta }) => ({ team, delta })).slice(-MAX_HISTORY) : [],
  };
}

export const serializeState = (state) => JSON.stringify(state);

/** `store` is any object with getItem/setItem (localStorage in the browser, a Map wrapper in tests). */
export function loadState(store) {
  try {
    const raw = store.getItem(STORAGE_KEY);
    return (raw && parseState(raw)) || newGame();
  } catch {
    return newGame(); // storage blocked (private mode, disabled cookies)
  }
}

/** Returns false when the browser refuses to store (quota, private mode) so the UI can warn once. */
export function saveState(store, state) {
  try {
    store.setItem(STORAGE_KEY, serializeState(state));
    return true;
  } catch {
    return false;
  }
}
