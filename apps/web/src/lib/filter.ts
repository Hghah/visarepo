import type { EntryType } from '@stamped/core';

export type TypeFilter = EntryType | 'all' | 'multi';

export interface FilterableRow {
  name: string;
  type: EntryType;
  optionTypes: EntryType[];
}

/** Rows matching the chosen entry-type chip and the search text (case- and accent-insensitive). */
export function filterRows<T extends FilterableRow>(rows: readonly T[], filter: TypeFilter, query: string): T[] {
  const q = fold(query.trim());
  return rows.filter(
    (r) => (filter === 'all' || (filter === 'multi' ? r.optionTypes.length > 1 : r.type === filter)) && (!q || fold(r.name).includes(q)),
  );
}

export function tallyRows(rows: readonly FilterableRow[]): { counts: Partial<Record<EntryType, number>>; multi: number } {
  const counts: Partial<Record<EntryType, number>> = {};
  let multi = 0;
  for (const r of rows) {
    counts[r.type] = (counts[r.type] ?? 0) + 1;
    if (r.optionTypes.length > 1) multi++;
  }
  return { counts, multi };
}

const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
