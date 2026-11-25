// Static checks on the published folder: CSP consistency, precache freshness, nothing unsafe in the front end.
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { test } from "node:test";
import { buildPrecache } from "../scripts/build-precache.mjs";

const read = (path) => readFileSync(new URL(`../app/${path}`, import.meta.url), "utf8");

test("CSP header matches the <meta> CSP (plus frame-ancestors)", () => {
  const meta = read("index.html").match(/http-equiv="Content-Security-Policy" content="([^"]+)"/)[1];
  const header = read("_headers").match(/Content-Security-Policy: (.+)/)[1].trim();
  assert.equal(header, `${meta}; frame-ancestors 'none'`);
});

test("precache.js is up to date (run `npm run build`)", () => {
  assert.equal(read("precache.js"), buildPrecache());
});

test("front-end code never parses HTML or sets inline styles", () => {
  const sources = ["app.js", ...readdirSync(new URL("../app/lib/", import.meta.url)).map((f) => `lib/${f}`)];
  for (const file of sources) {
    const code = read(file);
    assert.doesNotMatch(code, /innerHTML|outerHTML|insertAdjacentHTML|document\.write/, file);
    assert.doesNotMatch(code, /\.style\./, file);
  }
  assert.doesNotMatch(read("index.html"), /\sstyle=|<script>(?!<)/);
});
