import { DATASET_VERSION, TYPE_LABEL, fromName, type CountrySummary, type PassportSummary } from '@stamped/core';
import type { CSSProperties } from 'react';
import { MixBar } from './Chips';
import { presentTypes } from '@/lib/rows';

/** Machine-readable-zone style: upper-case Latin letters, everything else becomes `<`. */
export const mrz = (s: string): string =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[^A-Z]+/g, '<');

const pct = (v: number, of: number) => `${((v / of) * 100).toFixed(2)}%`;

/** The passport data page: mobility score, rank among all passports and the entry mix. */
export function DataPage({ summary }: { summary: PassportSummary }) {
  const { passport: p, counts, mobility: ms } = summary;
  const book = { '--cover': p.cover, '--gilt': '#E2CF95' } as CSSProperties;
  const checked = DATASET_VERSION.slice(0, 10).replace(/-/g, '');
  const pad = (n: number) => String(n).padStart(3, '0');
  return (
    <div className="dp" role="group" aria-label={`Summary for a passport from ${fromName(asRef(p))}`}>
      <div className="dp-head">
        <span>Passport · type P</span>
        <span className="code">{p.code}</span>
      </div>
      <div className="dp-body">
        <span className="dp-book" style={book}>
          <span>{p.code}</span>
        </span>
        <div>
          <p className="dp-name">{p.name}</p>
          <p className="dp-k">Mobility score</p>
          <p className="dp-big">
            <b data-testid="mobility-score">{ms.score}</b>
            <span>destinations you can enter without applying in advance: visa-free, visa on arrival or eTA</span>
          </p>
        </div>
      </div>
      <div className="ms">
        <div className="ms-top">
          <span>
            Rank <b data-testid="mobility-rank">{ms.rank}</b> of {ms.of} passports
          </span>
          <span>
            Strongest: <b>{ms.strongest}</b>
          </span>
        </div>
        <div
          className="ms-strip"
          role="img"
          aria-label={`Mobility score ${ms.score} of ${ms.possible}, rank ${ms.rank} of ${ms.of}. Each tick is one passport.`}
        >
          {ms.distribution.map((v, i) => (
            <i key={i} style={{ left: pct(v, ms.possible) }} />
          ))}
          <i className="me" style={{ left: pct(ms.score, ms.possible) }} />
        </div>
        <div className="ms-axis">
          <span>0</span>
          <span>Each tick is one passport</span>
          <span>{ms.possible}</span>
        </div>
      </div>
      <MixBar counts={counts} />
      <p className="micro" aria-hidden="true">
        {`PASSPORT · ${p.name.toUpperCase()} · ${p.code} · `.repeat(12)}
      </p>
      <dl className="dp-counts">
        {presentTypes(counts)
          .filter((k) => k !== 'home')
          .map((k) => (
            <div key={k}>
              <dt>
                <i className={`dt mx-${k}`} />
                {TYPE_LABEL[k]}
              </dt>
              <dd>{counts[k]}</dd>
            </div>
          ))}
      </dl>
      <div className="dp-mrz" aria-hidden="true">
        <div>{`P<${p.code}<${mrz(p.name)}<<STAMPED<VISA<TRACKER${'<'.repeat(24)}`}</div>
        <div>{`${pad(ms.possible)}DEST<${pad(ms.score)}MOB<<CHECKED<${checked}<<${p.code}${'<'.repeat(24)}`}</div>
      </div>
    </div>
  );
}

const asRef = (c: CountrySummary) => ({ ...c, the: c.takesThe });
