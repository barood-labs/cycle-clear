// Pure prediction logic (estimates only). Dates are 'YYYY-MM-DD' strings; maths on UTC day numbers to avoid DST bugs.
export const dn = s => { const [y, m, d] = s.split('-').map(Number); return Date.UTC(y, m - 1, d) / 864e5; };
export const ds = n => new Date(n * 864e5).toISOString().slice(0, 10);
export const todayStr = () => { const d = new Date(); return ds(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 864e5); };
const mean = a => a.reduce((x, y) => x + y, 0) / a.length;
export function stats(periods, set) {
  const p = [...periods].sort((a, b) => dn(a.start) - dn(b.start));
  const cyc = []; for (let i = 1; i < p.length; i++) { const c = dn(p[i].start) - dn(p[i - 1].start); if (c >= 15 && c <= 60) cyc.push(c); }
  const lens = p.filter(x => x.end).map(x => dn(x.end) - dn(x.start) + 1).filter(l => l >= 1 && l <= 15);
  const cycleLen = cyc.length ? Math.round(mean(cyc.slice(-6))) : set.cycleLen;
  const periodLen = lens.length ? Math.round(mean(lens.slice(-6))) : set.periodLen;
  return { sorted: p, cycles: cyc, cycleLen, periodLen, logged: cyc.length };
}
export function predict(periods, set, today = todayStr(), count = 6) {
  const st = stats(periods, set); if (!st.sorted.length) return { ...st, none: true };
  const last = st.sorted[st.sorted.length - 1], L = dn(last.start), t = dn(today);
  const lastEnd = last.end ? dn(last.end) : Math.min(L + st.periodLen - 1, Math.max(t, L));
  const next = L + st.cycleLen, future = [];
  for (let k = 0; k < count; k++) { const s = next + k * st.cycleLen, ov = s - 14; future.push({ start: s, end: s + st.periodLen - 1, ov, fs: ov - 5, fe: ov + 1 }); }
  const onPeriod = t >= L && t <= lastEnd && (last.end || t - L < 10);
  return { ...st, last, open: !last.end && t - L < 10, cycleDay: t - L + 1, onPeriod, periodDay: t - L + 1, next, daysTo: next - t, future };
}
// Classify a day for the calendar.
export function dayKind(d, periods, pr) {
  const n = dn(d);
  for (const p of periods) { const s = dn(p.start), e = p.end ? dn(p.end) : s + (pr.periodLen || 5) - 1; if (n >= s && n <= e) return 'period'; }
  if (!pr || pr.none) return '';
  for (const f of pr.future) { if (n >= f.start && n <= f.end) return 'predicted'; if (n === f.ov) return 'ovulation'; if (n >= f.fs && n <= f.fe) return 'fertile'; }
  return '';
}
