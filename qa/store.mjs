import { chromium } from 'playwright-core'; import fs from 'fs';
const U = process.env.BASE_URL || 'http://localhost:8797/', O = 'store/'; fs.mkdirSync(O + 'raw', { recursive: true });
const day = n => { const d = new Date(); d.setDate(d.getDate() + n); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
const days = {}; for (const [o, s, m] of [[-12, ['cramps', 'tired'], ['calm']], [-11, ['cramps'], ['sad']], [-41, ['cramps', 'headache'], ['irritable']], [-40, ['bloating'], []], [-16, ['bloating', 'acne'], ['anxious']], [-45, ['acne', 'cravings'], ['irritable']], [-27, [], ['happy', 'energetic']], [-56, [], ['energetic']]]) days[day(o)] = { flow: '', sym: s, mood: m, note: '' };
for (const o of [-12, -11, -10]) days[day(o)] = { ...(days[day(o)] || { sym: [], mood: [], note: '' }), flow: 'heavy' };
for (let i = -20; i <= 0; i++) days[day(i)] = { ...(days[day(i)] || { flow: '', sym: [], mood: [], note: '' }), pill: true };
fs.writeFileSync('/tmp/cc_store.json', JSON.stringify({ app: 'cycleclear', v: 2, periods: [-100, -71, -42, -12].map(s => ({ start: day(s), end: day(s + 4) })), days, settings: { mode: 'track' } }));
const COPY = { en: [['Your cycle, privately', 'No account. No ads. Data never leaves your phone.'], ['See what’s coming', 'Next period & fertile window, at a glance'], ['Know your patterns', 'Symptoms & mood by cycle phase'], ['Made for every stage', 'Birth control, PCOS, trying, pregnancy, perimenopause'], ['Doctor-ready report', 'Share your history in one tap']],
  ar: [['دورتك بخصوصية تامة', 'بلا حساب ولا إعلانات. بياناتك لا تغادر هاتفك.'], ['اعرفي ما القادم', 'الدورة القادمة وفترة الخصوبة بنظرة واحدة'], ['افهمي أنماطك', 'الأعراض والمزاج حسب مرحلة الدورة'], ['لكل مرحلة من حياتك', 'منع الحمل، تكيس المبايض، محاولة الحمل، الحمل، ما قبل انقطاع الطمث'], ['تقرير جاهز للطبيب', 'شاركي سجلك بلمسة واحدة']] };
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
for (const lang of ['en', 'ar']) {
  const ctx = await b.newContext({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true }); const p = await ctx.newPage(); p.on('dialog', d => d.accept());
  await p.goto(`${U}?lang=${lang}`); await p.click('#accept'); await p.click('.mode[data-m=track]'); await p.click('#go'); await p.waitForSelector('#mark');
  await p.click('[data-tab=settings]'); await p.setInputFiles('#imp', '/tmp/cc_store.json'); await p.waitForTimeout(500);
  await p.addStyleTag({ content: '#toast{display:none!important}' });
  const snap = async n => { await p.waitForTimeout(400); await p.screenshot({ path: `${O}raw/${lang}_${n}.png` }); };
  await p.click('[data-tab=today]'); await p.waitForSelector('#next'); await snap(1);
  await p.click('[data-tab=calendar]'); await p.waitForSelector('.day'); await snap(2);
  await p.click('[data-tab=insights]'); await p.waitForSelector('.phase'); await snap(3);
  await p.evaluate(() => { location.hash = ''; }); await p.goto(`${U}?lang=${lang}`); // goal screen via settings mode list
  await p.click('[data-tab=settings]'); await p.selectOption('#mode', 'bc'); await p.waitForTimeout(300); await p.click('[data-tab=today]'); await p.waitForSelector('#pillbtn'); await snap(4);
  await p.click('[data-tab=insights]'); await p.click('#rep'); await p.waitForSelector('.report'); await snap(5);
  await ctx.close();
  for (const [W, H, tag] of [[1290, 2796, '6.7'], [1284, 2778, '6.5']]) {
    const c = await b.newContext({ viewport: { width: W, height: H } }); const q = await c.newPage();
    for (let i = 1; i <= 5; i++) { const img = fs.readFileSync(`${O}raw/${lang}_${i}.png`).toString('base64'), [h1, h2] = COPY[lang][i - 1];
      await q.setContent(`<html dir="${lang === 'ar' ? 'rtl' : 'ltr'}"><body style="margin:0;width:${W}px;height:${H}px;overflow:hidden;background:linear-gradient(160deg,#ffe6f0,#f3e1ff 60%,#e3d8ff);font-family:'SF Pro Rounded',Nunito,'Noto Sans','Noto Naskh Arabic',sans-serif;text-align:center;position:relative">
       <div style="position:absolute;width:260px;height:260px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#f1e6ff,#b9a0f0 50%,#7a5bd0);left:-60px;top:${H * .62}px;box-shadow:0 30px 60px rgba(122,91,208,.3)"></div>
       <div style="position:absolute;width:150px;height:150px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#e2fbf6,#7fd8c8 50%,#22998a);right:-30px;top:${H * .3}px"></div>
       <h1 style="font-size:112px;font-weight:900;color:#a8124d;margin:${H * .065}px 70px 24px;line-height:1.1">${h1}</h1><p style="font-size:56px;color:#7a5566;margin:0 90px;line-height:1.3">${h2}</p>
       <img src="data:image/png;base64,${img}" style="position:absolute;left:50%;transform:translateX(-50%);top:${H * .27}px;width:${W * .78}px;border-radius:90px;border:22px solid #2a1520;box-shadow:0 60px 120px rgba(120,30,70,.35)"></body></html>`);
      await q.screenshot({ path: `${O}${tag}in_${lang}_${i}.png` }); }
    await c.close(); } }
await b.close(); console.log('done');
