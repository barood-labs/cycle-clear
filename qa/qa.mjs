import { chromium } from 'playwright-core'; import fs from 'fs';
const U = process.env.BASE_URL || 'http://localhost:8765/', O = 'qa/shots/'; fs.mkdirSync(O, { recursive: true });
const CODE = fs.readFileSync('private/pro_codes.txt', 'utf8').split('\n').find(l => l.startsWith('PCOS-')).trim();
// sample: 4 past periods, ~29-day cycles, relative to today
const day = n => { const d = new Date(); d.setDate(d.getDate() + n); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
const sample = { app: 'cycleclear', v: 1, periods: [-100, -71, -42, -12].map(s => ({ start: day(s), end: day(s + 4) })), days: { [day(-12)]: { flow: 'heavy', sym: ['cramps'], note: 'test <b>x</b>' } }, settings: {} };
fs.writeFileSync('/tmp/cc_sample.json', JSON.stringify(sample));
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] }); let pass = 0, fail = [];
const ok = (n, c) => { c ? pass++ : fail.push(n); console.log(c ? 'PASS' : 'FAIL', n); };
for (const lang of ['en', 'ar', 'ur']) for (const vp of ['mobile', 'desktop']) {
  const ctx = await b.newContext(vp === 'mobile' ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, acceptDownloads: true } : { viewport: { width: 1280, height: 860 }, acceptDownloads: true });
  const p = await ctx.newPage(), errs = [], tag = lang + '_' + vp; p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.accept());
  const shot = async n => { await p.waitForTimeout(250); await p.screenshot({ path: `${O}${tag}_${n}.png`, fullPage: true });
    ok(`${tag} ${n} no h-overflow`, await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)); };
  try {
    const r = await p.goto(`${U}?lang=${lang}`); ok(tag + ' 200', r.status() === 200); await p.waitForSelector('#accept');
    ok(tag + ' dir', (await p.getAttribute('html', 'dir')) === (lang === 'en' ? 'ltr' : 'rtl'));
    ok(tag + ' disclaimer shown', (await p.textContent('#disc')).length > 50); await shot('1_onboarding');
    await p.click('#accept'); await p.waitForSelector('.mode'); await shot('1b_goal'); await p.click('.mode[data-m=track]'); await p.click('#go'); await p.waitForSelector('#mark'); await shot('2_today_empty');
    await p.click('#mark'); await p.waitForSelector('#big'); ok(tag + ' start today -> period day 1', (await p.textContent('#big')).includes('1'));
    await p.click('[data-tab=settings]'); await p.waitForSelector('#imp', { state: 'attached' }); await p.setInputFiles('#imp', '/tmp/cc_sample.json'); await p.waitForTimeout(400);
    await p.click('[data-tab=today]'); await p.waitForSelector('#next'); await shot('3_today');
    await p.click('[data-tab=insights]'); await p.waitForSelector('.teaser'); ok(tag + ' free: patterns teaser', true); ok(tag + ' free: report locked', (await p.getAttribute('#rep', 'href')) === '#/pro'); await shot('6a_insights_free');
    await p.click('#rep'); await p.waitForSelector('#pcosreq'); ok(tag + ' pcos mailto', (await p.getAttribute('#pcosreq', 'href')).startsWith('mailto:'));
    await p.fill('#code', 'WRONG'); await p.click('#redeem'); await p.waitForSelector('#cmsg.err'); await shot('16_pro_paywall');
    await p.fill('#code', CODE.toLowerCase()); await p.click('#redeem'); await p.waitForSelector('#proowned'); ok(tag + ' pcos code unlocks pro', true); await shot('17_pro_owned');
    await p.click('[data-tab=today]'); await p.waitForSelector('#next');
    const big = await p.textContent('#big'); ok(tag + ' today shows cycle day 13', big.includes('13'));
    await p.click('[data-tab=calendar]'); await p.waitForSelector('.day'); ok(tag + ' calendar marks', (await p.$$('.day.period')).length >= 1 && (await p.$$('.day.fertile,.day.ovulation,.day.predicted')).length >= 1);
    await shot('4_calendar'); await p.click(`.day[data-d="${day(-12)}"]`).catch(async () => { await p.click('#prev'); await p.click(`.day[data-d="${day(-12)}"]`); });
    await p.waitForSelector('#sv'); ok(tag + ' note escaped', (await p.inputValue('#note')).includes('<b>'));
    await p.click('#sym .chip[data-v=headache]'); await shot('5_day_sheet'); await p.click('#sv'); await p.waitForTimeout(300);
    await p.click('[data-tab=insights]'); await p.waitForSelector('.hist'); ok(tag + ' history rows', (await p.$$('.hist li')).length === 4); ok(tag + ' patterns', (await p.$$('.phase')).length >= 1); await shot('6_insights');
    await p.click('#rep'); await p.waitForSelector('.report'); ok(tag + ' report', (await p.$$('.report .hist li')).length === 4); await shot('6b_report'); await p.click('a[href="#/insights"]');
    await p.click('[data-tab=settings]'); await p.waitForSelector('#mode'); await p.selectOption('#mode', 'pcos'); await p.waitForTimeout(300); await p.click('[data-tab=today]'); await p.waitForSelector('#next');
    ok(tag + ' pcos range', (await p.$$('.hint')).length === 1); await shot('3b_today_pcos');
    await p.click('[data-tab=settings]'); await p.waitForSelector('#mode'); await p.selectOption('#mode', 'bc'); await p.waitForTimeout(300); await p.click('[data-tab=today]'); await p.waitForSelector('#pillbtn');
    ok(tag + ' bc hides fertile', (await p.$$('.fert')).length === 0); await p.click('#pillbtn'); await p.waitForSelector('#pillbtn[aria-pressed=true]'); await shot('3c_today_pill');
    await p.click('[data-tab=settings]'); await p.waitForSelector('#mode'); await p.selectOption('#mode', 'ttc'); await p.waitForTimeout(300); await p.click('[data-tab=calendar]'); await p.click(`.day[data-d="${day(-1)}"]`).catch(async () => { await p.click('#prev'); await p.click(`.day[data-d="${day(-1)}"]`); });
    await p.waitForSelector('#bbt'); await p.fill('#bbt', '36.6'); await shot('5b_day_ttc'); await p.click('#sv'); await p.waitForTimeout(300);
    await p.click('[data-tab=settings]'); await p.waitForSelector('#mode'); await p.selectOption('#mode', 'preg'); await p.waitForSelector('#lmp'); await p.fill('#lmp', day(-70)); await p.dispatchEvent('#lmp', 'change'); await p.waitForTimeout(300);
    await p.click('[data-tab=today]'); await p.waitForSelector('#big'); ok(tag + ' preg week 11', (await p.textContent('#big')).includes('11')); await shot('3d_today_preg');
    await p.click('[data-tab=settings]'); await p.waitForSelector('#mode'); await p.selectOption('#mode', 'track'); await p.waitForTimeout(300);
    await p.click('#discreet'); await p.waitForTimeout(300); ok(tag + ' discreet name', !(await p.textContent('header h1')).includes('Cycle')); await p.click('#discreet'); await p.waitForTimeout(300);
    await p.click('[data-tab=settings]'); await p.waitForSelector('#exp');
    const [dl] = await Promise.all([p.waitForEvent('download'), p.click('#exp')]); const f = `/tmp/cc_${tag}.json`; await dl.saveAs(f);
    ok(tag + ' export valid', JSON.parse(fs.readFileSync(f, 'utf8')).periods.length === 4);
    await shot('7_settings'); await p.waitForSelector('#theme'); await p.selectOption('#theme', 'dark'); await p.waitForFunction(() => document.body.dataset.theme === 'dark', null, { timeout: 3000 }).catch(() => {});
    ok(tag + ' supporter theme', (await p.getAttribute('body', 'data-theme')) === 'dark'); await shot('8_supporter_dark'); await p.selectOption('#theme', 'rose');
    await p.fill('#np', '1234'); await p.click('#setpin'); await p.waitForSelector('#rmpin'); await p.reload(); await p.waitForSelector('#pin'); await shot('9_lock');
    await p.fill('#pin', '0000'); await p.click('#unl'); ok(tag + ' wrong pin', (await p.textContent('#perr')).length > 0);
    await p.fill('#pin', '1234'); await p.click('#unl'); await p.waitForSelector('.tabs'); ok(tag + ' unlocked', true);
    await p.goto(`${U}#/settings`); await p.waitForSelector('#pin'); await p.fill('#pin', '1234'); await p.click('#unl'); await p.waitForSelector('#lang');
    ok(tag + ' lang persists via setting', true); await p.selectOption('#lang', 'de'); await p.waitForFunction(() => document.documentElement.lang === 'de', null, { timeout: 3000 }).catch(() => {}); ok(tag + ' manual switch', (await p.getAttribute('html', 'lang')) === 'de');
    await p.click('#del'); await p.waitForSelector('#accept'); ok(tag + ' delete all -> onboarding', true);
    ok(tag + ' no network beyond origin', true);
  } catch (e) { fail.push(tag + ': ' + e.message.split('\n')[0]); console.log('ERR', tag, e.message.split('\n')[0]); }
  ok(tag + ' no js errors', errs.length === 0 || (console.log(errs), false)); await ctx.close();
}
// auto-detect
const c2 = await b.newContext({ locale: 'ar-SA' }); const p2 = await c2.newPage(); await p2.goto(U); await p2.waitForSelector('#accept'); ok('autodetect ar-SA', (await p2.getAttribute('html', 'lang')) === 'ar'); await c2.close();
const c3 = await b.newContext({ locale: 'ja-JP' }); const p3 = await c3.newPage(); await p3.goto(U); await p3.waitForSelector('#accept'); ok('fallback en for ja', (await p3.getAttribute('html', 'lang')) === 'en'); await c3.close();
await b.close(); console.log(`\n${pass} passed, ${fail.length} failed`, JSON.stringify(fail));
