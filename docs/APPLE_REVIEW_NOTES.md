# App Review notes (paste into App Store Connect → App Review Information → Notes)

Cycle Clear is a private menstrual-cycle diary with estimated predictions.

- **No data collection.** App Privacy questionnaire: "Data Not Collected". All entries (period dates, flow, symptoms, notes) are stored only on-device (WebView IndexedDB). The app has no account, no backend, no analytics, no ads, no third-party SDKs and makes no network requests for user data. Content-Security-Policy sets `connect-src 'none'`.
- **Guideline 5.1.1 (Data collection and storage):** nothing is collected; no login is required; users can export their own data to a file and delete all data in Settings → Delete all data.
- **Guideline 5.1.3 (Health and health research):** health data is never transmitted, shared, used for advertising, or stored in iCloud. **HealthKit (optional, off by default):** if the user turns on Settings → Apple Health, the app reads and writes **menstrual flow only** (HKCategoryTypeIdentifierMenstrualFlow) on the device. Health data is never sent off the device, never used for advertising, marketing or data mining, never sold or shared with third parties, and is **not stored in iCloud** by the app (the app has no iCloud/CloudKit entitlement). HealthKit usage strings: NSHealthShareUsageDescription / NSHealthUpdateUsageDescription explain the opt-in sync. The privacy policy states the same.
- **Guideline 1.4.1 (Medical):** the app does not diagnose or treat. It shows a first-launch disclaimer and a persistent notice that predictions are estimates only, it is not a medical device and must not be used as contraception.
- **Pricing:** core tracking is free forever (logging, predictions, all modes, pill tracker, reminders, PIN/Face ID, export/backup, Apple Health). **Pro** is a one-time **non-consumable** In-App Purchase `com.baroodlabs.cycleclear.pro` ($9.99 tier, no subscription) with **Restore Purchase**. Pro unlocks partner sharing, the home-screen widget, the doctor report, detailed pattern insights and colour themes. The paywall only appears when the user opens Pro or taps a Pro feature; no pop-ups or timers. No external purchase links or code entry are shown in the iOS/Android builds (3.1.1).
- **Free Pro for PCOS:** users can email us (mailto, composed in their own mail app) for a free Pro; on iOS we reply with an App Store **offer/promo code** for the non-consumable, redeemed in the App Store, then Restore. No health data is requested.
- **Local notifications only** (period, pill, fertile window); scheduled on-device, opt-in, no push server. Discreet mode makes notification text neutral.
- **Face ID** (NSFaceIDUsageDescription) only unlocks the optional app lock; no biometric data is accessed.
- Doctor report and backup are created on-device and shared only through the iOS share sheet by the user.
- Modes: period, birth control, irregular/PCOS, trying to conceive, pregnancy (due date estimate), perimenopause. All are estimates with the medical disclaimer.
- PIN lock is a privacy screen only (stated in-app).
- Demo: no login needed. Tap "I understand", then "My period started today".
- Privacy policy URL: https://barood-labs.github.io/cycle-clear/privacy.html

- **Partner sharing (no server):** the user picks what to share (next period dates, fertile window, current phase). Output is created on-device: an .ics file, plain text via the share sheet, or an AES-GCM encrypted link whose data lives in the URL fragment (never sent to a server; GitHub Pages only serves the static page) plus a separate passcode. "Stop sharing" produces a cancelling .ics. No Health data from HealthKit is included in shares unless it was logged in-app as a period.
- **Widget (WidgetKit):** shows cycle day and next date from an App Group on device; discreet mode shows numbers only, no period wording.
- App Privacy: still **Data Not Collected**.
