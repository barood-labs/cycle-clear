// Rename the app in ONE place: edit "name" in brand.json, then run `npm run brand`.
// Replaces the previously applied name everywhere it is shown (web, i18n, iOS, widget, Android, docs).
import fs from 'fs';
const b = JSON.parse(fs.readFileSync('brand.json', 'utf8')); if (b.name === b.applied) { console.log('brand up to date:', b.name); process.exit(0); }
const files = ['index.html', 'privacy.html', 'manifest.webmanifest', 'capacitor.config.json', 'i18n.js', 'i18n2.js', 'i18n3.js', 'app.js', 'share.js',
  'ios/App/App/Info.plist', 'ios/App/CycleWidget/Info.plist', 'ios/App/CycleWidget/CycleWidget.swift', 'android/app/src/main/res/values/strings.xml',
  'docs/STORE_LISTINGS.md', 'docs/APPLE_REVIEW_NOTES.md', 'docs/FEATURES_V2.md', 'docs/TRANSLATIONS.md', 'docs/RESEARCH.md', 'README.md', 'qa/qa.mjs'];
let n = 0; for (const f of files) { if (!fs.existsSync(f)) continue; const s = fs.readFileSync(f, 'utf8'), r = s.split(b.applied).join(b.name); if (r !== s) { fs.writeFileSync(f, r); n++; console.log('updated', f); } }
b.applied = b.name; fs.writeFileSync('brand.json', JSON.stringify(b, null, 1) + '\n'); console.log(`renamed in ${n} files. Then: npm run build && npx cap sync`);
