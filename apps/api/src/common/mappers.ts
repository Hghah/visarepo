import type { CountryDetail, CountrySummary, Entry, EntryType } from '@stamped/core';
import type { countries, entries, seasonRegions } from '../database/schema.js';

type CountryRow = typeof countries.$inferSelect;
type EntryRow = typeof entries.$inferSelect;
type SeasonRow = typeof seasonRegions.$inferSelect;

export function toCountrySummary(c: CountryRow): CountrySummary {
  return { code: c.code, name: c.name, slug: c.slug, region: c.region, cover: c.cover, takesThe: c.takesThe };
}

export function toCountryDetail(c: CountryRow, regions: SeasonRow[]): CountryDetail {
  return {
    ...toCountrySummary(c),
    airportCode: c.airportCode,
    airportCity: c.airportCity,
    nearNote: c.nearNote,
    season: c.seasonMonths
      ? {
          months: c.seasonMonths,
          note: c.seasonNote ?? '',
          regions: [...regions].sort((a, b) => a.position - b.position).map((r) => ({ label: r.label, months: r.months })),
        }
      : null,
  };
}

export function toEntry(e: EntryRow): Entry {
  return {
    passport: e.passportCode,
    destination: e.destinationCode,
    type: e.type,
    days: e.days,
    ext: e.ext,
    fee: e.fee,
    process: e.process,
    note: e.note,
    stamp: e.stamp,
    apply: e.apply ?? null,
    form: e.form ?? null,
    options: e.options,
    source: e.source,
    checked: e.checked,
  };
}

/** Rank among scores sorted highest first; equal scores share the better rank. */
export function rankOf(score: number, sortedDesc: readonly number[]): number {
  let higher = 0;
  for (const s of sortedDesc) {
    if (s > score) higher++;
    else break;
  }
  return higher + 1;
}

export function countsRecord(rows: { type: EntryType; n: number }[]): Partial<Record<EntryType, number>> {
  const out: Partial<Record<EntryType, number>> = {};
  for (const r of rows) out[r.type] = Number(r.n);
  return out;
}
