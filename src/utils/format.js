export function formatDateTime(iso) {
  if (!iso) return 'Date not available';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'Date not available';
  return d.toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

export function formatPercent(v) {
  if (v === null || v === undefined) return null;
  return `${Math.round(v * 100)}%`;
}

export const dayKey = (iso) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/** Counts scans per day for the last `n` days (oldest first). */
export function scansPerDay(scans, n = 14) {
  const out = [];
  const counts = {};
  scans.forEach((s) => {
    if (s.createdAt) counts[dayKey(s.createdAt)] = (counts[dayKey(s.createdAt)] || 0) + 1;
  });
  for (let i = n - 1; i >= 0; i -= 1) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const key = dayKey(d.toISOString());
    out.push({
      key,
      label: d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }),
      scans: counts[key] || 0,
    });
  }
  return out;
}

/** Counts scans by predicted label. */
export function breakdownByDisease(scans) {
  const counts = {};
  scans.forEach((s) => {
    const name = s.disease || 'No label returned';
    counts[name] = (counts[name] || 0) + 1;
  });
  return Object.entries(counts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}
