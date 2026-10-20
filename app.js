import { T, LANGS, RTL } from './i18n.js';
import { T2 } from './i18n2.js';
import { T3 } from './i18n3.js';
import * as SH from './share.js';
import QR from './vendor/qrcode.js';
import * as db from './db.js';
import { predict, dayKind, dn, ds, todayStr, range, phaseOf } from './cycle.js';
import { SUPPORTER_URL, SUPPORTER_CODE_HASH } from './config.js';
import * as N from './native.js';

const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)], app = $('#app');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const sha = async s => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)))].map(b => b.toString(16).padStart(2, '0')).join('');
const DEF = { lang: '', cycleLen: 28, periodLen: 5, accepted: false, mode: '', supporter: '', theme: 'rose', pinHash: '', pinSalt: '', lmp: '',
  pill: { on: false, time: '21:00' }, rem: { period: true, pill: true, fertile: false, time: '09:00' }, discreet: false, bio: false, health: false, healthPushed: {}, share: null };
const MODES = ['track', 'bc', 'pcos', 'ttc', 'preg', 'peri'], MODE_ICON = { track: '🌸', bc: '💊', pcos: '🌀', ttc: '🌱', preg: '🤰', peri: '🌙' };
const BASE_SYM = ['cramps', 'headache', 'bloating', 'breasts', 'backPain', 'acne', 'tired', 'cravings', 'nausea', 'insomnia', 'spotting'];
const MOODS = ['happy', 'calm', 'energetic', 'sad', 'anxious', 'irritable'];
let S = { periods: [], days: {}, settings: structuredClone(DEF) }, unlocked = false, lang = 'en', calMonth = null, obStep = 0;

const detect = () => { const q = new URLSearchParams(location.search).get('lang'); if (q && LANGS[q]) return q;
  if (S.settings.lang && LANGS[S.settings.lang]) return S.settings.lang;
  for (const l of navigator.languages || [navigator.language]) { const p = (l || '').slice(0, 2).toLowerCase(); if (LANGS[p]) return p; } return 'en'; };
const arDays = n => n >= 3 && n <= 10 ? 'أيام' : 'يومًا';
const t = (k, n, x = {}) => { let s = T3[lang]?.[k] ?? T2[lang]?.[k] ?? T[lang]?.[k] ?? T3.en[k] ?? T2.en[k] ?? T.en[k] ?? k; if (lang === 'ar' && typeof n === 'number') s = s.replace(/(^|\s)يوم(?=\s|$)/u, (m0, a) => a + arDays(n));
  s = s.replace('{n}', n); for (const [a, b] of Object.entries(x)) s = s.replace(`{${a}}`, b); return s; };
const loc = () => lang + '-u-nu-latn';
const fmt = (n, o = { day: 'numeric', month: 'short' }) => new Intl.DateTimeFormat(loc(), { timeZone: 'UTC', ...o }).format(new Date(n * 864e5));
const M = () => S.settings.mode || 'track', name = () => S.settings.discreet ? t('discreetName') : t('appName');
const save = async () => { await db.set('state', S); syncReminders(); syncWidget(); healthPush(); };
const toast = m => { const el = $('#toast'); el.textContent = m; el.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => el.hidden = true, 2200); };
const isSup = () => S.settings.supporter === SUPPORTER_CODE_HASH || S.settings.supporter === 'iap';
const chips = (id, list, on, multi = true) => `<div class="chips" id="${id}" data-multi="${multi ? 1 : 0}">${list.map(v => `<button class="chip ${(multi ? on.includes(v) : on === v) ? 'on' : ''}" data-v="${v}">${t(v)}</button>`).join('')}</div>`;

function applyLang() { lang = detect(); const h = document.documentElement; h.lang = lang; h.dir = RTL.includes(lang) ? 'rtl' : 'ltr';
  document.title = name(); document.body.dataset.theme = isSup() ? S.settings.theme : 'rose'; }

function nav(cur) { const tabs = [['today', '◉'], ['calendar', '▦'], ['insights', '≋'], ['settings', '⚙']];
  return `<nav class="tabs">${tabs.map(([k, i]) => `<a href="#/${k}" class="${cur === k ? 'on' : ''}" data-tab="${k}"><span class="ti" aria-hidden="true">${i}</span>${t(k)}</a>`).join('')}</nav>`; }
const shell = (cur, body) => { app.innerHTML = `<header><div class="brand">${S.settings.discreet ? '<span class="dot">▦</span>' : '<img src="icons/icon-192.png" alt="" class="logo">'}<h1>${esc(name())}</h1></div>
  <p class="tag">${t('notMedical')}</p></header><main id="main">${body}</main>${nav(cur)}`; };

// ---------- reminders (native only) ----------
function syncReminders() { if (!N.isNative || !S.settings.accepted) return; const st = S.settings, r = st.rem, pr = predict(S.periods, st), out = [];
  const [h, m] = r.time.split(':').map(Number), at = n => new Date(Date.UTC(1970, 0, 1) + n * 864e5 + (h * 60 + m) * 6e4 + new Date().getTimezoneOffset() * 6e4);
  const T_ = k => st.discreet ? t('remDiscreet') : t(k), title = st.discreet ? t('remDiscreet') : t('remTitle');
  if (!pr.none && M() !== 'preg') { if (r.period) out.push({ id: 1, title, body: T_('r_period'), at: at(pr.next - 2) });
    if (r.fertile && !['bc', 'peri'].includes(M())) { const f = pr.future.find(f => f.fs > dn(todayStr())); if (f) out.push({ id: 2, title, body: T_('r_fertile'), at: at(f.fs) }); } }
  if (st.pill.on && r.pill) { const [ph, pm] = st.pill.time.split(':').map(Number); out.push({ id: 3, title, body: T_('r_pill'), daily: { hour: ph, minute: pm } }); }
  N.scheduleReminders(out); }

// ---------- onboarding ----------
function onboarding() {
  if (obStep === 0) { app.innerHTML = `<main class="center"><div class="card clay ob"><img class="hero-art" src="icons/onboarding.png" alt="">
    <h1 class="title">${t('appName')}</h1><p class="lead">${t('welcome')}</p><label class="row">${t('language')} ${langSelect()}</label>
    <h2>${t('disclaimerTitle')}</h2><p class="warn" id="disc">${t('disclaimer')}</p><details><summary>${t('privacyTitle')}</summary><p>${t('privacy')}</p></details>
    <button class="btn primary big" id="accept">${t('accept')}</button></div></main>`;
    bindLang(); $('#accept').onclick = () => { obStep = 1; onboarding(); }; return; }
  app.innerHTML = `<main class="center"><div class="card clay ob"><h2>${t('goal')}</h2><div class="modes">${MODES.map(m => `<button class="mode clay-btn ${M() === m && S.settings.mode ? 'on' : ''}" data-m="${m}"><span class="mi">${MODE_ICON[m]}</span>${t('m_' + m)}</button>`).join('')}</div>
    <label id="lmpw" ${M() === 'preg' && S.settings.mode ? '' : 'hidden'}>${t('lmp')}<input type="date" id="lmp" max="${todayStr()}" value="${S.settings.lmp}"></label>
    <button class="btn primary big" id="go" ${S.settings.mode ? '' : 'disabled'}>${t('continue')}</button></div></main>`;
  $$('.mode').forEach(b => b.onclick = () => { S.settings.mode = b.dataset.m; if (b.dataset.m === 'bc') S.settings.pill.on = true; $$('.mode').forEach(x => x.classList.toggle('on', x === b)); $('#lmpw').hidden = b.dataset.m !== 'preg'; $('#go').disabled = false; });
  $('#go').onclick = async () => { S.settings.lmp = $('#lmp').value || S.settings.lmp; S.settings.accepted = true; await save(); location.hash = '#/today'; route(); }; }

async function lock() { app.innerHTML = `<main class="center"><div class="card clay"><img class="hero-art small" src="icons/icon-192.png" alt=""><h1>${esc(name())}</h1><label>${t('enterPin')}<input id="pin" type="password" inputmode="numeric" autocomplete="off" maxlength="8"></label>
  <p class="err" id="perr"></p><button class="btn primary" id="unl">${t('unlock')}</button> ${S.settings.bio && N.isNative ? `<button class="btn" id="bio">${t('faceid')}</button>` : ''}</div></main>`;
  const go = async () => { if (await sha(S.settings.pinSalt + $('#pin').value) === S.settings.pinHash) { unlocked = true; route(); } else { $('#perr').textContent = t('wrongPin'); $('#pin').value = ''; } };
  const bio = async () => { if (await N.bioVerify(t('unlock'))) { unlocked = true; route(); } };
  $('#unl').onclick = go; $('#pin').onkeydown = e => e.key === 'Enter' && go(); if ($('#bio')) { $('#bio').onclick = bio; bio(); } else $('#pin').focus(); }

// ---------- today ----------
function pillCard() { const st = S.settings; if (!st.pill.on) return ''; const td = todayStr(), took = !!S.days[td]?.pill; let k = 0, n = dn(td) - (took ? 0 : 1);
  while (S.days[ds(n)]?.pill) { k++; n--; }
  return `<div class="card clay pill"><div><small>${t('pill')}</small><b>${took ? t('pillTaken') : t('pillToday')}</b>${k ? `<span>${t('pillStreak', k)}</span>` : ''}</div>
   <button class="btn ${took ? '' : 'primary'} round" id="pillbtn" aria-pressed="${took}" aria-label="${t('pillToday')}">${took ? '✓' : '💊'}</button></div>`; }

function today() { const st = S.settings, m = M(), td = todayStr(); let body = '';
  if (m === 'preg') { if (!st.lmp) body = `<section class="hero"><img class="hero-art" src="icons/empty.png" alt=""><label>${t('lmp')}<input type="date" id="lmp" max="${td}"></label></section>`;
    else { const days = dn(td) - dn(st.lmp), wk = Math.floor(days / 7) + 1, due = dn(st.lmp) + 280, tri = wk <= 13 ? 1 : wk <= 27 ? 2 : 3;
      body = `<section class="hero"><div class="ring clay"><b>${Math.min(wk, 42)}</b></div><h2 id="big">${t('week', Math.min(wk, 42))} · ${t('trimester', tri)}</h2></section>
       <div class="grid"><div class="card clay stat"><small>${t('dueDate')}</small><b id="next">${fmt(due, { day: 'numeric', month: 'long', year: 'numeric' })}</b><span>${t('daysLeft', Math.max(0, due - dn(td)))}</span></div></div>`; }
    shell('today', body + pillCard() + `<p class="note">${t('disclaimer')}</p>`); bindPill();
    if ($('#lmp')) $('#lmp').onchange = async e => { st.lmp = e.target.value; await save(); today(); }; return; }
  const pr = predict(S.periods, st);
  if (pr.none) body = `<section class="hero empty"><img class="hero-art" src="icons/empty.png" alt=""><h2>${t('emptyTitle')}</h2><p>${t('emptyText')}</p></section>`;
  else { const big = pr.onPeriod ? t('onPeriod', pr.periodDay) : t('dayOfCycle', pr.cycleDay), irr = ['pcos', 'peri'].includes(m), rg = range(pr);
    let nx = pr.daysTo > 0 ? t('inDays', pr.daysTo) : pr.daysTo === 0 ? t('isToday') : (m === 'bc' || irr ? '' : t('late', -pr.daysTo));
    const nextTxt = irr ? t('range', 0, { a: fmt(rg.a), b: fmt(rg.b) }) : fmt(pr.next);
    const f = pr.future.find(f => f.fe >= dn(td)) || pr.future[0];
    const fert = m === 'bc' || m === 'peri' ? '' : `<div class="card clay stat fert ${m === 'ttc' ? 'feature' : ''}"><small>${t('fertile')}</small><b>${fmt(f.fs)} – ${fmt(f.fe)}</b><span>${t('ovulation')}: ${fmt(f.ov)}</span></div>`;
    const nextCard = `<div class="card clay stat"><small>${t('nextPeriod')}</small><b id="next">${nextTxt}</b><span>${nx}</span></div>`;
    body = `<section class="hero ${pr.onPeriod ? 'onp' : ''}"><div class="ring clay"><svg viewBox="0 0 100 100" class="arc"><circle cx="50" cy="50" r="44" pathLength="100" stroke-dasharray="${Math.min(100, pr.cycleDay / pr.cycleLen * 100)} 100"/></svg><b>${pr.onPeriod ? pr.periodDay : pr.cycleDay}</b></div><h2 id="big">${big}</h2></section>
      <div class="grid">${m === 'ttc' ? fert + nextCard : nextCard + fert}</div>${irr ? `<p class="hint">${t('irregNote')}</p>` : ''}${m === 'bc' ? `<p class="hint">${t('bcNote')}</p>` : ''}`; }
  const open = !pr.none && pr.open;
  body += pillCard() + `<button class="btn primary big" id="mark">${open ? t('endToday') : t('startToday')}</button><p class="note">${t('disclaimer')}</p>`;
  shell('today', body); bindPill();
  $('#mark').onclick = async () => { if (open) pr.last.end = td; else if (!S.periods.some(p => p.start === td)) S.periods.push({ start: td, end: null }); await save(); toast(t('saved')); today(); }; }
const bindPill = () => { if (!$('#pillbtn')) return; $('#pillbtn').onclick = async () => { const td = todayStr(), r = S.days[td] || { flow: '', sym: [], note: '' }; r.pill = !r.pill; S.days[td] = r; await save(); route(); }; };

// ---------- calendar ----------
function calendar() { const td = todayStr(); if (!calMonth) calMonth = td.slice(0, 7); const m = M();
  const [y, mo] = calMonth.split('-').map(Number), first = Date.UTC(y, mo - 1, 1) / 864e5, dim = new Date(Date.UTC(y, mo, 0)).getUTCDate();
  const wkStart = (new Intl.Locale(lang).weekInfo?.firstDay ?? (['ar', 'ur'].includes(lang) ? 6 : 1)) % 7;
  const lead = (new Date(first * 864e5).getUTCDay() - wkStart + 7) % 7, pr = predict(S.periods, S.settings, td, 12);
  const wd = [...Array(7)].map((_, i) => fmt(3 + wkStart + i, { weekday: ['ar', 'ur'].includes(lang) ? 'short' : 'narrow' })); // day 3 = Sun 1970-01-04
  const hideF = m === 'bc' || m === 'peri' || m === 'preg';
  let cells = '<div></div>'.repeat(lead);
  for (let d = 1; d <= dim; d++) { const s = ds(first + d - 1); let k = dayKind(s, S.periods, pr); if (hideF && (k === 'fertile' || k === 'ovulation')) k = ''; if (m === 'preg' && k === 'predicted') k = '';
    const has = S.days[s] && (S.days[s].flow || S.days[s].sym?.length || S.days[s].note || S.days[s].mood?.length) ? ' has' : '', pill = S.days[s]?.pill ? ' pilled' : '';
    cells += `<button class="day ${k}${s === td ? ' now' : ''}${has}${pill}" data-d="${s}" aria-label="${fmt(first + d - 1, { dateStyle: 'full' })} ${k ? t('legend' + { period: 'Period', predicted: 'Predicted', fertile: 'Fertile', ovulation: 'Ovulation' }[k]) : ''}">${d}</button>`; }
  shell('calendar', `<div class="card clay"><div class="calhead"><button class="btn icon" id="prev" aria-label="prev">‹</button><h2>${fmt(first, { month: 'long', year: 'numeric' })}</h2><button class="btn icon" id="nextm" aria-label="next">›</button></div>
   <div class="cal"><div class="wd">${wd.map(w => `<span>${w}</span>`).join('')}</div><div class="days">${cells}</div></div>
   <div class="legend"><span class="k period"></span>${t('legendPeriod')}<span class="k predicted"></span>${t('legendPredicted')}${hideF ? '' : `<span class="k fertile"></span>${t('legendFertile')}<span class="k ovulation"></span>${t('legendOvulation')}`}</div></div><div id="sheet"></div>`);
  const mv = k => { const d = new Date(Date.UTC(y, mo - 1 + k, 1)); calMonth = d.toISOString().slice(0, 7); calendar(); };
  $('#prev').onclick = () => mv(-1); $('#nextm').onclick = () => mv(1); if (document.documentElement.dir === 'rtl') { $('#prev').textContent = '›'; $('#nextm').textContent = '‹'; }
  $$('.day').forEach(b => b.onclick = () => sheet(b.dataset.d)); }

function symList() { const m = M(); return [...BASE_SYM, ...(m === 'pcos' ? ['hairGrowth', 'hairLoss', 'weight'] : []), ...(m === 'peri' ? ['hotFlash', 'nightSweat', 'weight'] : [])]; }
function sheet(d) { const td = todayStr(), fut = dn(d) > dn(td), m = M(), rec = { flow: '', sym: [], mood: [], note: '', ...(S.days[d] || {}) };
  const inP = S.periods.find(p => dn(d) >= dn(p.start) && dn(d) <= (p.end ? dn(p.end) : dn(p.start) + 9)), isStart = S.periods.find(p => p.start === d);
  $('#sheet').innerHTML = `<div class="card clay sheet"><h3>${fmt(dn(d), { dateStyle: 'full' })}</h3>${fut ? '' : `<div class="actions">
   ${isStart ? `<button class="btn danger" id="rm">${t('removePeriod')}</button>` : `<button class="btn" id="st">${t('startOn')}</button>`}
   ${inP && !isStart ? `<button class="btn" id="en">${t('endOn')}</button>` : ''}</div>
   <h4>${t('flow')}</h4>${chips('flow', ['none', 'light', 'medium', 'heavy'], rec.flow, false)}
   <h4>${t('mood_')}</h4>${chips('mood', MOODS, rec.mood)}
   <h4>${t('symptoms')}</h4>${chips('sym', symList(), rec.sym)}
   ${m === 'ttc' ? `<h4>${t('ovTest')}</h4>${chips('ovt', ['pos', 'neg'], rec.ovt || '', false)}<div class="actions"><label>${t('bbt')} <input id="bbt" type="number" step="0.01" min="34" max="40" value="${esc(rec.bbt || '')}" inputmode="decimal"></label>${chips('sexc', ['sex'], rec.sex ? ['sex'] : [])}</div>` : ''}
   ${S.settings.pill.on ? chips('pillc', ['pill'], rec.pill ? ['pill'] : []) : ''}
   <label>${t('notes')}<textarea id="note" rows="2" maxlength="500">${esc(rec.note)}</textarea></label><button class="btn primary" id="sv">${t('save')}</button>`}</div>`;
  if (fut) return; $('#sheet').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  $$('#sheet .chips').forEach(c => c.onclick = e => { const v = e.target.dataset.v; if (!v) return; if (c.dataset.multi === '1') e.target.classList.toggle('on'); else c.querySelectorAll('.chip').forEach(x => x.classList.toggle('on', x === e.target && !x.classList.contains('on'))); });
  const sel = id => $$(`#${id} .chip.on`).map(c => c.dataset.v);
  $('#sv').onclick = async () => { const r = { flow: sel('flow')[0] || '', sym: sel('sym'), mood: sel('mood'), note: $('#note').value };
    if ($('#ovt')) { r.ovt = sel('ovt')[0] || ''; r.bbt = $('#bbt').value; r.sex = sel('sexc').length > 0; } if ($('#pillc')) r.pill = sel('pillc').length > 0; else if (rec.pill) r.pill = true;
    if (r.flow || r.sym.length || r.mood.length || r.note || r.pill || r.ovt || r.bbt || r.sex) S.days[d] = r; else delete S.days[d]; await save(); toast(t('saved')); calendar(); };
  if ($('#st')) $('#st').onclick = async () => { S.periods.push({ start: d, end: null }); S.periods.sort((a, b) => dn(a.start) - dn(b.start));
    const i = S.periods.findIndex(p => p.start === d), nx = S.periods[i + 1]; if (nx && dn(nx.start) - dn(d) < 10) S.periods.splice(i + 1, 1); await save(); calendar(); };
  if ($('#rm')) $('#rm').onclick = async () => { S.periods = S.periods.filter(p => p.start !== d); await save(); calendar(); };
  if ($('#en')) $('#en').onclick = async () => { inP.end = d; await save(); calendar(); }; }

// ---------- insights & patterns ----------
function patterns(pr) { const by = { men: {}, fol: {}, ov: {}, lut: {} };
  for (const [d, r] of Object.entries(S.days)) { const ph = phaseOf(d, S.periods, pr); if (!ph) continue; for (const s of [...(r.sym || []), ...(r.mood || [])]) by[ph][s] = (by[ph][s] || 0) + 1; }
  const rows = Object.entries(by).map(([ph, o]) => [ph, Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, 3)]).filter(([, l]) => l.length);
  return rows.length ? `<div class="phases">${rows.map(([ph, l]) => `<div class="card clay phase ph-${ph}"><small>${t('ph_' + ph)}</small>${l.map(([s, c]) => `<span class="chip on sm">${t(s)} ×${c}</span>`).join('')}</div>`).join('')}</div>` : `<p class="muted">${t('patternsEmpty')}</p>`; }
function historyRows() { const p = [...S.periods].sort((a, b) => dn(b.start) - dn(a.start));
  return p.map((x, i) => { const nx = p[i - 1], len = x.end ? dn(x.end) - dn(x.start) + 1 : null, cyc = nx ? dn(nx.start) - dn(x.start) : null;
    return `<li><b>${fmt(dn(x.start), { day: 'numeric', month: 'short', year: 'numeric' })}</b><span>${len ? t('days', len) : '…'}</span><span class="muted">${cyc ? '↻ ' + t('days', cyc) : ''}</span></li>`; }).join(''); }
function insights() { const pr = predict(S.periods, S.settings), rows = historyRows();
  shell('insights', `<div class="grid"><div class="card clay stat"><small>${t('avgCycle')}</small><b>${t('days', pr.cycleLen)}</b></div><div class="card clay stat"><small>${t('avgPeriod')}</small><b>${t('days', pr.periodLen)}</b></div>
   <div class="card clay stat"><small>${t('cycles')}</small><b>${pr.logged}</b></div></div>
   <h2>${t('patterns')}</h2>${patterns(pr)}
   <a class="btn primary big" href="#/report" id="rep">📄 ${t('makeReport')}</a><a class="btn big" href="#/share" id="shr">💞 ${t('share')}</a>
   <h2>${t('history')}</h2>${rows ? `<ul class="hist">${rows}</ul>` : `<p class="muted">${t('noHistory')}</p>`}`); }

function reportHtml() { const pr = predict(S.periods, S.settings), cnt = {}; let pills = 0;
  for (const r of Object.values(S.days)) { for (const s of [...(r.sym || []), ...(r.mood || [])]) cnt[s] = (cnt[s] || 0) + 1; if (r.pill) pills++; }
  const top = Object.entries(cnt).sort((a, b) => b[1] - a[1]).slice(0, 8);
  return `<article class="report" dir="${document.documentElement.dir}" lang="${lang}"><h1>${t('reportTitle')}</h1><p class="muted">${t('generated', fmt(dn(todayStr()), { dateStyle: 'long' }))} · ${t('mode')}: ${t('m_' + M())}</p>
   <table><tr><th>${t('avgCycle')}</th><td>${t('days', pr.cycleLen)}</td></tr><tr><th>${t('avgPeriod')}</th><td>${t('days', pr.periodLen)}</td></tr><tr><th>${t('cycles')}</th><td>${pr.logged}</td></tr>${S.settings.pill.on ? `<tr><th>${t('pillsTaken')}</th><td>${pills}</td></tr>` : ''}</table>
   <h2>${t('history')}</h2><ul class="hist">${historyRows() || `<li>${t('noHistory')}</li>`}</ul>
   <h2>${t('topSymptoms')}</h2><ul>${top.map(([s, c]) => `<li>${t(s)}: ${c}</li>`).join('') || '<li>—</li>'}</ul><p class="note">${t('notMedical')}</p></article>`; }
function report() { app.innerHTML = `<main class="print-wrap">${reportHtml()}<div class="actions noprint"><button class="btn primary" id="pr">${t('print')}</button><a class="btn" href="#/insights">‹ ${t('insights')}</a></div></main>`;
  $('#pr').onclick = async () => { if (N.isNative) { const css = await (await fetch('style.css')).text(); await N.shareHtml('cycle-report.html', `<!doctype html><meta charset="utf-8"><style>${css}</style>${reportHtml()}`); } else print(); }; }

// ---------- settings ----------
const langSelect = () => `<select id="lang" aria-label="language">${Object.entries(LANGS).map(([k, v]) => `<option value="${k}" ${k === lang ? 'selected' : ''}>${v}</option>`).join('')}</select>`;
const bindLang = () => $('#lang').onchange = async e => { S.settings.lang = e.target.value; const u = new URL(location); u.searchParams.delete('lang'); history.replaceState(null, '', u); await db.set('state', S); applyLang(); route(); };
const tog = (id, on, label) => `<label class="row switch">${label}<input type="checkbox" id="${id}" ${on ? 'checked' : ''}><span class="sw"></span></label>`;

async function settings() { const st = S.settings, sup = isSup(), bioOk = await N.bioAvailable();
  const supBlock = sup ? `<label class="row">${t('theme')}<select id="theme">${['rose', 'lavender', 'teal', 'dark'].map(x => `<option ${x === st.theme ? 'selected' : ''}>${x}</option>`).join('')}</select></label>`
    : N.isNative ? `<button class="btn primary" id="iap">${t('buyIap', '$2.99')}</button> <button class="btn" id="restore">${t('restore')}</button>`
    : `${SUPPORTER_URL ? `<a class="btn primary" href="${SUPPORTER_URL}" target="_blank" rel="noopener">${t('buy')}</a>` : `<button class="btn" disabled>${t('buy')} · ${t('soon')}</button>`}
       <div class="actions"><input id="code" placeholder="${t('enterCode')}" aria-label="${t('enterCode')}" autocomplete="off"><button class="btn" id="redeem">OK</button></div><p id="cmsg"></p>`;
  shell('settings', `<div class="card clay"><label class="row">${t('language')} ${langSelect()}</label>
   <label class="row">${t('mode')}<select id="mode">${MODES.map(m => `<option value="${m}" ${m === M() ? 'selected' : ''}>${MODE_ICON[m]} ${t('m_' + m)}</option>`).join('')}</select></label>
   ${M() === 'preg' ? `<label class="row">${t('lmp')}<input type="date" id="lmp" value="${st.lmp}" max="${todayStr()}"></label>` : ''}
   <label class="row">${t('cycleLen')}<input id="cl" type="number" min="20" max="45" value="${st.cycleLen}"></label>
   <label class="row">${t('periodLen')}<input id="pl" type="number" min="2" max="10" value="${st.periodLen}"></label></div>
   <div class="card clay"><h3>${t('pill')}</h3>${tog('pillon', st.pill.on, t('m_bc'))}${st.pill.on ? `<label class="row">${t('r_time')}<input type="time" id="pilltime" value="${st.pill.time}"></label>` : ''}</div>
   <div class="card clay"><h3>${t('reminders')}</h3>${N.isNative ? '' : `<p class="muted" id="remweb">${t('remWeb')}</p>`}
    ${tog('r_period', st.rem.period, t('r_period'))}${st.pill.on ? tog('r_pill', st.rem.pill, t('r_pill')) : ''}${['bc', 'peri', 'preg'].includes(M()) ? '' : tog('r_fertile', st.rem.fertile, t('r_fertile'))}
    <label class="row">${t('r_time')}<input type="time" id="remtime" value="${st.rem.time}"></label></div>
   <div class="card clay"><h3>${t('pin')}</h3><p class="muted">${t('pinNote')}</p>${st.pinHash ? `<button class="btn" id="rmpin">${t('removePin')}</button>${bioOk ? tog('bio', st.bio, t('faceid')) : ''}` :
    `<div class="actions"><input id="np" type="password" inputmode="numeric" maxlength="8" placeholder="${t('newPin')}" aria-label="${t('newPin')}"><button class="btn" id="setpin">${t('setPin')}</button></div>`}
    ${tog('discreet', st.discreet, t('discreet'))}<p class="muted">${t('discreetNote')}</p></div>
   <div class="card clay" id="healthcard"><h3>❤️ ${t('health')}</h3><p class="muted">${t('healthNote')}</p>${N.platform === 'ios' ? `${tog('hk', st.health, t('healthOn'))}${st.health ? `<button class="btn" id="hkimp">${t('healthImport')}</button>` : ''}` : `<p class="muted"><i>${t('healthWeb')}</i></p>`}</div>
   <div class="card clay"><h3>${t('share')}</h3><p class="muted">${t('shareIntro')}</p><a class="btn" href="#/share">💞 ${t('share')}</a></div>
   <div class="card clay"><h3>${t('widget')}</h3><p class="muted">${t('widgetNote')}</p></div>
   <div class="card clay"><h3>${t('backup')}</h3><p class="muted">${t('privacy')}</p><div class="actions"><button class="btn" id="exp">${t('exportData')}</button>
    <label class="btn">${t('importData')}<input id="imp" type="file" accept="application/json,.json" hidden></label></div><button class="btn danger" id="del">${t('deleteAll')}</button></div>
   <div class="card clay" id="supcard"><h3>${t('supporter')} ${sup ? '★' : ''}</h3><p>${t('supporterText')}</p>${supBlock}</div>
   <div class="card clay"><h3>${t('about')}</h3><p class="warn">${t('disclaimer')}</p><p class="muted">${t('widgetSoon')}</p><p class="muted"><a href="privacy.html">${t('privacyTitle')}</a> · v2.0</p></div>`);
  bindLang(); const sv = async () => { await save(); toast(t('saved')); };
  $('#mode').onchange = async e => { st.mode = e.target.value; if (st.mode === 'bc') st.pill.on = true; await sv(); settings(); };
  if ($('#lmp')) $('#lmp').onchange = async e => { st.lmp = e.target.value; await sv(); };
  $('#cl').onchange = async e => { st.cycleLen = Math.min(45, Math.max(20, +e.target.value || 28)); await sv(); };
  $('#pl').onchange = async e => { st.periodLen = Math.min(10, Math.max(2, +e.target.value || 5)); await sv(); };
  $('#pillon').onchange = async e => { st.pill.on = e.target.checked; await sv(); settings(); };
  if ($('#pilltime')) $('#pilltime').onchange = async e => { st.pill.time = e.target.value || '21:00'; await sv(); };
  for (const k of ['period', 'pill', 'fertile']) if ($('#r_' + k)) $('#r_' + k).onchange = async e => { st.rem[k] = e.target.checked; await sv(); };
  $('#remtime').onchange = async e => { st.rem.time = e.target.value || '09:00'; await sv(); };
  $('#discreet').onchange = async e => { st.discreet = e.target.checked; await sv(); applyLang(); settings(); };
  if ($('#hk')) $('#hk').onchange = async e => { if (e.target.checked && !(await N.healthAuth())) { e.target.checked = false; return toast(t('healthDenied')); } st.health = e.target.checked; st.healthPushed = {}; await sv(); settings(); };
  if ($('#hkimp')) $('#hkimp').onclick = async () => { const n = await healthImport(); toast(t('healthImported', n)); };
  if ($('#bio')) $('#bio').onchange = async e => { st.bio = e.target.checked; await sv(); };
  if ($('#setpin')) $('#setpin').onclick = async () => { const v = $('#np').value; if (!/^\d{4,8}$/.test(v)) return toast(t('newPin'));
    st.pinSalt = [...crypto.getRandomValues(new Uint8Array(8))].map(b => b.toString(16)).join(''); st.pinHash = await sha(st.pinSalt + v); unlocked = true; await sv(); settings(); };
  if ($('#rmpin')) $('#rmpin').onclick = async () => { st.pinHash = st.pinSalt = ''; st.bio = false; await sv(); settings(); };
  $('#exp').onclick = async () => { const json = JSON.stringify({ app: 'cycleclear', v: 2, periods: S.periods, days: S.days, settings: { cycleLen: st.cycleLen, periodLen: st.periodLen, mode: st.mode, lmp: st.lmp, pill: st.pill } }, null, 1), fn = `cycleclear-backup-${todayStr()}.json`;
    if (N.isNative) return N.shareHtml(fn, json); const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([json], { type: 'application/json' })); a.download = fn; a.click(); };
  $('#imp').onchange = async e => { try { const j = JSON.parse(await e.target.files[0].text()); if (j.app !== 'cycleclear' || !Array.isArray(j.periods)) throw 0;
    S.periods = j.periods.filter(p => /^\d{4}-\d\d-\d\d$/.test(p.start)); S.days = j.days || {}; const js = j.settings || {};
    for (const k of ['cycleLen', 'periodLen', 'mode', 'lmp']) if (js[k] !== undefined) st[k] = js[k]; if (js.pill) st.pill = { ...st.pill, ...js.pill };
    await save(); toast(t('imported')); settings(); } catch { toast(t('badFile')); } };
  $('#del').onclick = async () => { if (!confirm(t('confirmDelete'))) return; await db.clear(); S = { periods: [], days: {}, settings: structuredClone(DEF) }; obStep = 0; localStorage.clear(); location.hash = ''; applyLang(); route(); };
  if ($('#redeem')) $('#redeem').onclick = async () => { const h = await sha($('#code').value.trim().toUpperCase()); if (h === SUPPORTER_CODE_HASH) { st.supporter = h; await save(); applyLang(); toast(t('codeOk')); settings(); } else { $('#cmsg').className = 'err'; $('#cmsg').textContent = t('badCode'); } };
  if ($('#iap')) { N.iapPrice().then(p => p && ($('#iap').textContent = t('buyIap', p)));
    $('#iap').onclick = async () => { if (await N.iapBuy()) { st.supporter = 'iap'; await save(); applyLang(); toast(t('codeOk')); settings(); } };
    $('#restore').onclick = async () => { if (await N.iapRestore()) { st.supporter = 'iap'; await save(); applyLang(); toast(t('codeOk')); settings(); } }; }
  if ($('#theme')) $('#theme').onchange = async e => { st.theme = e.target.value; await save(); applyLang(); }; }

function route() { applyLang(); const pm = location.hash.match(/^#\/p\/(c1\.[\w-]+)/); if (pm) return partner(pm[1]); if (!S.settings.accepted) return onboarding(); if (S.settings.pinHash && !unlocked) return lock();
  const r = (location.hash.match(/#\/(\w+)/) || [])[1]; ({ calendar, insights, settings, report, share }[r] || today)(); window.scrollTo(0, 0); }

(async () => { try { const s = await db.get('state'); if (s) S = { ...S, ...s, settings: { ...structuredClone(DEF), ...s.settings, pill: { ...DEF.pill, ...s.settings?.pill }, rem: { ...DEF.rem, ...s.settings?.rem } } }; } catch (e) { console.warn(e); }
  addEventListener('hashchange', route); route(); syncReminders();
  if ('serviceWorker' in navigator && location.protocol === 'https:' && !N.isNative) navigator.serviceWorker.register('sw.js'); })();

// ---------- partner sharing (no server) ----------
function shareSnapshot(f) { const pr = predict(S.periods, S.settings, todayStr(), 3), out = { v: 1, at: todayStr(), exp: ds(dn(todayStr()) + 35), lang };
  if (pr.none) return out; if (f.next) out.next = pr.future.slice(0, 3).map(x => [ds(x.start), ds(x.end)]);
  if (f.fertile && !['bc', 'peri', 'preg'].includes(M())) out.fertile = pr.future.slice(0, 3).map(x => [ds(x.fs), ds(x.fe)]);
  if (f.phase) out.phase = phaseOf(todayStr(), S.periods, pr) || 'lut'; return out; }
const range2 = ([a, b]) => `${fmt(dn(a))} – ${fmt(dn(b))}`;
function snapshotHtml(o) { return `${o.phase ? `<p><b>${t('sh_phaseNow', t('ph_' + o.phase))}</b></p>` : ''}${o.next ? `<h4>${t('sh_next')}</h4><ul class="hist">${o.next.map(r => `<li>🌸 ${range2(r)}</li>`).join('')}</ul>` : ''}
  ${o.fertile ? `<h4>${t('sh_fertile')}</h4><ul class="hist">${o.fertile.map(r => `<li>🌱 ${range2(r)}</li>`).join('')}</ul>` : ''}<p class="muted">${t('sh_expires', fmt(dn(o.exp), { dateStyle: 'medium' }))} · ${t('notMedical')}</p>`; }
function snapshotText(o) { const L = [t('sh_from')]; if (o.phase) L.push(t('sh_phaseNow', t('ph_' + o.phase)));
  if (o.next) L.push(t('sh_next') + ':', ...o.next.map(r => '• ' + range2(r))); if (o.fertile) L.push(t('sh_fertile') + ':', ...o.fertile.map(r => '• ' + range2(r))); return L.join('\n'); }
function icsEvents(o, id) { const ev = []; const title = k => S.settings.discreet ? '●' : t(k);
  (o.next || []).forEach((r, i) => ev.push({ uid: `cc-${id}-p${i}@cycleclear`, start: r[0], endExcl: ds(dn(r[1]) + 1), title: title('legendPredicted') }));
  (o.fertile || []).forEach((r, i) => ev.push({ uid: `cc-${id}-f${i}@cycleclear`, start: r[0], endExcl: ds(dn(r[1]) + 1), title: title('sh_fertile') })); return ev; }
async function sendFile(name, text, type) { if (N.isNative) return N.shareHtml(name, text); const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name; a.click(); }
const shareBase = () => N.isNative ? 'https://barood-labs.github.io/cycle-clear/' : location.origin + location.pathname;

function share() { const st = S.settings, cur = st.share, hideF = ['bc', 'peri', 'preg'].includes(M());
  shell('insights', `<div class="card clay"><h2>💞 ${t('share')}</h2><p>${t('shareIntro')}</p>
   ${tog('f_next', true, t('sh_next'))}${hideF ? '' : tog('f_fertile', false, t('sh_fertile'))}${tog('f_phase', false, t('sh_phase'))}
   <div class="actions"><button class="btn" id="b_ics">📅 ${t('sh_ics')}</button><button class="btn" id="b_text">💬 ${t('sh_text')}</button><button class="btn primary" id="b_code">🔐 ${t('sh_code')}</button></div>
   <div id="codeout"></div></div>
   <div class="card clay" id="status"><h3>${t('sh_stop')}</h3>${cur ? `<p>${t('sh_active', fmt(dn(cur.at), { dateStyle: 'medium' }))} · ${cur.kinds.map(k => t('sh_' + k)).join(', ')}</p><p class="muted">${t('sh_stopNote', fmt(dn(cur.exp), { dateStyle: 'medium' }))}</p><button class="btn danger" id="b_stop">⛔ ${t('sh_stop')}</button>` : `<p class="muted" id="notsharing">${t('sh_none')}</p>`}</div>
   <a class="btn" href="#/insights">‹ ${t('insights')}</a>`);
  const fields = () => ({ next: $('#f_next').checked, fertile: !!$('#f_fertile')?.checked, phase: $('#f_phase').checked });
  const record = async (kind, o, id) => { const c = st.share || { id: id || crypto.randomUUID().slice(0, 8), kinds: [], uids: [] }; c.at = o.at; c.exp = o.exp; if (!c.kinds.includes(kind)) c.kinds.push(kind);
    if (kind === 'ics') c.uids = [...new Set([...c.uids, ...icsEvents(o, c.id).map(e => e.uid)])]; st.share = c; await db.set('state', S); return c; };
  const pick = () => { const f = fields(); if (!f.next && !f.fertile && !f.phase) { toast(t('sh_pick')); return null; } return shareSnapshot(f); };
  $('#b_ics').onclick = async () => { const o = pick(); if (!o) return; const c = await record('ics', o, st.share?.id); await sendFile('cycle-clear-shared.ics', SH.ics(icsEvents(o, c.id)), 'text/calendar'); share(); };
  $('#b_text').onclick = async () => { const o = pick(); if (!o) return; const txt = snapshotText(o); await record('text', o);
    if (navigator.share) { try { await navigator.share({ text: txt }); } catch { } } else { await navigator.clipboard?.writeText(txt).catch(() => { }); toast(t('sh_copied')); } share(); };
  $('#b_code').onclick = async () => { const o = pick(); if (!o) return; const pass = SH.newPass(), url = shareBase() + '#/p/' + await SH.seal(o, pass); await record('code', o);
    const qr = await QR.toDataURL(url, { margin: 1, width: 360, color: { dark: '#3a1b2b', light: '#ffffff' } }); share();
    $('#codeout').innerHTML = `<div class="card clay codebox"><img src="${qr}" alt="QR" class="qr"><p class="muted">${t('sh_codeNote')}</p><p>${t('sh_pass')}: <b class="pass" id="pass">${pass}</b></p>
      <input id="shareurl" readonly value="${esc(url)}" aria-label="link"><button class="btn" id="b_copy">${t('sh_copy')}</button></div>`;
    $('#b_copy').onclick = async () => { await navigator.clipboard?.writeText(url).catch(() => { }); toast(t('sh_copied')); }; };
  if ($('#b_stop')) $('#b_stop').onclick = async () => { const c = st.share; if (c.uids.length) await sendFile('cycle-clear-stop-sharing.ics', SH.ics(c.uids.map(uid => ({ uid, start: c.at, endExcl: ds(dn(c.at) + 1), title: '—' })), true), 'text/calendar');
    st.share = null; await db.set('state', S); toast(t('sh_stopped')); share(); }; }

function partner(payload) { app.innerHTML = `<main class="center"><div class="card clay"><img class="hero-art small" src="icons/icon-192.png" alt=""><h1>${t('partnerTitle')}</h1>
  <div id="pv"><label>${t('partnerEnter')}<input id="pp" autocomplete="off" autocapitalize="characters"></label><p class="err" id="perr"></p><button class="btn primary" id="po">${t('partnerOpen')}</button></div><p class="muted">${t('partnerNote')}</p></div></main>`;
  $('#po').onclick = async () => { try { const o = await SH.open(payload, $('#pp').value); if (dn(o.exp) < dn(todayStr())) { $('#perr').textContent = t('partnerExpired'); return; }
    $('#pv').innerHTML = snapshotHtml(o); } catch { $('#perr').textContent = t('partnerBad'); } }; }

// ---------- widget + Apple Health (native only) ----------
function syncWidget() { if (!N.isNative) return; const st = S.settings, pr = predict(S.periods, st), d = st.discreet;
  let big = '', line = ''; if (M() === 'preg' && st.lmp) { big = String(Math.floor((dn(todayStr()) - dn(st.lmp)) / 7) + 1); line = d ? '' : t('week', +big); }
  else if (!pr.none) { big = String(pr.onPeriod ? pr.periodDay : pr.cycleDay); line = d ? fmt(pr.next) : t('w_next', fmt(pr.next)); }
  N.widgetSet({ big, title: d ? t('w_day', big) : (pr.onPeriod ? t('onPeriod', +big) : t('w_day', big)), line, discreet: d, onPeriod: !d && !!pr.onPeriod, updated: Date.now() }); }
function flowDays() { const out = {}; for (const p of S.periods) { const s = dn(p.start), e = p.end ? dn(p.end) : Math.min(s + S.settings.periodLen - 1, dn(todayStr()));
  for (let n = s; n <= e; n++) out[ds(n)] = S.days[ds(n)]?.flow || 'medium'; } for (const [d, r] of Object.entries(S.days)) if (r.flow && r.flow !== 'none') out[d] = r.flow; return out; }
async function healthPush() { const st = S.settings; if (N.platform !== 'ios' || !st.health) return; const all = flowDays(), starts = new Set(S.periods.map(p => p.start)), todo = [];
  for (const [d, f] of Object.entries(all)) if (st.healthPushed[d] !== f) todo.push({ date: d, flow: f, start: starts.has(d) });
  if (!todo.length) return; if (await N.healthWrite(todo)) { for (const x of todo) st.healthPushed[x.date] = x.flow; await db.set('state', S); } }
async function healthImport() { const rows = await N.healthRead(dn(todayStr()) - 400); let n = 0; const st = S.settings;
  for (const r of rows.sort((a, b) => a.date < b.date ? -1 : 1)) { const inP = S.periods.some(p => dn(r.date) >= dn(p.start) && dn(r.date) <= (p.end ? dn(p.end) : dn(p.start) + 9));
    if (!inP) { const prev = S.periods.find(p => p.end && dn(r.date) - dn(p.end) === 1); if (prev) prev.end = r.date; else S.periods.push({ start: r.date, end: r.date }); }
    else { const p = S.periods.find(p => dn(r.date) >= dn(p.start) && dn(r.date) <= (p.end ? dn(p.end) : dn(p.start) + 9)); if (p.end && dn(r.date) > dn(p.end)) p.end = r.date; }
    S.days[r.date] = { flow: r.flow, sym: [], mood: [], note: '', ...(S.days[r.date] || {}), flow: S.days[r.date]?.flow || r.flow }; st.healthPushed[r.date] = S.days[r.date].flow; n++; }
  S.periods.sort((a, b) => dn(a.start) - dn(b.start)); await save(); return n; }
