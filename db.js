// Minimal IndexedDB key-value store. Nothing ever leaves the device.
const open = () => new Promise((res, rej) => { const r = indexedDB.open('cycleclear', 1); r.onupgradeneeded = () => r.result.createObjectStore('kv'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
const tx = async (mode, fn) => { const db = await open(); return new Promise((res, rej) => { const t = db.transaction('kv', mode); const s = t.objectStore('kv'); const r = fn(s); t.oncomplete = () => res(r && r.result); t.onerror = () => rej(t.error); }); };
export const get = k => tx('readonly', s => s.get(k));
export const set = (k, v) => tx('readwrite', s => s.put(v, k));
export const clear = () => tx('readwrite', s => s.clear());
