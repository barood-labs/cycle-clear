import { chromium } from 'playwright-core'; import fs from 'fs';
const U = process.env.BASE_URL || 'http://localhost:8797/', O = 'qa/shots/'; fs.mkdirSync(O, { recursive: true });
const day = n => { const d = new Date(); d.setDate(d.getDate() + n); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
fs.writeFileSync('/tmp/cc_share.json', JSON.stringify({ app: 'cycleclear', v: 2, periods: [-100, -71, -42, -12].map(s => ({ start: day(s), end: day(s + 4) })), days: {}, settings: { mode: 'track' } }));
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] }); let pass = 0, fail = [];
const ok = (n, c) => { c ? pass++ : fail.push(n); console.log(c ? 'PASS' : 'FAIL', n); };
for (const lang of ['en', 'ar', 'ur']) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, acceptDownloads: true, permissions: ['clipboard-read', 'clipboard-write'] });
  const p = await ctx.newPage(), errs = [], tag = lang + '_mobile'; p.on('pageerror', e => errs.push(e.message));
  const shot = async (pg, n) => { await pg.waitForTimeout(250); await pg.screenshot({ path: `${O}${tag}_${n}.png`, fullPage: true }); ok(`${tag} ${n} no overflow`, await pg.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)); };
  try {
    await p.goto(`${U}?lang=${lang}`); await p.click('#accept'); await p.click('.mode[data-m=track]'); await p.click('#go'); await p.waitForSelector('#mark');
    await p.click('[data-tab=settings]'); await p.setInputFiles('#imp', '/tmp/cc_share.json'); await p.waitForTimeout(400);
    ok(tag + ' health card web note', (await p.textContent('#healthcard')).length > 20); await p.locator('#healthcard').scrollIntoViewIfNeeded(); await p.screenshot({ path: `${O}${tag}_10_settings_health.png` });
    await p.goto(`${U}#/share`); await p.waitForSelector('#b_code'); ok(tag + ' not sharing', !!(await p.$('#notsharing'))); await shot(p, '11_share');
    await p.click('label:has(#f_phase) .sw'); await p.click('#b_code'); await p.waitForSelector('#pass'); const code = await p.textContent('#pass'), url = await p.inputValue('#shareurl');
    ok(tag + ' link has payload in fragment only', url.includes('#/p/c1.') && !url.split('#')[0].includes('c1.')); await shot(p, '12_share_code');
    const [d] = await Promise.all([p.waitForEvent('download'), p.click('#b_ics')]); const f = `/tmp/cc_${tag}.ics`; await d.saveAs(f); const ics = fs.readFileSync(f, 'utf8');
    ok(tag + ' ics 3 events', (ics.match(/BEGIN:VEVENT/g) || []).length === 3 && ics.includes('METHOD:PUBLISH')); await p.waitForSelector('#b_stop'); await shot(p, '13_share_active');
    const [d2] = await Promise.all([p.waitForEvent('download'), p.click('#b_stop')]); const f2 = `/tmp/cc_${tag}_stop.ics`; await d2.saveAs(f2); const c2 = fs.readFileSync(f2, 'utf8');
    ok(tag + ' stop ics cancels same uids', c2.includes('METHOD:CANCEL') && (ics.match(/UID:[^\r]+/g) || []).every(u => c2.includes(u))); await p.waitForSelector('#notsharing'); ok(tag + ' stopped', true);
    const c3 = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, locale: lang }); const q = await c3.newPage(); q.on('pageerror', e => errs.push(e.message));
    await q.goto(url.replace(/^https?:\/\/[^/]+\/(cycle-clear\/)?/, U)); await q.waitForSelector('#pp'); await shot(q, '14_partner_lock');
    await q.fill('#pp', 'WRONG-CODE1'); await q.click('#po'); await q.waitForFunction(() => document.querySelector('#perr').textContent.length > 0, null, { timeout: 15000 }); ok(tag + ' partner wrong pass', true);
    await q.fill('#pp', code.toLowerCase()); await q.click('#po'); await q.waitForSelector('#pv .hist li', { timeout: 15000 }); ok(tag + ' partner sees 3 dates', (await q.$$('#pv .hist li')).length === 3);
    ok(tag + ' partner sees phase', (await q.textContent('#pv')).length > 30); ok(tag + ' partner stores nothing', (await q.evaluate(async () => (await indexedDB.databases()).length)) === 0); await shot(q, '15_partner_view'); await c3.close();
  } catch (e) { fail.push(tag + ': ' + e.message.split('\n')[0]); console.log('ERR', tag, e.message.split('\n')[0]); }
  ok(tag + ' no js errors', errs.length === 0 || (console.log(errs), false)); await ctx.close(); }
await b.close(); console.log(`\n${pass} passed, ${fail.length} failed`, JSON.stringify(fail));
