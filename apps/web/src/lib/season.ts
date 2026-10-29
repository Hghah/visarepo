import { MONTHS } from '@stamped/core';

/**
 * Month spans whose level is in `levels`, e.g. "Nov–Mar, Jul" for a 12-letter season string.
 * Spans wrap around the year end. Returns "All year" or "" when every or no month matches.
 */
export function monthRanges(months: string, levels: string): string {
  const on = [...months].map((c) => levels.includes(c));
  if (on.length !== 12) return '';
  if (on.every(Boolean)) return 'All year';
  if (!on.some(Boolean)) return '';
  const startsRun = (i: number) => on[i] && !on[(i + 11) % 12];
  const first = on.findIndex((_, i) => startsRun(i));
  const out: string[] = [];
  for (let k = 0; k < 12; k++) {
    const i = (first + k) % 12;
    if (!startsRun(i)) continue;
    let j = i;
    while (on[(j + 1) % 12] && (j + 1) % 12 !== i) j = (j + 1) % 12;
    out.push(i === j ? MONTHS[i] : `${MONTHS[i]}–${MONTHS[j]}`);
  }
  return out.join(', ');
}
