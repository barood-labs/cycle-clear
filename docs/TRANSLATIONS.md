# Translations status
EN is the source. All other strings were drafted by the studio (no native speaker yet). **Every non-EN language needs native review before store launch.** Priority by risk (medical/legal wording in the disclaimer):

| Lang | Dir | Status | Notes |
|---|---|---|---|
| EN | LTR | Source | — |
| AR | RTL | Needs native review (HIGH) | Uses feminine address (سجّلي/استشيري). Number agreement for "days" handled in code (3–10 أيام, else يومًا); verify. Disclaimer wording on contraception. |
| UR | RTL | Needs native review (HIGH) | Nastaliq rendering depends on device fonts; check "بیضہ ریزی" (ovulation) and "زرخیز" are natural. |
| HI | LTR | Needs native review (HIGH) | Mix of Hindi + common English loanwords (पीरियड, ओव्यूलेशन) chosen on purpose; confirm tone. |
| ID | LTR | Needs native review (MED) | — |
| TR | LTR | Needs native review (MED) | — |
| ES | LTR | Light review | Neutral Spanish. |
| FR | LTR | Light review | — |
| PT | LTR | Light review | Brazilian Portuguese. |
| DE | LTR | Light review | Uses "du". |

## v3 strings (i18n3.js: sharing, Apple Health, widget)
All 9 non-EN languages are drafts → native review needed. Apple Health names: ES/PT use the localized app names Apple Salud / Apple Saúde, FR Apple Santé, TR Apple Sağlık — verify against Apple’s official localized names. Widget/Health usage strings in Info.plist are English only (add InfoPlist.strings per language before launch).
