import { T, LANGS, RTL } from './i18n.js';
import * as db from './db.js';
import { predict, dayKind, dn, ds, todayStr } from './cycle.js';
import { SUPPORTER_URL, SUPPORTER_PRICE, SUPPORTER_CODE_HASH } from './config.js';

const $ = s => document.querySelector(s), app = $('#app');
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const sha = async s => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)))].map(b => b.toString(16).padStart(2, '0')).join('');
const DEF = { lang: '', cycleLen: 28, periodLen: 5, accepted: false, supporter: '', theme: 'rose', pinHash: '', pinSalt: '' };
let S = { periods: [], days: {}, settings: { ...DEF } }, unlocked = false, lang = 'en', calMonth = null;

const detect = () => { const q = new URLSearchParams(location.search).get('lang'); if (q && LANGS[q]) return q;
  if (S.settings.lang && LANGS[S.settings.lang]) return S.settings.lang;
  for (const l of navigator.languages || [navigator.language]) { const p = (l || '').slice(0, 2).toLowerCase(); if (LANGS[p]) return p; } return 'en'; };
// Arabic number agreement: 3–10 أيام, else يومًا (1 and 2 rarely shown).
const arDays = n => n >= 3 && n <= 10 ? 'أيام' : 'يومًا';
const t = (k, n) => { let s = T[lang][k] ?? T.en[k]; if (lang === 'ar' && n !== undefined) s = s.replace('يوم', arDays(n)); return s.replace('{n}', n); };
const loc = () => lang + '-u-nu-latn';
const fmt = (n, o = { day: 'numeric', month: 'short' }) => new Intl.DateTimeFormat(loc(), { timeZone: 'UTC', ...o }).format(new Date(n * 864e5));
const save = async () => { await db.set('state', S); };
const toast = m => { const el = $('#toast'); el.textContent = m; el.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => el.hidden = true, 2200); };
const isSup = () => S.settings.supporter === SUPPORTER_CODE_HASH;

function applyLang() { lang = detect(); document.documentElement.lang = lang; document.documentElement.dir = RTL.includes(lang) ? 'rtl' : 'ltr';
  document.title = t('appName'); document.body.dataset.theme = isSup() ? S.settings.theme : 'rose'; }

function nav(cur) { const tabs = [['today', '◉'], ['calendar', '▦'], ['insights', '≋'], ['settings', '⚙']];
  return `<nav class="tabs">${tabs.map(([k, i]) => `<a href="#/${k}" class="${cur === k ? 'on' : ''}" data-tab="${k}"><span aria-hidden="true">${i}</span>${t(k)}</a>`).join('')}</nav>`; }
const shell = (cur, body) => { app.innerHTML = `<header><h1>${t('appName')}</h1><p class="tag">${t('notMedical')}</p></header><main id="main">${body}</main>${nav(cur)}`; };

// ---------- screens ----------
function onboarding() { app.innerHTML = `<main class="center"><div class="card"><h1>${t('appName')}</h1><p>${t('tagline')}</p>
  <label class="row">${t('language')} ${langSelect()}</label>
  <h2>${t('disclaimerTitle')}</h2><p class="warn" id="disc">${t('disclaimer')}</p><h2>${t('privacyTitle')}</h2><p>${t('privacy')}</p>
  <button class="btn primary" id="accept">${t('accept')}</button></div></main>`;
  bindLang(); $('#accept').onclick = async () => { S.settings.accepted = true; await save(); location.hash = '#/today'; route(); }; }

function lock() { app.innerHTML = `<main class="center"><div class="card"><h1>${t('appName')}</h1><label>${t('enterPin')}<input id="pin" type="password" inputmode="numeric" autocomplete="off" maxlength="8"></label>
  <p class="err" id="perr"></p><button class="btn primary" id="unl">${t('unlock')}</button></div></main>`;
  const go = async () => { if (await sha(S.settings.pinSalt + $('#pin').value) === S.settings.pinHash) { unlocked = true; route(); } else { $('#perr').textContent = t('wrongPin'); $('#pin').value = ''; } };
  $('#unl').onclick = go; $('#pin').onkeydown = e => e.key === 'Enter' && go(); $('#pin').focus(); }

function today() { const pr = predict(S.periods, S.settings), td = todayStr(); let body;
  if (pr.none) body = `<section class="hero"><div class="ring"><b>—</b></div><p>${t('noData')}</p></section>`;
  else { const big = pr.onPeriod ? t('onPeriod', pr.periodDay) : t('dayOfCycle', pr.cycleDay);
    const nx = pr.daysTo > 0 ? t('inDays', pr.daysTo) : pr.daysTo === 0 ? t('isToday') : t('late', -pr.daysTo);
    const f = pr.future.find(f => f.fe >= dn(td)) || pr.future[0];
    body = `<section class="hero ${pr.onPeriod ? 'onp' : ''}"><div class="ring"><b>${pr.onPeriod ? pr.periodDay : pr.cycleDay}</b></div><h2 id="big">${big}</h2></section>
    <div class="grid"><div class="card stat"><small>${t('nextPeriod')}</small><b id="next">${fmt(pr.next)}</b><span>${nx}</span></div>
    <div class="card stat"><small>${t('fertile')}</small><b>${fmt(f.fs)} – ${fmt(f.fe)}</b><span>${t('ovulation')}: ${fmt(f.ov)}</span></div></div>`; }
  const open = !pr.none && pr.open;
  body += `<button class="btn primary big" id="mark">${open ? t('endToday') : t('startToday')}</button><p class="note">${t('disclaimer')}</p>`;
  shell('today', body);
  $('#mark').onclick = async () => { if (open) pr.last.end = td; else if (!S.periods.some(p => p.start === td)) S.periods.push({ start: td, end: null }); await save(); toast(t('saved')); today(); }; }

function calendar() { const td = todayStr(); if (!calMonth) calMonth = td.slice(0, 7);
  const [y, m] = calMonth.split('-').map(Number), first = Date.UTC(y, m - 1, 1) / 864e5, dim = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const wkStart = (new Intl.Locale(lang).weekInfo?.firstDay ?? (['ar', 'ur'].includes(lang) ? 6 : 1)) % 7;
  const lead = (new Date(first * 864e5).getUTCDay() - wkStart + 7) % 7, pr = predict(S.periods, S.settings, td, 12);
  const wd = [...Array(7)].map((_, i) => fmt(3 + wkStart + i, { weekday: ['ar', 'ur'].includes(lang) ? 'short' : 'narrow' })); // day 3 = Sun 1970-01-04
  let cells = '<div></div>'.repeat(lead);
  for (let d = 1; d <= dim; d++) { const s = ds(first + d - 1), k = dayKind(s, S.periods, pr), has = S.days[s] ? ' has' : '';
    cells += `<button class="day ${k}${s === td ? ' now' : ''}${has}" data-d="${s}" aria-label="${fmt(first + d - 1, { dateStyle: 'full' })} ${k ? t('legend' + { period: 'Period', predicted: 'Predicted', fertile: 'Fertile', ovulation: 'Ovulation' }[k]) : ''}">${d}</button>`; }
  shell('calendar', `<div class="calhead"><button class="btn icon" id="prev" aria-label="prev">‹</button><h2>${fmt(first, { month: 'long', year: 'numeric' })}</h2><button class="btn icon" id="nextm" aria-label="next">›</button></div>
   <div class="cal"><div class="wd">${wd.map(w => `<span>${w}</span>`).join('')}</div><div class="days">${cells}</div></div>
   <div class="legend"><span class="k period"></span>${t('legendPeriod')}<span class="k predicted"></span>${t('legendPredicted')}<span class="k fertile"></span>${t('legendFertile')}<span class="k ovulation"></span>${t('legendOvulation')}</div><div id="sheet"></div>`);
  const mv = k => { const d = new Date(Date.UTC(y, m - 1 + k, 1)); calMonth = d.toISOString().slice(0, 7); calendar(); };
  const rtl = document.documentElement.dir === 'rtl'; $('#prev').onclick = () => mv(-1); $('#nextm').onclick = () => mv(1);
  if (rtl) { $('#prev').textContent = '›'; $('#nextm').textContent = '‹'; }
  document.querySelectorAll('.day').forEach(b => b.onclick = () => sheet(b.dataset.d)); }

function sheet(d) { const td = todayStr(), fut = dn(d) > dn(td), rec = S.days[d] || { flow: '', sym: [], note: '' };
  const inP = S.periods.find(p => dn(d) >= dn(p.start) && dn(d) <= (p.end ? dn(p.end) : dn(p.start) + 9)), isStart = S.periods.find(p => p.start === d);
  const syms = ['cramps', 'headache', 'mood', 'acne', 'bloating', 'tired'];
  $('#sheet').innerHTML = `<div class="card sheet"><h3>${fmt(dn(d), { dateStyle: 'full' })}</h3>${fut ? '' : `<div class="actions">
   ${isStart ? `<button class="btn danger" id="rm">${t('removePeriod')}</button>` : `<button class="btn" id="st">${t('startOn')}</button>`}
   ${inP && !isStart ? `<button class="btn" id="en">${t('endOn')}</button>` : ''}</div>
   <h4>${t('flow')}</h4><div class="chips" id="flow">${['none', 'light', 'medium', 'heavy'].map(f => `<button class="chip ${rec.flow === f ? 'on' : ''}" data-v="${f}">${t(f)}</button>`).join('')}</div>
   <h4>${t('symptoms')}</h4><div class="chips" id="sym">${syms.map(f => `<button class="chip ${rec.sym.includes(f) ? 'on' : ''}" data-v="${f}">${t(f)}</button>`).join('')}</div>
   <label>${t('notes')}<textarea id="note" rows="2" maxlength="500">${esc(rec.note)}</textarea></label><button class="btn primary" id="sv">${t('save')}</button>`}</div>`;
  if (fut) return; $('#sheet').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  $('#flow').onclick = e => { const v = e.target.dataset.v; if (!v) return; rec.flow = rec.flow === v ? '' : v; $('#flow').querySelectorAll('.chip').forEach(c => c.classList.toggle('on', c.dataset.v === rec.flow)); };
  $('#sym').onclick = e => { const v = e.target.dataset.v; if (!v) return; rec.sym = rec.sym.includes(v) ? rec.sym.filter(x => x !== v) : [...rec.sym, v]; e.target.classList.toggle('on'); };
  $('#sv').onclick = async () => { rec.note = $('#note').value; if (rec.flow || rec.sym.length || rec.note) S.days[d] = rec; else delete S.days[d]; await save(); toast(t('saved')); calendar(); };
  if ($('#st')) $('#st').onclick = async () => { S.periods.push({ start: d, end: null }); S.periods.sort((a, b) => dn(a.start) - dn(b.start));
    const i = S.periods.findIndex(p => p.start === d), nx = S.periods[i + 1]; if (nx && dn(nx.start) - dn(d) < 10) S.periods.splice(i + 1, 1); await save(); calendar(); };
  if ($('#rm')) $('#rm').onclick = async () => { S.periods = S.periods.filter(p => p.start !== d); await save(); calendar(); };
  if ($('#en')) $('#en').onclick = async () => { inP.end = d; await save(); calendar(); }; }

function insights() { const pr = predict(S.periods, S.settings), p = [...S.periods].sort((a, b) => dn(b.start) - dn(a.start));
  const rows = p.map((x, i) => { const nx = p[i - 1], len = x.end ? dn(x.end) - dn(x.start) + 1 : null, cyc = nx ? dn(nx.start) - dn(x.start) : null;
    return `<li><b>${fmt(dn(x.start), { day: 'numeric', month: 'short', year: 'numeric' })}</b><span>${len ? t('days', len) : '…'}</span><span class="muted">${cyc ? '↻ ' + t('days', cyc) : ''}</span></li>`; }).join('');
  shell('insights', `<div class="grid"><div class="card stat"><small>${t('avgCycle')}</small><b>${t('days', pr.cycleLen)}</b></div><div class="card stat"><small>${t('avgPeriod')}</small><b>${t('days', pr.periodLen)}</b></div>
   <div class="card stat"><small>${t('cycles')}</small><b>${pr.logged}</b></div></div><h2>${t('history')}</h2>${rows ? `<ul class="hist">${rows}</ul>` : `<p class="muted">${t('noHistory')}</p>`}`); }

const langSelect = () => `<select id="lang">${Object.entries(LANGS).map(([k, v]) => `<option value="${k}" ${k === lang ? 'selected' : ''}>${v}</option>`).join('')}</select>`;
const bindLang = () => $('#lang').onchange = async e => { S.settings.lang = e.target.value; const u = new URL(location); u.searchParams.delete('lang'); history.replaceState(null, '', u); await save(); applyLang(); route(); };

function settings() { const st = S.settings, sup = isSup();
  shell('settings', `<div class="card"><label class="row">${t('language')} ${langSelect()}</label>
   <label class="row">${t('cycleLen')}<input id="cl" type="number" min="20" max="45" value="${st.cycleLen}"></label>
   <label class="row">${t('periodLen')}<input id="pl" type="number" min="2" max="10" value="${st.periodLen}"></label></div>
   <div class="card"><h3>${t('pin')}</h3><p class="muted">${t('pinNote')}</p>${st.pinHash ? `<button class="btn" id="rmpin">${t('removePin')}</button>` :
   `<input id="np" type="password" inputmode="numeric" maxlength="8" placeholder="${t('newPin')}" aria-label="${t('newPin')}"><button class="btn" id="setpin">${t('setPin')}</button>`}</div>
   <div class="card"><h3>${t('backup')}</h3><p class="muted">${t('privacy')}</p><div class="actions"><button class="btn" id="exp">${t('exportData')}</button>
   <label class="btn">${t('importData')}<input id="imp" type="file" accept="application/json,.json" hidden></label></div><button class="btn danger" id="del">${t('deleteAll')}</button></div>
   <div class="card" id="supcard"><h3>${t('supporter')} ${sup ? '★' : ''}</h3><p>${t('supporterText')}</p>${sup ? `<label class="row">${t('theme')}<select id="theme">${['rose', 'lavender', 'teal', 'dark'].map(x => `<option ${x === st.theme ? 'selected' : ''}>${x}</option>`).join('')}</select></label>` :
   `${SUPPORTER_URL ? `<a class="btn primary" href="${SUPPORTER_URL}" target="_blank" rel="noopener">${t('buy')}</a>` : `<button class="btn" disabled>${t('buy')} · ${t('soon')}</button>`}
   <div class="actions"><input id="code" placeholder="${t('enterCode')}" aria-label="${t('enterCode')}" autocomplete="off"><button class="btn" id="redeem">OK</button></div><p id="cmsg"></p>`}</div>
   <div class="card"><h3>${t('about')}</h3><p class="warn">${t('disclaimer')}</p><p class="muted"><a href="privacy.html">${t('privacyTitle')}</a> · v1.0</p></div>`);
  bindLang();
  $('#cl').onchange = async e => { st.cycleLen = Math.min(45, Math.max(20, +e.target.value || 28)); await save(); toast(t('saved')); };
  $('#pl').onchange = async e => { st.periodLen = Math.min(10, Math.max(2, +e.target.value || 5)); await save(); toast(t('saved')); };
  if ($('#setpin')) $('#setpin').onclick = async () => { const v = $('#np').value; if (!/^\d{4,8}$/.test(v)) return toast(t('newPin'));
    st.pinSalt = [...crypto.getRandomValues(new Uint8Array(8))].map(b => b.toString(16)).join(''); st.pinHash = await sha(st.pinSalt + v); unlocked = true; await save(); toast(t('saved')); settings(); };
  if ($('#rmpin')) $('#rmpin').onclick = async () => { st.pinHash = st.pinSalt = ''; await save(); settings(); };
  $('#exp').onclick = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify({ app: 'cycleclear', v: 1, periods: S.periods, days: S.days, settings: { cycleLen: st.cycleLen, periodLen: st.periodLen } }, null, 1)], { type: 'application/json' }));
    a.download = `cycleclear-backup-${todayStr()}.json`; a.click(); };
  $('#imp').onchange = async e => { try { const j = JSON.parse(await e.target.files[0].text()); if (j.app !== 'cycleclear' || !Array.isArray(j.periods)) throw 0;
    S.periods = j.periods.filter(p => /^\d{4}-\d\d-\d\d$/.test(p.start)); S.days = j.days || {}; Object.assign(st, j.settings || {}); await save(); toast(t('imported')); settings(); } catch { toast(t('badFile')); } };
  $('#del').onclick = async () => { if (!confirm(t('confirmDelete'))) return; await db.clear(); S = { periods: [], days: {}, settings: { ...DEF } }; localStorage.clear(); location.hash = ''; applyLang(); route(); };
  if ($('#redeem')) $('#redeem').onclick = async () => { const h = await sha($('#code').value.trim().toUpperCase()); if (h === SUPPORTER_CODE_HASH) { st.supporter = h; await save(); applyLang(); toast(t('codeOk')); settings(); } else { $('#cmsg').className = 'err'; $('#cmsg').textContent = t('badCode'); } };
  if ($('#theme')) $('#theme').onchange = async e => { st.theme = e.target.value; await save(); applyLang(); }; }

function route() { applyLang(); if (!S.settings.accepted) return onboarding(); if (S.settings.pinHash && !unlocked) return lock();
  const r = (location.hash.match(/#\/(\w+)/) || [])[1]; ({ calendar, insights, settings }[r] || today)(); window.scrollTo(0, 0); }

(async () => { try { const s = await db.get('state'); if (s) S = { ...S, ...s, settings: { ...DEF, ...s.settings } }; } catch (e) { console.warn(e); }
  addEventListener('hashchange', route); route();
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js'); })();
