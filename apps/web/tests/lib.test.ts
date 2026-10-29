import type { DestinationRow } from '@stamped/core';
import { describe, expect, it } from 'vitest';
import { restoreTrip, type Trip } from '@/components/TripContext';
import { addDays, daysBetween, isoDate, parseISODate, todayISO } from '@/lib/dates';
import { filterRows, tallyRows } from '@/lib/filter';
import { pickPassport, withPassport } from '@/lib/passport';
import { rowTag } from '@/lib/rows';
import { monthRanges } from '@/lib/season';

const row = (
  code: string,
  name: string,
  type: DestinationRow['type'],
  optionTypes: DestinationRow['optionTypes'] = [type],
): DestinationRow => ({
  code,
  name,
  slug: name.toLowerCase(),
  region: 'Asia',
  type,
  days: 30,
  fee: 'Free',
  optionTypes,
});

describe('monthRanges', () => {
  it('joins runs and wraps around the new year', () => {
    expect(monthRanges('BBGSSXXXSBBB', 'B')).toBe('Oct–Feb');
    expect(monthRanges('SGBBGSSSGBBG', 'B')).toBe('Mar–Apr, Oct–Nov');
    expect(monthRanges('BBBBBBBBBBBB', 'B')).toBe('All year');
    expect(monthRanges('GGGGGGGGGGGG', 'B')).toBe('');
    expect(monthRanges('BBGSSXXXSGBB', 'X')).toBe('Jun–Aug');
  });
});

describe('dates', () => {
  it('parses only real calendar dates', () => {
    expect(parseISODate('2026-02-28')?.getUTCDate()).toBe(28);
    expect(parseISODate('2026-02-30')).toBeNull();
    expect(parseISODate('12/12/2026')).toBeNull();
  });

  it('adds days across month ends', () => {
    const d = parseISODate('2026-12-25')!;
    expect(isoDate(addDays(d, 14))).toBe('2027-01-08');
    expect(daysBetween(d, addDays(d, 20))).toBe(20);
    expect(todayISO(new Date('2026-10-29T23:30:00Z'))).toBe('2026-10-29');
  });
});

describe('passport selection', () => {
  it('prefers the URL, then the cookie, then India', () => {
    expect(pickPassport('de', 'GB')).toBe('DE');
    expect(pickPassport(undefined, 'gb')).toBe('GB');
    expect(pickPassport('ZZ', 'nope')).toBe('IN');
    expect(pickPassport(['fr', 'de'], null)).toBe('FR');
    expect(withPassport('/vietnam', 'GB')).toBe('/vietnam?passport=GB');
  });
});

describe('board filtering', () => {
  const rows = [
    row('VN', 'Vietnam', 'free', ['free', 'evisa']),
    row('TH', 'Thailand', 'free'),
    row('CN', 'China', 'visa'),
    row('CI', "Côte d'Ivoire", 'evisa'),
  ];

  it('filters by type, multi-option and accent-insensitive search', () => {
    expect(filterRows(rows, 'free', '').map((r) => r.code)).toEqual(['VN', 'TH']);
    expect(filterRows(rows, 'multi', '').map((r) => r.code)).toEqual(['VN']);
    expect(filterRows(rows, 'all', 'cote').map((r) => r.code)).toEqual(['CI']);
    expect(filterRows(rows, 'visa', 'viet')).toEqual([]);
  });

  it('tallies types and multi-option rows', () => {
    expect(tallyRows(rows)).toEqual({ counts: { free: 2, visa: 1, evisa: 1 }, multi: 1 });
  });

  it('labels multi-option rows with every way in', () => {
    expect(rowTag(rows[0]!, ' / ')).toBe('Visa-free / e-Visa');
    expect(rowTag(rows[2]!)).toBe('Visa required');
  });
});

describe('restoreTrip', () => {
  const base: Trip = { depart: '2026-11-28', nights: 14, kind: 'return', passengers: 1, cabin: 'economy', from: '' };

  it('keeps valid saved values', () => {
    const saved = JSON.stringify({ depart: '2027-01-10', nights: 20, kind: 'oneway', passengers: 3, cabin: 'business', from: 'Mumbai' });
    expect(restoreTrip(saved, base, '2026-10-29')).toEqual({
      depart: '2027-01-10',
      nights: 20,
      kind: 'oneway',
      passengers: 3,
      cabin: 'business',
      from: 'Mumbai',
    });
  });

  it('drops past dates and garbage', () => {
    const saved = JSON.stringify({ depart: '2025-01-01', nights: 9999, passengers: 40, cabin: 'first' });
    expect(restoreTrip(saved, base, '2026-10-29')).toEqual({ ...base, nights: 365, passengers: 6 });
    expect(restoreTrip('{not json', base, '2026-10-29')).toEqual(base);
  });
});
