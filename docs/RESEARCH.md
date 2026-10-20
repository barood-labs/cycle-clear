# Virabloom: user research (2026-10-19)
Sources: Reddit r/women "What do you actually wish your period tracking app did?" (Jun 2026), r/TheGirlSurvivalGuide "Best period tracker app in 2025" (+2026 replies), Kymara Health's 2026 Reddit round-up, Tilburg thesis on PCOS needs (arno.uvt.nl/show.cgi?fid=183009), UCL analysis of 5,257 Play reviews across 78 FemHealth apps (Warner et al.), Kent GDPR audit of Flo/Clue/Eve, CHI 2026 anonymity study, FTC v. Flo (2021), Frasco v. Flo jury verdict against Meta (Aug 2025), Google/Flo $56M settlement (Reuters, Sep 2025), Fertility Friend App Store page.

## Top complaints about Flo / Clue / Stardust & co.
1. **Privacy & trust.** Flo shared health data with Facebook/Google SDKs (FTC 2021; Meta found liable 2025; $56M settlement). Post-Roe fear of subpoenas, insurers, ads. Users uninstall rather than fiddle with "anonymous mode" settings that are hard to find (CHI 2026).
2. **Paywalls on core features.** Clue/Flo lock symptom logging, insights, and export behind subscriptions; "no one-time purchase option".
3. **Bad predictions for irregular cycles.** 28-day assumptions fail PCOS, perimenopause, postpartum; "predicting a period three weeks late with no way to tell the app".
4. **Birth control unfriendly.** "I'm on the pill, the app keeps saying my period is 31 days late"; logging the pill daily is tedious.
5. Ads, nagging upsells, data loss when switching phones.

## Most-wanted features (ranked by frequency)
1. Accurate predictions that **adapt to irregular cycles** (ranges, not one fixed date)
2. Flow, symptoms (incl. spotting), mood, notes, all **free**
3. **Patterns:** "which phase do I usually get which symptom"
4. **Birth-control/pill tracking** with reminders, plus a mode that stops "late period" alarms
5. **Reminders** (period coming, pill, fertile window)
6. **PCOS symptom tracking**
7. Export/backup and a **doctor-ready report**
8. **Trying to conceive** (fertile window, BBT, ovulation tests) and **pregnancy** (week-by-week)
9. **Perimenopause** (hot flashes, night sweats, sleep, skipped periods)
10. Passcode/biometric lock, discreet mode
11. Apple Health sync, partner sharing, home-screen widget

## What we build (fits local-only privacy)
| Need | Virabloom answer |
|---|---|
| Privacy | 100% on-device, no account, no SDKs, no network; App Privacy "Data Not Collected" |
| No paywall | Every feature free; the $2.99 one-time supporter unlock only adds themes |
| Irregular / PCOS | "Irregular/PCOS" mode: predictions shown as a date range (shortest–longest recent cycle), PCOS symptoms (acne, hair growth, hair loss, weight change), no "late" scare |
| Birth control | Pill tracker (one-tap "taken", streak), "on hormonal birth control" mode hides fertility predictions and late warnings |
| Patterns | Symptom/mood counts by cycle phase (menstrual, follicular, ovulation, luteal) |
| Reminders | Local notifications only (native): period in 2 days, daily pill time, fertile window starts |
| TTC | Trying-to-conceive mode: fertile window emphasis, BBT, ovulation-test, intercourse logging |
| Pregnancy | Due date (Naegele, +280 days), week & trimester, no period predictions |
| Perimenopause | Hot flashes, night sweats, sleep, skipped-period tracking; range predictions |
| Doctor report | Printable/PDF report: cycle history, averages, top symptoms, pills taken |
| Discreet | Optional neutral name/icon in-app ("Calendar"), plus PIN / Face ID |
| Widget | Planned (needs native WidgetKit/Glance extension; v1.1) |
| Apple Health / partner sharing | Deferred: both conflict with "data never leaves the device" or need HealthKit review; reconsider later as opt-in |
