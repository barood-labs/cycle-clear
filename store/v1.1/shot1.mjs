// v1.1 first screenshot, same style as qa/store.mjs, reusing store/raw/<lang>_1.png. Run: node store/v1.1/shot1.mjs
import { chromium } from 'playwright-core'; import fs from 'fs';
const COPY = { en: ['No account. No cloud.<br>No ads.', 'Your cycle data stays on your iPhone.'], ar: ['بلا حساب. بلا سحابة.<br>بلا إعلانات.', 'بيانات دورتك تبقى على هاتفك.'] };
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
for (const [W, H, tag] of [[1290, 2796, '6.7'], [1284, 2778, '6.5'], [1206, 2622, '6.3'], [1179, 2556, '6.1']]) {
  const c = await b.newContext({ viewport: { width: W, height: H } }); const q = await c.newPage();
  for (const lang of ['en', 'ar']) { const img = fs.readFileSync(`store/raw/${lang}_1.png`).toString('base64'), [h1, h2] = COPY[lang];
    await q.setContent(`<html dir="${lang === 'ar' ? 'rtl' : 'ltr'}" style="overflow:hidden;width:${W}px"><body style="margin:0;width:${W}px;height:${H}px;overflow:hidden;background:linear-gradient(160deg,#ffe6f0,#f3e1ff 60%,#e3d8ff);font-family:'SF Pro Rounded',Nunito,'Noto Sans','Noto Naskh Arabic',sans-serif;text-align:center;position:relative">
     <div style="position:absolute;width:260px;height:260px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#f1e6ff,#b9a0f0 50%,#7a5bd0);left:0;transform:translateX(-60px);top:${H * .62}px;box-shadow:0 30px 60px rgba(122,91,208,.3)"></div>
     <div style="position:absolute;width:150px;height:150px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#e2fbf6,#7fd8c8 50%,#22998a);right:0;transform:translateX(30px);top:${H * .3}px"></div>
     <h1 style="font-size:${W * .078}px;font-weight:900;color:#a8124d;margin:${H * .055}px 60px 24px;line-height:1.12">${h1}</h1><p style="font-size:${W * .043}px;color:#7a5566;margin:0 90px;line-height:1.3">${h2}</p>
     <img src="data:image/png;base64,${img}" style="position:absolute;left:50%;transform:translateX(-50%);top:${H * .29}px;width:${W * .76}px;border-radius:90px;border:22px solid #2a1520;box-shadow:0 60px 120px rgba(120,30,70,.35)"></body></html>`);
    await q.waitForTimeout(300); await q.screenshot({ path: `store/v1.1/${tag}in_${lang}_1.png` }); } await c.close(); }
await b.close(); console.log('done');
