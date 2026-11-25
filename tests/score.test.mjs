import assert from "node:assert/strict";
import { test } from "node:test";
import {
  MAX_HISTORY, addPoints, boxes, canUndo, cleanName, newGame, rename, restart, scoreLabel, setTarget, undo, winner,
} from "../app/lib/score.js";

test("new game starts at zero, to 30, with default names", () => {
  const game = newGame();
  assert.deepEqual(game.scores, { nos: 0, ellos: 0 });
  assert.equal(game.target, 30);
  assert.deepEqual(game.names, { nos: "Nosotros", ellos: "Ellos" });
  assert.equal(newGame({ target: 99 }).target, 30);
});

test("addPoints adds, records history and does not mutate", () => {
  const game = newGame();
  const next = addPoints(game, "nos", 3);
  assert.equal(next.scores.nos, 3);
  assert.equal(game.scores.nos, 0);
  assert.deepEqual(next.history, [{ team: "nos", delta: 3 }]);
});

test("addPoints clamps to [0, target] and records only what was applied", () => {
  let game = addPoints(newGame({ target: 15 }), "ellos", 14);
  game = addPoints(game, "ellos", 4);
  assert.equal(game.scores.ellos, 15);
  assert.deepEqual(game.history.at(-1), { team: "ellos", delta: 1 });
  const same = addPoints(newGame(), "nos", -1);
  assert.equal(same.history.length, 0);
});

test("addPoints ignores bad input", () => {
  const game = newGame();
  assert.equal(addPoints(game, "them", 1), game);
  assert.equal(addPoints(game, "nos", 1.5), game);
  assert.equal(addPoints(game, "nos", 0), game);
});

test("history is capped", () => {
  let game = newGame();
  for (let i = 0; i < MAX_HISTORY + 20; i++) game = addPoints(addPoints(game, "nos", 1), "nos", -1);
  assert.equal(game.history.length, MAX_HISTORY);
});

test("undo reverts the last move, in order", () => {
  let game = addPoints(addPoints(newGame(), "nos", 2), "ellos", 3);
  game = undo(game);
  assert.deepEqual(game.scores, { nos: 2, ellos: 0 });
  game = undo(game);
  assert.deepEqual(game.scores, { nos: 0, ellos: 0 });
  assert.equal(canUndo(game), false);
  assert.equal(undo(game), game);
});

test("winner is the first team reaching the target", () => {
  const game = addPoints(newGame(), "ellos", 30);
  assert.equal(winner(game), "ellos");
  assert.equal(winner(newGame()), null);
});

test("restart keeps names and target", () => {
  const game = restart(addPoints(rename(newGame({ target: 15 }), { nos: "Pedrito", ellos: "José" }), "nos", 7));
  assert.deepEqual(game.scores, { nos: 0, ellos: 0 });
  assert.deepEqual(game.names, { nos: "Pedrito", ellos: "José" });
  assert.equal(game.target, 15);
});

test("cleanName trims, collapses spaces, caps length and falls back", () => {
  assert.equal(cleanName("  Los   pibes ", "nos"), "Los pibes");
  assert.equal(cleanName("", "ellos"), "Ellos");
  assert.equal(cleanName(null, "nos"), "Nosotros");
  assert.equal(cleanName("x".repeat(40), "nos").length, 16);
});

test("setTarget clamps scores and clears history", () => {
  const game = setTarget(addPoints(newGame(), "nos", 22), 15);
  assert.equal(game.target, 15);
  assert.equal(game.scores.nos, 15);
  assert.equal(game.history.length, 0);
  assert.equal(setTarget(game, 7), game);
});

test("boxes splits a score into boxes of five", () => {
  assert.deepEqual(boxes(13, 30), [5, 5, 3, 0, 0, 0]);
  assert.deepEqual(boxes(0, 15), [0, 0, 0]);
  assert.deepEqual(boxes(30, 30), [5, 5, 5, 5, 5, 5]);
});

test("scoreLabel uses malas/buenas to 30 and plain points to 15", () => {
  assert.equal(scoreLabel(0, 30), "0 malas");
  assert.equal(scoreLabel(1, 30), "1 mala");
  assert.equal(scoreLabel(15, 30), "15 malas");
  assert.equal(scoreLabel(16, 30), "1 buena");
  assert.equal(scoreLabel(22, 30), "7 buenas");
  assert.equal(scoreLabel(1, 15), "1 punto");
  assert.equal(scoreLabel(9, 15), "9 puntos");
});
