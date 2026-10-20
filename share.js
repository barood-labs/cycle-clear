// Partner sharing with no server: encrypted link (AES-GCM, PBKDF2 passcode), .ics file, or plain text.
const enc = new TextEncoder(), dec = new TextDecoder();
const b64u = u => btoa(String.fromCharCode(...u)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const ub64 = s => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
const ALPH = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const newPass = () => [...crypto.getRandomValues(new Uint8Array(10))].map(b => ALPH[b % ALPH.length]).join('').replace(/(.{5})/, '$1-');
async function key(pass, salt) { const k = await crypto.subtle.importKey('raw', enc.encode(pass.toUpperCase().replace(/[^A-Z0-9]/g, '')), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 200000, hash: 'SHA-256' }, k, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']); }
export async function seal(obj, pass) { const salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await key(pass, salt), enc.encode(JSON.stringify(obj))));
  return 'c1.' + b64u(new Uint8Array([...salt, ...iv, ...ct])); }
export async function open(payload, pass) { const raw = ub64(payload.replace(/^c1\./, '')), salt = raw.slice(0, 16), iv = raw.slice(16, 28), ct = raw.slice(28);
  return JSON.parse(dec.decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, await key(pass, salt), ct))); }
const icsDate = s => s.replace(/-/g, ''), stamp = () => new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
const fold = s => s.replace(/[,;\\]/g, m => '\\' + m);
// events: [{uid, start:'YYYY-MM-DD', endExcl:'YYYY-MM-DD', title}]
export function ics(events, cancel = false) { const L = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Virabloom//EN', 'CALSCALE:GREGORIAN', `METHOD:${cancel ? 'CANCEL' : 'PUBLISH'}`];
  for (const e of events) L.push('BEGIN:VEVENT', `UID:${e.uid}`, `DTSTAMP:${stamp()}`, `DTSTART;VALUE=DATE:${icsDate(e.start)}`, `DTEND;VALUE=DATE:${icsDate(e.endExcl)}`, `SUMMARY:${fold(e.title)}`,
    `SEQUENCE:${cancel ? 1 : 0}`, `STATUS:${cancel ? 'CANCELLED' : 'CONFIRMED'}`, 'TRANSP:TRANSPARENT', 'END:VEVENT');
  L.push('END:VCALENDAR'); return L.join('\r\n') + '\r\n'; }
