# App Review notes (paste into App Store Connect → App Review Information → Notes)

Cycle Clear is a private menstrual-cycle diary with estimated predictions.

- **No data collection.** App Privacy questionnaire: "Data Not Collected". All entries (period dates, flow, symptoms, notes) are stored only on-device (WebView IndexedDB). The app has no account, no backend, no analytics, no ads, no third-party SDKs and makes no network requests for user data. Content-Security-Policy sets `connect-src 'none'`.
- **Guideline 5.1.1 (Data collection and storage):** nothing is collected; no login is required; users can export their own data to a file and delete all data in Settings → Delete all data.
- **Guideline 5.1.3 (Health and health research):** health data is never transmitted, shared, used for advertising, or stored in iCloud. **HealthKit is not used** and no HealthKit entitlement is requested.
- **Guideline 1.4.1 (Medical):** the app does not diagnose or treat. It shows a first-launch disclaimer and a persistent notice that predictions are estimates only, it is not a medical device and must not be used as contraception.
- **Optional supporter unlock ($2.99):** non-consumable In-App Purchase `com.baroodlabs.cycleclear.supporter`, cosmetic only (extra colour themes), with Restore Purchase. All features are free. The web code box / external link is not shown in the iOS or Android app (guideline 3.1.1).
- **Local notifications only** (period, pill, fertile window); scheduled on-device, opt-in, no push server. Discreet mode makes notification text neutral.
- **Face ID** (NSFaceIDUsageDescription) only unlocks the optional app lock; no biometric data is accessed.
- Doctor report and backup are created on-device and shared only through the iOS share sheet by the user.
- Modes: period, birth control, irregular/PCOS, trying to conceive, pregnancy (due date estimate), perimenopause. All are estimates with the medical disclaimer.
- PIN lock is a privacy screen only (stated in-app).
- Demo: no login needed. Tap "I understand", then "My period started today".
- Privacy policy URL: https://barood-labs.github.io/cycle-clear/privacy.html
