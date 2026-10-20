# App Review notes (paste into App Store Connect → App Review Information → Notes)

Cycle Clear is a private menstrual-cycle diary with estimated predictions.

- **No data collection.** App Privacy questionnaire: "Data Not Collected". All entries (period dates, flow, symptoms, notes) are stored only on-device (WebView IndexedDB). The app has no account, no backend, no analytics, no ads, no third-party SDKs and makes no network requests for user data. Content-Security-Policy sets `connect-src 'none'`.
- **Guideline 5.1.1 (Data collection and storage):** nothing is collected; no login is required; users can export their own data to a file and delete all data in Settings → Delete all data.
- **Guideline 5.1.3 (Health and health research):** health data is never transmitted, shared, used for advertising, or stored in iCloud. **HealthKit is not used** and no HealthKit entitlement is requested.
- **Guideline 1.4.1 (Medical):** the app does not diagnose or treat. It shows a first-launch disclaimer and a persistent notice that predictions are estimates only, it is not a medical device and must not be used as contraception.
- **Optional supporter unlock ($2.99):** cosmetic only (extra colour themes). TODO before submission: on iOS this must be an In-App Purchase (guideline 3.1.1) — the web Payhip link/code entry must be hidden in the iOS build.
- PIN lock is a privacy screen only (stated in-app).
- Demo: no login needed. Tap "I understand", then "My period started today".
- Privacy policy URL: https://barood-labs.github.io/cycle-clear/privacy.html
