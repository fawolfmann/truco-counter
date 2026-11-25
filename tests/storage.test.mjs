import assert from "node:assert/strict";
import { test } from "node:test";
import { addPoints, newGame, rename } from "../app/lib/score.js";
import { STORAGE_KEY, loadState, parseState, saveState, serializeState } from "../app/lib/storage.js";

const memoryStore = () => {
  const map = new Map();
  return { getItem: (k) => map.get(k) ?? null, setItem: (k, v) => map.set(k, String(v)) };
};

test("round-trips a game", () => {
  const game = addPoints(rename(newGame(), { nos: "Pedrito", ellos: "José" }), "nos", 4);
  assert.deepEqual(parseState(serializeState(game)), game);
});

test("save then load through a store", () => {
  const store = memoryStore();
  const game = addPoints(newGame({ target: 15 }), "ellos", 9);
  assert.equal(saveState(store, game), true);
  assert.deepEqual(loadState(store), game);
});

test("empty or corrupt storage gives a new game", () => {
  assert.deepEqual(loadState(memoryStore()), newGame());
  const store = memoryStore();
  store.setItem(STORAGE_KEY, "{not json");
  assert.deepEqual(loadState(store), newGame());
});

test("rejects out-of-range or wrong-version data", () => {
  assert.equal(parseState(JSON.stringify({ ...newGame(), scores: { nos: 31, ellos: 0 } })), null);
  assert.equal(parseState(JSON.stringify({ ...newGame(), scores: { nos: -1, ellos: 0 } })), null);
  assert.equal(parseState(JSON.stringify({ ...newGame(), v: 2 })), null);
  assert.equal(parseState(JSON.stringify({ ...newGame(), target: 20 })), null);
  assert.equal(parseState("null"), null);
});

test("cleans names and drops invalid history entries", () => {
  const raw = JSON.stringify({
    ...newGame(),
    names: { nos: "   ", ellos: 42 },
    history: [{ team: "nos", delta: 2 }, { team: "x", delta: 1 }, { team: "ellos", delta: 0 }, null, { team: "ellos", delta: 1, extra: true }],
  });
  const game = parseState(raw);
  assert.deepEqual(game.names, { nos: "Nosotros", ellos: "42" });
  assert.deepEqual(game.history, [{ team: "nos", delta: 2 }, { team: "ellos", delta: 1 }]);
});

test("storage that throws does not break the app", () => {
  const broken = { getItem() { throw new Error("blocked"); }, setItem() { throw new Error("quota"); } };
  assert.deepEqual(loadState(broken), newGame());
  assert.equal(saveState(broken, newGame()), false);
});
