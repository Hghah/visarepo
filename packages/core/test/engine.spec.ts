import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { mobilityScores, resolveAllEntries, resolveEntry, seasonFor, countrySeeds } from '../src/engine/index.js';
import { COUNTRIES } from '../src/shared/countries.js';
import { CURATED_DESTINATIONS } from '../src/shared/labels.js';
import { CURATED } from '../src/engine/curated.js';

type Golden = Record<
  string,
  { type: string; days: number | null; fee: string; note: string; stamp: string[]; ext: number; apply: unknown; opts: unknown[][] }
>;
const golden = JSON.parse(readFileSync(new URL('./fixtures-golden.json', import.meta.url), 'utf8')) as Golden;

describe('resolveEntry', () => {
  it('matches the reviewed rules for every pair in the regression sample', () => {
    for (const [key, want] of Object.entries(golden)) {
      const [pp, dest] = key.split('>') as [string, string];
      const got = resolveEntry(pp, dest);
      expect({
        key,
        type: got.type,
        days: got.days,
        fee: got.fee,
        note: got.note,
        stamp: got.stamp,
        ext: got.ext,
        apply: got.apply,
      }).toEqual({
        key,
        type: want.type,
        days: want.days,
        fee: want.fee,
        note: want.note,
        stamp: want.stamp,
        ext: want.ext,
        apply: want.apply,
      });
      if (want.opts.length) {
        expect(got.options.map((o) => [o.type, o.label, o.days, o.fee, o.url])).toEqual(want.opts);
      }
    }
  });

  it('lets UK passports into Vietnam visa-free for 45 days, with the e-visa as an alternative', () => {
    const e = resolveEntry('GB', 'VN');
    expect(e.type).toBe('free');
    expect(e.days).toBe(45);
    expect(e.options.map((o) => o.type)).toEqual(['free', 'evisa']);
    expect(e.form?.url).toBe('https://prearrival.immigration.gov.vn');
  });

  it('gives Indian passports three ways into the Philippines', () => {
    const e = resolveEntry('IN', 'PH');
    expect(e.options.map((o) => o.days)).toEqual([14, 30, 59]);
  });

  it('applies the US entry suspension from 1 January 2026', () => {
    expect(resolveEntry('AF', 'US').type).toBe('none');
    expect(resolveEntry('NG', 'US').note).toMatch(/B-1\/B-2/);
    expect(resolveEntry('DE', 'US').type).toBe('eta');
  });

  it('treats a passport in its own country as a citizen', () => {
    const e = resolveEntry('AM', 'AM');
    expect(e.type).toBe('home');
    expect(e.source).toBe('home');
  });

  it('lists both e-visa and visa on arrival for Cambodia', () => {
    const e = resolveEntry('IN', 'KH');
    expect(e.options.map((o) => o.type)).toEqual(['voa', 'evisa']);
    expect(e.options[1]?.url).toBe('https://www.evisa.gov.kh');
  });

  it('is case-insensitive on country codes', () => {
    expect(resolveEntry('gb', 'vn')).toEqual(resolveEntry('GB', 'VN'));
  });
});

describe('resolveAllEntries', () => {
  const all = resolveAllEntries();

  it('covers all 199 x 199 pairs with at least one option each', () => {
    expect(all).toHaveLength(COUNTRIES.length ** 2);
    expect(all.every((e) => e.options.length >= 1)).toBe(true);
  });

  it('computes mobility scores within range, with Afghanistan ranked last', () => {
    const scores = mobilityScores(all);
    const sorted = [...scores.entries()].sort((a, b) => b[1] - a[1]);
    expect(sorted.at(-1)?.[0]).toBe('AF');
    expect(scores.get('DE')).toBeGreaterThan(150);
    for (const [, s] of scores) expect(s).toBeLessThanOrEqual(COUNTRIES.length - 1);
  });
});

describe('reference data', () => {
  it('lists the same in-depth destinations in the shared labels and the engine', () => {
    expect([...CURATED_DESTINATIONS]).toEqual([...CURATED]);
  });

  it('has unique slugs and a season for every country', () => {
    const seeds = countrySeeds();
    expect(new Set(seeds.map((s) => s.slug)).size).toBe(seeds.length);
    expect(seeds.filter((s) => !s.season)).toEqual([]);
  });

  it('breaks Vietnam seasons down by region', () => {
    expect(seasonFor('VN')?.regions).toHaveLength(3);
    expect(seasonFor('JP')?.months).toHaveLength(12);
  });
});
