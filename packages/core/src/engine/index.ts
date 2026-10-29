import { COUNTRIES } from '../shared/countries.js';
import { MOBILITY_TYPES } from '../shared/labels.js';
import type { Entry, SeasonInfo } from '../shared/types.js';
import { curatedEntry, isCurated } from './curated.js';
import { datasetEntry } from './generic.js';
import { AIR, NEAR, PROF, SEAS, SEAS_DETAIL } from './data/travel.js';

export { CURATED, isCurated, ARRIVAL_FORMS } from './curated.js';
export { WIKI_PP } from './data/overrides.js';

/** Entry rule for one passport travelling to one destination (both ISO codes). */
export function resolveEntry(passport: string, destination: string): Entry {
  const pp = passport.toUpperCase();
  const dest = destination.toUpperCase();
  return isCurated(dest) ? curatedEntry(dest, pp) : datasetEntry(dest, pp);
}

/** Every passport x destination pair (199 x 199 = 39,601 entries). */
export function resolveAllEntries(): Entry[] {
  const out: Entry[] = [];
  for (const d of COUNTRIES) for (const p of COUNTRIES) out.push(resolveEntry(p.code, d.code));
  return out;
}

export function seasonFor(code: string): SeasonInfo | null {
  const s = SEAS[code];
  if (!s) return null;
  const detail = SEAS_DETAIL[code];
  return {
    months: s.m,
    note: detail?.note ?? PROF[s.p] ?? '',
    regions: detail ? detail.rows.map(([label, months]) => ({ label, months })) : [{ label: 'All regions', months: s.m }],
  };
}

export interface CountrySeed {
  code: string;
  name: string;
  slug: string;
  region: string;
  cover: string;
  takesThe: boolean;
  airportCode: string | null;
  airportCity: string | null;
  nearNote: string | null;
  season: SeasonInfo | null;
}

/** Reference data for every country, used to seed the database. */
export function countrySeeds(): CountrySeed[] {
  return COUNTRIES.map((c) => {
    const air = AIR[c.code];
    return {
      code: c.code,
      name: c.name,
      slug: c.slug,
      region: c.region,
      cover: c.cover,
      takesThe: c.the,
      airportCode: air?.[0] ?? null,
      airportCity: air?.[1] ?? null,
      nearNote: NEAR[c.code] ?? null,
      season: seasonFor(c.code),
    };
  });
}

/** Mobility score: destinations a passport can enter without applying in advance (visa-free, on arrival or eTA). */
export function mobilityScores(entries: readonly Entry[] = resolveAllEntries()): Map<string, number> {
  const scores = new Map<string, number>(COUNTRIES.map((c) => [c.code, 0]));
  for (const e of entries) {
    if (e.passport !== e.destination && MOBILITY_TYPES.includes(e.type)) scores.set(e.passport, (scores.get(e.passport) ?? 0) + 1);
  }
  return scores;
}
