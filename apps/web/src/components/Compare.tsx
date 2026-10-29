'use client';
import { COUNTRIES, type PassportRow } from '@stamped/core';
import type { CSSProperties } from 'react';
import { useMemo, useState } from 'react';
import { Chips, MixBar, effectiveFilter } from './Chips';
import { filterRows, tallyRows, type TypeFilter } from '@/lib/filter';
import { usePassportSwitch } from '@/lib/passport.client';
import { inlineLabel, presentTypes, rowTag } from '@/lib/rows';

function Row({ row, me, onPick, hidden }: { row: PassportRow; me: boolean; onPick: (code: string) => void; hidden?: boolean }) {
  return (
    <button
      type="button"
      className={`ppr${me ? ' is-me' : ''}`}
      aria-pressed={me}
      hidden={hidden}
      onClick={() => onPick(row.code)}
      data-passport={row.code}
    >
      <span className="mini" style={{ '--cover': row.cover } as CSSProperties}>
        {row.code}
      </span>
      <span className="ppn">
        <b>{row.name}</b>
        <small>
          <i className={`dt mx-${row.type}`} />
          {rowTag(row)}
          {row.days ? ` · ${row.days} days` : ''}
        </small>
      </span>
      <span className="ppfee">{row.fee}</span>
    </button>
  );
}

/** Every passport's entry to one destination. Picking one switches the page to that passport. */
export function Compare({ destinationName, rows, passport }: { destinationName: string; rows: PassportRow[]; passport: string }) {
  const [switchPassport] = usePassportSwitch();
  const [chosen, setChosen] = useState<TypeFilter>('all');
  const [query, setQuery] = useState('');
  const { counts, multi } = useMemo(() => tallyRows(rows), [rows]);
  const filter = effectiveFilter(chosen, counts, multi);
  const others = useMemo(() => rows.filter((r) => r.code !== passport), [rows, passport]);
  const visible = useMemo(() => new Set(filterRows(others, filter, query).map((r) => r.code)), [others, filter, query]);
  const me = rows.find((r) => r.code === passport);

  return (
    <aside className="cmp" aria-label="Compare passports">
      <div className="cmp-top">
        <h2>
          {destinationName} for all {COUNTRIES.length} passports
        </h2>
        <p className="cmp-sum">
          {presentTypes(counts).map((k) => (
            <span key={k}>
              <b>{counts[k]}</b> {inlineLabel(k)}
            </span>
          ))}
          {multi > 0 && (
            <span>
              <b>{multi}</b> with 2+ options
            </span>
          )}
        </p>
      </div>
      <MixBar counts={counts} />
      <Chips counts={counts} multi={multi} total={rows.length} value={filter} onChange={setChosen} />
      <input
        type="search"
        id="ppq"
        placeholder={`Search ${COUNTRIES.length} passports`}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        autoComplete="off"
        aria-label="Search passports"
      />
      {me && (
        <div className="yours">
          <span className="lbl">Your passport</span>
          <Row row={me} me onPick={switchPassport} />
        </div>
      )}
      <div className="pplist" id="pplist">
        {others.map((r) => (
          <Row key={r.code} row={r} me={false} onPick={switchPassport} hidden={!visible.has(r.code)} />
        ))}
        <p className="empty" hidden={visible.size > 0}>
          No passport matches that search.
        </p>
      </div>
      <p className="fine">Ordinary passports, tourism trips. Tap one to switch the page to it.</p>
    </aside>
  );
}
