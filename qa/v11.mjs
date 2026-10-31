// v1.1 checks: lang/dir switch, discreet reminders (mocked native), plain icon toggle, rating once after 2nd period, a11y labels.
import { chromium } from 'playwright-core'; const U = 'http://localhost:8765/', O = 'qa/v11/';
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] }); let pass = 0, fail = [];
const ok = (n, c) => { c ? pass++ : fail.push(n); console.log(c ? 'PASS' : 'FAIL', n); };
const day = n => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
// mock Capacitor iOS: records plugin calls
const mock = () => { window.__calls = []; const mk = n => new Proxy({}, { get: (_, m) => m === 'then' ? undefined : async a => { window.__calls.push([n, m, a]);
  return m === 'requestPermissions' ? { display: 'granted' } : m === 'getPending' ? { notifications: [] } : m === 'isAvailable' ? { isAvailable: false } : m === 'getProducts' ? { products: [] } : m === 'setIcon' ? { changed: true } : {}; } });
  window.Capacitor = { isNativePlatform: () => true, getPlatform: () => 'ios', registerPlugin: mk }; };
for (const native of [false, true]) {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 }); if (native) await ctx.route('**/vendor/capacitor.js', r => r.fulfill({ contentType: 'text/javascript', body: `(${mock})()` }));
  const p = await ctx.newPage(), errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.accept());
  await p.goto(U + (native ? '' : '?lang=en')); await p.waitForSelector('#accept'); await p.click('#accept'); await p.click('.mode[data-m=track]'); await p.click('#go'); await p.waitForSelector('#mark');
  const tag = native ? 'native' : 'web';
  if (!native) { // language switch -> html lang/dir
    for (const [l, d] of [['ar', 'rtl'], ['ur', 'rtl'], ['fr', 'ltr'], ['en', 'ltr']]) { await p.click('[data-tab=settings]'); await p.waitForSelector('#lang'); await p.selectOption('#lang', l); await p.waitForTimeout(300);
      ok(`lang ${l}`, await p.evaluate(() => document.documentElement.lang) === l && await p.evaluate(() => document.documentElement.dir) === d);
      if (l === 'ar') { await p.screenshot({ path: O + 'ar_settings_rtl.png', fullPage: true }); await p.click('[data-tab=calendar]'); await p.waitForSelector('.day'); await p.screenshot({ path: O + 'ar_calendar_rtl.png' });
        ok('ar day aria-label arabic', /[\u0600-\u06FF]/.test(await p.getAttribute('.day.now', 'aria-label'))); await p.click('.day.now'); await p.waitForSelector('#flow');
        ok('ar chip aria', (await p.getAttribute('#flow', 'aria-label')).length > 0 && (await p.getAttribute('#flow .chip', 'aria-pressed')) === 'false'); await p.click('#flow .chip[data-v=light]');
        ok('chip aria-pressed toggles', (await p.getAttribute('#flow .chip[data-v=light]', 'aria-pressed')) === 'true'); await p.screenshot({ path: O + 'ar_day_sheet_rtl.png' }); await p.keyboard.press('Escape'); await p.goto(U + '#/settings'); } } 
    ok('web: no plain icon toggle', !(await p.$('#plainicon')));
  } else {
    await p.click('#mark'); await p.waitForTimeout(2000); ok('no rating after 1st period', !(await p.evaluate(() => __calls.some(c => c[1] === 'requestReview'))));
    // add a 2nd period via calendar on an earlier day
    await p.evaluate(async s => { location.hash = '#/calendar'; }, 0); await p.waitForSelector('.day'); await p.click('#prev'); await p.click('.day[data-d$="-05"]'); await p.waitForSelector('#st'); await p.click('#st'); await p.waitForTimeout(2500);
    ok('rating requested after 2nd period', (await p.evaluate(() => __calls.filter(c => c[1] === 'requestReview').length)) === 1);
    await p.goto(U + '#/settings'); await p.waitForSelector('#discreet'); await p.check('#discreet'); await p.waitForTimeout(500);
    const sched = await p.evaluate(() => __calls.filter(c => c[1] === 'schedule').pop()?.[2]?.notifications || []);
    ok('discreet notifications neutral', sched.length > 0 && sched.every(n => n.title === 'Calendar' && n.body === 'Time to check in')); console.log(JSON.stringify(sched.map(n => [n.title, n.body])));
    ok('plain icon toggle shown on iOS', !!(await p.$('#plainicon'))); await p.check('#plainicon'); await p.waitForTimeout(300);
    ok('setIcon(plain) called', await p.evaluate(() => __calls.some(c => c[1] === 'setIcon' && c[2].plain === true)));
    await p.screenshot({ path: O + 'en_settings_discreet_ios.png', fullPage: true }); await p.goto(U + '#/today'); await p.waitForSelector('header'); await p.screenshot({ path: O + 'en_today_discreet.png' });
    // another period -> no second ask
    await p.goto(U + '#/calendar'); await p.waitForSelector('.day'); await p.click('#prev'); await p.click('#prev'); await p.click('.day[data-d$="-08"]'); await p.waitForSelector('#st'); await p.click('#st'); await p.waitForTimeout(2500);
    ok('rating asked only once', (await p.evaluate(() => __calls.filter(c => c[1] === 'requestReview').length)) === 1);
  }
  ok(tag + ' no page errors', errs.length === 0); if (errs.length) console.log(errs); await ctx.close(); }
await b.close(); console.log(pass, 'passed', fail.length, 'failed', fail);
