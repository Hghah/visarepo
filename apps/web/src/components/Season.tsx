'use client';
import { MONTHS, SEASON_LEVEL, type SeasonInfo } from '@stamped/core';
import { useTrip } from './TripContext';
import { parseISODate } from '@/lib/dates';
import { monthRanges } from '@/lib/season';

const LEVELS = ['B', 'G', 'S', 'X'] as const;

/** Month-by-month travel conditions, with the trip's departure month highlighted. */
export function Season({ name, season }: { name: string; season: SeasonInfo }) {
  const { trip } = useTrip();
  const dep = parseISODate(trip.depart);
  const am = dep ? dep.getUTCMonth() : -1;
  const rows: [string, string][] = season.regions.length
    ? season.regions.map((r) => [r.label, r.months])
    : [['All regions', season.months]];
  const best = monthRanges(season.months, 'B');
  const avoid = monthRanges(season.months, 'X');
  const off = monthRanges(season.months, 'SX');

  return (
    <section id="season">
      <div className="sh">
        <h2>When to visit {name}</h2>
        <p>{season.note}</p>
      </div>
      <div className="sea">
        <div className="sea-sum">
          <span className="sea-chip">
            <i className="lg lv-B" />
            Best: {best || 'No standout months'}
          </span>
          {avoid && (
            <span className="sea-chip">
              <i className="lg lv-X" />
              Avoid: {avoid}
            </span>
          )}
          {am >= 0 && (
            <span className="sea-chip mine" data-testid="trip-month">
              Your trip: {MONTHS[am]} · {SEASON_LEVEL[season.months[am]]}
            </span>
          )}
        </div>
        <div className="sea-scroll">
          <div className="sea-grid" role="group" aria-label="Travel conditions by month">
            <span className="sea-lab" aria-hidden="true" />
            {MONTHS.map((m, i) => (
              <span key={m} className={`sea-mon${i === am ? ' now' : ''}`} aria-hidden="true">
                {m}
              </span>
            ))}
            {rows.map(([label, months]) => [
              <span key={`${label}-l`} className="sea-lab">
                {label}
              </span>,
              ...[...months].map((c, i) => (
                <span
                  key={`${label}-${i}`}
                  className={`sm lv-${c}${i === am ? ' now' : ''}`}
                  title={`${MONTHS[i]}: ${SEASON_LEVEL[c]}`}
                  role="img"
                  aria-label={`${MONTHS[i]}: ${SEASON_LEVEL[c]}`}
                />
              )),
            ])}
          </div>
        </div>
        <div className="sea-foot">
          <div className="tlegend">
            {LEVELS.map((k) => (
              <span key={k}>
                <i className={`lg lv-${k}`} />
                {SEASON_LEVEL[k]}
              </span>
            ))}
          </div>
          <p className="fine">
            {off ? `Off-peak months (${off}) usually mean lower fares and fewer crowds.` : 'Demand is fairly even through the year.'}
          </p>
        </div>
      </div>
    </section>
  );
}
