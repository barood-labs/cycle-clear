# Virabloom v2: features and why (see RESEARCH.md)
| Feature | Why (research) |
|---|---|
| 6 modes chosen at onboarding: period, birth control, irregular/PCOS, TTC, pregnancy, perimenopause | One-size 28-day apps fail PCOS/peri/BC users (top Reddit complaint) |
| Range predictions for PCOS/peri; no "late" scare in BC/irregular modes | "App says I'm 31 days late" on the pill; irregular cycles |
| Pill tracker: one tap on Today, streak, calendar dot, daily reminder | Pill logging is tedious in Clue free |
| Mood (6) + 11 symptoms + PCOS (hair growth/loss, weight) + peri (hot flashes, night sweats) | Most-requested logging beyond flow |
| Patterns by cycle phase | "Which phase do I usually get which symptom" (Flo graphs) |
| TTC: BBT, ovulation test, intimacy; fertile card first | TTC users (Fertility Friend reviews) |
| Pregnancy: week, trimester, due date (LMP + 280 days) | Lifecycle continuity |
| Local reminders (period −2 days, pill daily, fertile start) | Top want; on-device only |
| Doctor report (print/PDF on web; share sheet on iOS/Android) | Export locked behind paywalls elsewhere |
| Discreet mode (neutral name + neutral reminders), PIN + Face ID | Post-Roe privacy, "phone checked by others" |
| Everything free; $2.99 one-time supporter = themes only | Paywall complaints; one-time purchase asked for |
| Planned: home-screen widget (WidgetKit/Glance), alternate discreet app icon (iOS setAlternateIconName) | Needs native extension work, v2.1 |

## v3
| Feature | Notes |
|---|---|
| Apple Health sync (opt-in) | Menstrual flow read/write on device; local Capacitor plugin `CCHealth` |
| Partner sharing | Encrypted link+QR (AES-GCM/PBKDF2 200k, data in URL fragment, separate passcode, 35-day expiry), .ics, text; Stop sharing = cancelling .ics |
| iOS widget | WidgetKit extension (systemSmall) via App Group `group.com.baroodlabs.cycleclear`; discreet variant |
| Android widget | AppWidgetProvider; discreet variant |
| Android Health Connect | Not done: needs a Health Connect plugin + Play Health Connect declaration; deferred |

## v4 pricing
Free forever: logging, predictions, all modes, pill tracker, reminders, PIN/Face ID, export/backup, Apple Health. Pro ($9.99 one-time, IAP `com.baroodlabs.cycleclear.pro`, Restore): partner sharing, widgets, doctor report, detailed patterns, themes. Paywall = #/pro, opened only by the user (Settings → About Pro, or tapping a 🔒 Pro feature). PCOS: mailto request with random request ID → web: we send a PCOS code (hashes in config.js, plain codes in private/pro_codes.txt on the box, 60 codes); iOS/Android: we send a store promo/offer code. Rename the app: edit brand.json → `npm run brand`.
