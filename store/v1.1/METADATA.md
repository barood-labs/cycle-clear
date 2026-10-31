# Virabloom 1.1 — App Store metadata (DRAFT, not submitted)
App: Virabloom: Period Tracker · Apple ID 6824806274 · bundle com.baroodlabs.cycleclear · version 1.1 (build = CI run number)
Rule used for keywords: ≤100 chars, comma-separated without spaces, no words already in that locale's name or subtitle (Apple indexes those already).
Name stays unchanged in every locale (no rename risk). Description: reuse docs/STORE_LISTINGS.md, plus the line added below.

Added description line (all locales, append after the "No account…" line):
- EN: New: discreet mode with neutral reminders ("Time to check in") and an optional plain calendar icon.
- AR: جديد: الوضع الخفي بتذكيرات محايدة ("حان وقت المتابعة") وأيقونة تقويم بسيطة اختيارية.
- ES: Nuevo: modo discreto con recordatorios neutros («Hora de revisar») e icono de calendario neutro opcional.
- FR : Nouveau : mode discret avec rappels neutres (« C’est l’heure de faire le point ») et icône calendrier neutre en option.
- PT: Novo: modo discreto com lembretes neutros ("Hora de conferir") e ícone de calendário neutro opcional.

## EN (primary, en-US)
**Subtitle (29/30):** Private Cycle & Ovulation Log
**Keywords:** menstrual,PMS,PCOS,fertility,offline,perimenopause,calendar,pill,reminder,symptom,TTC,women,health
**Promotional text (≤170):** No account. No cloud. No ads. Your cycle data stays on your iPhone. New in 1.1: discreet mode with neutral reminders and a plain calendar icon.
**What's New:**
- Discreet mode now uses neutral reminder text ("Time to check in") and can switch to a plain calendar app icon.
- Better VoiceOver labels on calendar days and on flow, mood and symptom buttons.
- Small fixes. As always: no account, no cloud, no ads, no tracking.

## AR (ar-SA)
**Subtitle:** دورتك وتبويضك بخصوصية تامة
**Keywords:** الحيض,الطمث,الخصوبة,حمل,تكيس المبايض,حبوب منع الحمل,أعراض,نساء,تقويم,سن اليأس,خاص
**Promotional text:** بلا حساب. بلا سحابة. بلا إعلانات. بيانات دورتك تبقى على هاتفك. جديد: الوضع الخفي بتذكيرات محايدة وأيقونة تقويم بسيطة.
**What's New:**
- الوضع الخفي يستخدم الآن تذكيرات محايدة ("حان وقت المتابعة") ويمكنه التبديل إلى أيقونة تقويم بسيطة.
- تسميات أوضح لـ VoiceOver على أيام التقويم وأزرار الغزارة والمزاج والأعراض.
- إصلاحات صغيرة. وكما هو دائماً: بلا حساب، بلا سحابة، بلا إعلانات، بلا تتبع.

## ES (es-ES and es-MX)
**Subtitle:** Ciclo y ovulación en privado
**Keywords:** regla,periodo,fértil,SOP,PCOS,píldora,embarazo,síntomas,mujer,SPM,anticonceptivo,menopausia
**Promotional text:** Sin cuenta. Sin nube. Sin anuncios. Tus datos del ciclo se quedan en tu iPhone. Nuevo: modo discreto con recordatorios neutros e icono de calendario.
**What's New:**
- El modo discreto usa recordatorios neutros («Hora de revisar») y puede cambiar a un icono de calendario neutro.
- Mejores etiquetas de VoiceOver en los días del calendario y en los botones de flujo, ánimo y síntomas.
- Pequeñas mejoras. Como siempre: sin cuenta, sin nube, sin anuncios, sin rastreo.

## FR (fr-FR)
**Subtitle:** Cycle et ovulation en privé
**Keywords:** menstruation,fertilité,SOPK,pilule,grossesse,symptômes,femme,calendrier,SPM,période,ménopause
**Promotional text:** Sans compte. Sans cloud. Sans pub. Vos données de cycle restent sur votre iPhone. Nouveau : mode discret avec rappels neutres et icône calendrier.
**What's New:**
- Le mode discret utilise des rappels neutres (« C’est l’heure de faire le point ») et peut passer à une icône calendrier neutre.
- Meilleures étiquettes VoiceOver sur les jours du calendrier et les boutons flux, humeur et symptômes.
- Petites corrections. Comme toujours : sans compte, sans cloud, sans pub, sans pistage.

## PT (pt-BR)
**Subtitle:** Ciclo e ovulação privados
**Keywords:** menstruação,fértil,SOP,pílula,gravidez,sintomas,mulher,TPM,diário,menopausa,período,fertilidade
**Promotional text:** Sem conta. Sem nuvem. Sem anúncios. Seus dados do ciclo ficam no seu iPhone. Novo: modo discreto com lembretes neutros e ícone de calendário.
**What's New:**
- O modo discreto usa lembretes neutros ("Hora de conferir") e pode trocar para um ícone de calendário neutro.
- Rótulos de VoiceOver melhores nos dias do calendário e nos botões de fluxo, humor e sintomas.
- Pequenas correções. Como sempre: sem conta, sem nuvem, sem anúncios, sem rastreamento.

## Screenshots (new slot 1; slots 2–5 unchanged from store/)
EN + AR, all 4 iPhone sizes already used: store/v1.1/{6.7,6.5,6.3,6.1}in_{en,ar}_1.png (1290×2796, 1284×2778, 1206×2622, 1179×2556). Regenerate: `node store/v1.1/shot1.mjs`.
ES/FR/PT have no localized screenshots → App Store shows the EN set (same as today).

## Name-search note
Subtitle + keywords are only editable with a new version, so they ship with 1.1. Promotional text can be changed anytime without review.
