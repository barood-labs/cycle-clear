# Cycle Clear — private period tracker (PWA)
Live: https://barood-labs.github.io/cycle-clear/ · Static, no build step, no dependencies. Data: IndexedDB on-device only.
Files: `app.js` (UI), `cycle.js` (predictions), `db.js` (storage), `i18n.js` (10 languages), `config.js` (supporter URL TODO + code hash).
QA: `node qa/qa.mjs` against a local server (`BASE_URL=...`). Docs: `docs/` (store listings, Apple review notes, translation status).
Estimates only — not a medical device, not contraception.
