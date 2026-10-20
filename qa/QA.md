# QA 2026-10-19
Script: qa/qa.mjs. Langs EN/AR/UR × mobile 390px / desktop 1280px. 158/158 checks pass locally and on live Pages.
Screens: onboarding, today (empty + data), calendar, day sheet, insights, settings (bad code), supporter dark theme, PIN lock. Each checked for no horizontal overflow and no JS errors. Also: RTL dir, import/export round-trip, note HTML escaping, wrong/right PIN, manual language switch, delete-all, auto-detect ar-SA, fallback en for ja-JP.
Shots: qa/shots (local), qa/shots_live (live).
