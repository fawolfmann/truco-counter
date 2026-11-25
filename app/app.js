// Anotador de truco: UI wiring. Game rules live in lib/score.js, persistence in lib/storage.js.
import { h, s } from "./lib/dom.js";
import { inset, sticksFor } from "./lib/matches.js";
import {
  HALF, POINTS_PER_BOX, TEAMS, addPoints, boxes, rename, restart, scoreLabel, setTarget, undo, winner,
} from "./lib/score.js";
import { loadState, saveState } from "./lib/storage.js";

const HEAD_RADIUS = 5.5;
const TOAST_MS = 2600;
const HAPTIC_MS = 12;

const $ = (id) => document.getElementById(id);
const board = $("board");
const controls = $("controls");

let state = loadState(localStorage);
let previous = state; // to animate only the sticks that were just added
let warnedStorage = false;

// ---------- rendering ----------

function stick(line, isFresh) {
  const { x1, y1, x2, y2 } = inset(line);
  return s("g", { class: isFresh ? "stick fresh" : "stick" },
    s("line", { class: "stick-shadow", x1, y1: y1 + 1.6, x2, y2: y2 + 1.6 }),
    s("line", { class: "stick-wood", x1, y1, x2, y2 }),
    s("circle", { class: "stick-head", cx: x2, cy: y2, r: HEAD_RADIUS }),
  );
}

function box(count, freshFrom) {
  const sticks = sticksFor(count).map((line, i) => stick(line, i >= freshFrom));
  return s("svg", { class: "box", viewBox: "0 0 100 100", "aria-hidden": "true" }, sticks);
}

function teamBoxes(team, range) {
  const score = state.scores[team];
  const before = previous.scores[team];
  return range.map((i) => {
    const freshFrom = Math.max(0, before - i * POINTS_PER_BOX);
    return box(boxes(score, state.target)[i], score > before ? freshFrom : POINTS_PER_BOX);
  });
}

function column(team, range) {
  return h("div", { class: `col col-${team}` }, teamBoxes(team, range));
}

function heading(team) {
  const score = state.scores[team];
  const goodSide = state.target === 30 && score > HALF;
  return h("button", { type: "button", class: "col-head", "aria-label": `Renombrar ${state.names[team]}`, onclick: openSettings },
    h("span", { class: "team-name" }, state.names[team]),
    h("span", { class: goodSide ? "team-score good" : "team-score" },
      h("strong", null, score), " ", scoreLabel(score, state.target)),
  );
}

function renderBoard() {
  const perHalf = HALF / POINTS_PER_BOX;
  const halfCount = state.target / HALF;
  const halves = Array.from({ length: halfCount }, (_, half) => Array.from({ length: perHalf }, (_, i) => half * perHalf + i));
  const rows = halves.flatMap((range, i) => [
    i > 0 ? h("div", { class: "divider", role: "separator", "aria-label": "Mitad: malas y buenas" }) : null,
    h("div", { class: "half" }, TEAMS.map((team) => column(team, range))),
  ]);
  board.replaceChildren(
    h("div", { class: "heads" }, TEAMS.map(heading)),
    h("div", { class: "board-field" }, rows),
  );
  board.setAttribute("aria-label", TEAMS.map((t) => `${state.names[t]}: ${state.scores[t]}`).join(", "));
}

function renderControls() {
  controls.replaceChildren(...TEAMS.map((team) => {
    const score = state.scores[team];
    return h("div", { class: "pad", role: "group", "aria-label": state.names[team] },
      h("button", { type: "button", class: "pad-btn minus", "aria-label": `Restar un punto a ${state.names[team]}`, disabled: score === 0, onclick: () => change(team, -1) }, "−"),
      h("button", { type: "button", class: "pad-btn plus", "aria-label": `Sumar un punto a ${state.names[team]}`, disabled: winner(state) !== null, onclick: () => change(team, 1) }, "+"),
    );
  }));
}

function render() {
  renderBoard();
  renderControls();
}

// ---------- state changes ----------

function commit(next) {
  if (next === state) return;
  const hadWinner = winner(state);
  previous = state;
  state = next;
  if (!saveState(localStorage, state) && !warnedStorage) {
    warnedStorage = true;
    toast("No se pudo guardar en este navegador: si cerrás la página se pierden los puntos.");
  }
  render();
  previous = state;
  const won = winner(state);
  if (won && !hadWinner) showWinner(won);
}

function change(team, delta) {
  if (delta > 0 && winner(state)) return;
  navigator.vibrate?.(HAPTIC_MS);
  commit(addPoints(state, team, delta));
}

// ---------- dialogs ----------

function openSettings() {
  const form = $("settings-form");
  form.elements.nos.value = state.names.nos;
  form.elements.ellos.value = state.names.ellos;
  form.elements.target.value = String(state.target);
  $("target-hint").hidden = true;
  $("settings").showModal();
}

function saveSettings() {
  const form = $("settings-form");
  const named = rename(state, { nos: form.elements.nos.value, ellos: form.elements.ellos.value });
  commit(setTarget(named, Number(form.elements.target.value)));
}

function showWinner(team) {
  const other = TEAMS.find((t) => t !== team);
  $("win-title").textContent = state.names[team];
  $("win-score").textContent = `${state.scores[team]} a ${state.scores[other]}`;
  $("win").showModal();
}

let toastTimer;
function toast(message) {
  const el = $("toast");
  el.textContent = message;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; }, TOAST_MS);
}

function wireDialogs() {
  $("open-settings").addEventListener("click", openSettings);

  const settings = $("settings");
  settings.addEventListener("close", () => { if (settings.returnValue === "save") saveSettings(); });
  $("settings-form").addEventListener("change", (event) => {
    if (event.target.name === "target") $("target-hint").hidden = Number(event.target.value) === state.target;
  });
  $("new-game").addEventListener("click", () => { settings.close(); $("confirm-new").showModal(); });

  const confirm = $("confirm-new");
  confirm.addEventListener("close", () => { if (confirm.returnValue === "confirm") commit(restart(state)); });

  const win = $("win");
  win.addEventListener("close", () => {
    if (win.returnValue === "again") commit(restart(state));
    else if (win.returnValue === "undo") commit(undo(state));
  });

  // Tapping the dimmed backdrop closes a sheet without changes.
  for (const dialog of document.querySelectorAll("dialog")) {
    dialog.addEventListener("click", (event) => { if (event.target === dialog) dialog.close("cancel"); });
  }
}

// ---------- platform ----------

/** Keep the screen on while the app is visible (a hand of truco is long). Not critical if unsupported. */
async function keepAwake() {
  if (!("wakeLock" in navigator) || document.visibilityState !== "visible") return;
  try {
    await navigator.wakeLock.request("screen");
  } catch {
    // denied (battery saver, unsupported context): the screen just sleeps as usual
  }
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker.register("sw.js").catch(() => {
    // offline support is a bonus; the app works online without it
  });
}

// Another tab changed the game: follow it.
window.addEventListener("storage", () => {
  previous = state = loadState(localStorage);
  render();
});
document.addEventListener("visibilitychange", keepAwake);

wireDialogs();
render();
keepAwake();
registerServiceWorker();
