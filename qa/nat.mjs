import { chromium } from 'playwright-core';
const b = await chromium.launch({executablePath: process.env.CHROME||undefined}); const p = await b.newPage();
p.on('console', m => console.log('console', m.type(), m.text().slice(0,200))); p.on('pageerror', e => console.log('PAGEERR', e.message));
await p.addInitScript(() => { window.Capacitor = { isNativePlatform: () => true, getPlatform: () => 'ios', registerPlugin: n => new Proxy({}, { get: (_, k) => async () => { console.log('call', n, String(k)); return {}; } }) }; });
await p.goto('http://localhost:8797/index.html'); await p.waitForTimeout(3000);
console.log('body', (await p.textContent('body')).slice(0,120)); await b.close();
