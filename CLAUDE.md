# Truco counter — notes for Claude Code

Static mobile PWA in `app/`, deployed to Cloudflare Pages by `.github/workflows/check.yml`. No server, no storage
bindings: the game lives in `localStorage` on the device.

- User-facing copy in Spanish (Rioplatense, "vos"); code, comments and commit messages in English.
- Plain ES modules, no framework, bundler, npm dependencies or CDNs. CSP is `script-src 'self'; style-src 'self'`:
  no inline scripts/styles, no `innerHTML`; build DOM with `app/lib/dom.js`.
- Game rules are pure functions in `app/lib/score.js` (never mutate state); persistence and validation of stored
  data in `app/lib/storage.js`; match geometry in `app/lib/matches.js`. `app/app.js` only wires the UI.
- After changing anything under `app/`, run `npm run build` (refreshes `app/precache.js`); CI fails otherwise.
- If you change the CSP, change it in both `app/index.html` and `app/_headers` (a test checks they match).
- Tests: `npm test`.
