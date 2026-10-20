import { chromium } from '/workspace/apps_studio/notricks/node_modules/playwright-core/index.mjs'; import fs from 'fs';
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] }); const p = await b.newPage();
for (const [f, w, h, out] of JSON.parse(process.argv[2])) { await p.setViewportSize({ width: w, height: h });
  await p.setContent(`<html><body style="margin:0;background:transparent">${fs.readFileSync(f, 'utf8').replace(/width="\d+" height="\d+"/, `width="${w}" height="${h}"`)}</body></html>`);
  await p.screenshot({ path: out, omitBackground: true, clip: { x: 0, y: 0, width: w, height: h } }); }
await b.close();
