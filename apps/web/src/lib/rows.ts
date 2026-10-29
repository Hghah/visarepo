import { TYPE_LABEL, TYPE_ORDER, TYPE_SHORT, type EntryType } from '@stamped/core';

/** Label for a list row: the entry type, or every way in ("VOA or e-Visa") when there are several. */
export function rowTag(row: { type: EntryType; optionTypes: readonly EntryType[] }, sep = ' or '): string {
  if (row.optionTypes.length < 2) return TYPE_LABEL[row.type];
  return [...new Set(row.optionTypes.map((t) => TYPE_SHORT[t]))].join(sep);
}

/** Entry types present in `counts`, in display order. */
export const presentTypes = (counts: Partial<Record<EntryType, number>>): EntryType[] => TYPE_ORDER.filter((k) => counts[k]);

/** Lower-case label used inside sentences ("12 visa-free, 3 eTA"). */
export const inlineLabel = (t: EntryType): string => (t === 'eta' ? 'eTA' : TYPE_LABEL[t].toLowerCase());
