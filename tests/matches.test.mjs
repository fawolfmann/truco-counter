import assert from "node:assert/strict";
import { test } from "node:test";
import { STICKS, inset, sticksFor } from "../app/lib/matches.js";

test("five sticks: left, top, right, bottom, diagonal", () => {
  assert.equal(STICKS.length, 5);
  const [left, top, right, bottom, diagonal] = STICKS;
  assert.equal(left.x1, left.x2);
  assert.equal(top.y1, top.y2);
  assert.equal(right.x1, right.x2);
  assert.ok(right.x1 > left.x1);
  assert.equal(bottom.y1, bottom.y2);
  assert.ok(bottom.y1 > top.y1);
  assert.ok(diagonal.x2 > diagonal.x1 && diagonal.y2 < diagonal.y1);
});

test("sticksFor clamps the count", () => {
  assert.equal(sticksFor(0).length, 0);
  assert.equal(sticksFor(3).length, 3);
  assert.equal(sticksFor(9).length, 5);
  assert.equal(sticksFor(-2).length, 0);
});

test("inset shortens a stick symmetrically", () => {
  const out = inset({ x1: 0, y1: 0, x2: 10, y2: 0 }, 2);
  assert.deepEqual(out, { x1: 2, y1: 0, x2: 8, y2: 0 });
});
