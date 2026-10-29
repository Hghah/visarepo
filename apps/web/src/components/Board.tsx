'use client';
import { COUNTRIES, stayText, type DestinationRow } from '@stamped/core';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Chips, effectiveFilter } from './Chips';
import { Flap } from './Flap';
import { filterRows, tallyRows, type TypeFilter } from '@/lib/filter';
import { withPassport } from '@/lib/passport';
import { rowTag } from '@/lib/rows';

/** Rows that animate like a split-flap board when the page opens. */
const FLAP_ROWS = 14;

/** The departures board: every destination for one passport, filterable by entry type and name. */
export function Board({ rows, passport }: { rows: DestinationRow[]; passport: string }) {
  const [chosen, setChosen] = useState<TypeFilter>('all');
  const [query, setQuery] = useState('');
  const { counts, multi } = useMemo(() => tallyRows(rows), [rows]);
  const filter = effectiveFilter(chosen, counts, multi);
  const visible = useMemo(() => new Set(filterRows(rows, filter, query).map((r) => r.code)), [rows, filter, query]);

  return (
    <div className="board">
      <div className="board-tools">
        <Chips counts={counts} multi={multi} total={rows.length} value={filter} onChange={setChosen} />
        <input
          type="search"
          id="dq"
          placeholder={`Search ${COUNTRIES.length} destinations`}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoComplete="off"
          aria-label="Search destinations"
        />
      </div>
      <div className="bcols" aria-hidden="true">
        <span>Code</span>
        <span>Destination</span>
        <span>Entry</span>
        <span>Max stay</span>
        <span>Region</span>
      </div>
      <div className="dlist" id="dlist" data-testid="board">
        {rows.map((r, i) => {
          const label = rowTag(r, ' / ');
          return (
            <Link
              key={r.code}
              className="drow"
              href={withPassport(`/${r.slug}`, passport)}
              hidden={!visible.has(r.code)}
              data-type={r.type}
            >
              <span className="c">{r.code}</span>
              <b>{r.name}</b>
              <span className="en">
                <i className={`lamp l-${r.type}`} />
                <span className="tx">{i < FLAP_ROWS ? <Flap text={label} delay={i * 45} /> : label}</span>
              </span>
              <span className="st">{stayText(r)}</span>
              <small>{r.region}</small>
            </Link>
          );
        })}
        <p className="empty" hidden={visible.size > 0}>
          No destination matches that search.
        </p>
      </div>
    </div>
  );
}
