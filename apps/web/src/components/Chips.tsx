import { TYPE_LABEL, type EntryType } from '@stamped/core';
import type { TypeFilter } from '@/lib/filter';
import { presentTypes } from '@/lib/rows';

interface ChipsProps {
  counts: Partial<Record<EntryType, number>>;
  multi: number;
  total: number;
  value: TypeFilter;
  onChange: (f: TypeFilter) => void;
}

/** Entry-type filter chips with counts. */
export function Chips({ counts, multi, total, value, onChange }: ChipsProps) {
  return (
    <div className="chips" role="group" aria-label="Filter by entry type">
      <button type="button" className="chip" aria-pressed={value === 'all'} onClick={() => onChange('all')}>
        All<b>{total}</b>
      </button>
      {presentTypes(counts).map((k) => (
        <button key={k} type="button" className="chip" aria-pressed={value === k} onClick={() => onChange(k)}>
          <i className={`dt mx-${k}`} />
          {TYPE_LABEL[k]}
          <b>{counts[k]}</b>
        </button>
      ))}
      {multi > 0 && (
        <button type="button" className="chip" aria-pressed={value === 'multi'} onClick={() => onChange('multi')}>
          2+ options<b>{multi}</b>
        </button>
      )}
    </div>
  );
}

export function MixBar({ counts }: { counts: Partial<Record<EntryType, number>> }) {
  return (
    <div className="mixbar" aria-hidden="true">
      {presentTypes(counts).map((k) => (
        <span key={k} className={`mx-${k}`} style={{ flex: counts[k] }} />
      ))}
    </div>
  );
}

/** Fall back to "All" when the chosen type has no rows for this passport. */
export function effectiveFilter(f: TypeFilter, counts: Partial<Record<EntryType, number>>, multi: number): TypeFilter {
  if (f === 'all') return f;
  return (f === 'multi' ? multi : counts[f]) ? f : 'all';
}
