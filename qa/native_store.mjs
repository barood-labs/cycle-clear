import { chromium } from 'playwright-core';
const U='http://localhost:8797/index.html'; let fails=0; const ok=(c,m)=>{console.log(c?'PASS':'FAIL',m); if(!c) fails++;};
for (const price of [null,'$9.99']) {
 const b=await chromium.launch({executablePath:'/usr/bin/google-chrome'}); const p=await b.newPage({viewport:{width:390,height:844}}); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
 await p.route('**/vendor/capacitor.js', r => r.fulfill({ contentType: 'text/javascript', body: '(' + "pr=>{window.Capacitor={isNativePlatform:()=>true,getPlatform:()=>'ios',registerPlugin:n=>new Proxy({},{get:(_,k)=>k==='then'?undefined:async()=>{ if(n==='NativePurchases'&&k==='getProducts') return {products: pr?[{priceString:pr}]:[]}; if(k==='isAvailable') return {isAvailable:false}; if(k==='requestPermissions') return {display:'denied'}; return {}; }})};}" + ')(' + JSON.stringify(price) + ')' }));
 await p.goto(U); await p.click('#accept'); await p.click('.mode[data-m=track]'); await p.click('#go'); await p.waitForSelector('#mark'); await p.waitForTimeout(800);
 await p.click('[data-tab=settings]'); await p.waitForTimeout(400); const body=await p.textContent('body');
 const tag=price?'store':'nostore'; if(!price) console.log((body.match(/.{0,40}(\$|9\.99|Pro|soon).{0,30}/gi)||[]).join(' || '));
 if(!price){ ok(!/\$|9\.99|Pro|soon/i.test(body.replace(/Pro(file|nounc)/g,'')),`${tag}: settings has no price/Pro/soon`); ok(await p.$('#theme'),'themes free');
  await p.evaluate(()=>location.hash='#/pro'); await p.waitForTimeout(300); ok(!(await p.url()).endsWith('#/pro') && !(await p.$('#iap')),'pro route redirects'); ok(!(await p.$('#iap')),'no buy button');
  await p.evaluate(()=>location.hash='#/share'); await p.waitForTimeout(300); ok(!(await p.$('#iap')) && /share/i.test(await p.url()),'share usable');
  await p.evaluate(()=>location.hash='#/report'); await p.waitForTimeout(300); ok(await p.$('.report'),'report usable');
  await p.evaluate(()=>location.hash='#/insights'); await p.waitForTimeout(300); ok(!(await p.$('.teaser')),'no pro teaser');
  await p.evaluate(()=>location.hash='#/settings'); await p.waitForTimeout(300); await p.screenshot({path:'qa/shots/native_nostore_settings.png',fullPage:true});
 } else { await p.evaluate(()=>location.hash='#/pro'); await p.waitForSelector('#iap'); ok((await p.textContent('#iap')).includes('$9.99'),'store: buy shows store price'); await p.screenshot({path:'qa/shots/native_store_pro.png'}); }
 ok(!errs.length,tag+' no JS errors '+errs.join(';')); await b.close(); }
console.log(fails?'FAILED':'ALL PASS');
