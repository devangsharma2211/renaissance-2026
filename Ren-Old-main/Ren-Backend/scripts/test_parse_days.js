// Quick test for parseDays logic copied from outsiderPassController
function parseDays(input) {
  if (input === null || input === undefined) return [];
  if (typeof input === 'number') {
    const n = Math.floor(input);
    return n >= 1 && n <= 9 ? [n] : [];
  }
  const raw = String(input).trim().toLowerCase();
  if (!raw) return [];
  if (raw.includes('all')) return [1,2,3];
  const days = new Set();
  const tokens = raw.replace(/[;,\/]+/g, ' ').split(/\s+/).map(t => t.trim()).filter(Boolean);
  for (const t of tokens) {
    const rangeMatch = t.match(/^(\d+)\s*-\s*(\d+)$/);
    if (rangeMatch) {
      const start = parseInt(rangeMatch[1], 10);
      const end = parseInt(rangeMatch[2], 10);
      for (let d = Math.max(1, start); d <= Math.min(9, end); d++) days.add(d);
      continue;
    }
    const nums = t.match(/\d+/g);
    if (nums) {
      for (const numStr of nums) {
        const n = parseInt(numStr, 10);
        if (n >=1 && n <=9) days.add(n);
      }
      continue;
    }
    if (t.includes('one') || t.includes('1st')) days.add(1);
    if (t.includes('two') || t.includes('2nd')) days.add(2);
    if (t.includes('three') || t.includes('3rd')) days.add(3);
  }
  return Array.from(days).sort();
}

const samples = ['1', '1, 2', '1, 2, 3', '2', '3', '1-3', 'all', '1;2', '1/2', '1 2'];
for (const s of samples) {
  console.log(s, '->', parseDays(s));
}
