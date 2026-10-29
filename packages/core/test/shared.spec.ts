import { describe, expect, it } from 'vitest';
import { buildFlightLinks } from '../src/shared/flights.js';
import { resolveCity } from '../src/shared/cities.js';
import { countryBySlug, fromName } from '../src/shared/countries.js';
import { entrySentence, entryTag, stayText } from '../src/shared/text.js';
import type { EntryOption } from '../src/shared/types.js';

describe('resolveCity', () => {
  it.each([
    ['Delhi', 'DEL'],
    ['ho chi minh city', 'SGN'],
    ['Saigon', 'SGN'],
    ['Bangalore', 'BLR'],
    ['São Paulo', 'GRU'],
    ['Sao Paulo', 'GRU'],
    ['dxb', 'DXB'],
    ['Goa', 'GOI'],
    ['Ho Chi', 'SGN'],
  ])('resolves %s to %s', (input, code) => {
    expect(resolveCity(input)?.code).toBe(code);
  });

  it('keeps unknown cities with no airport code', () => {
    expect(resolveCity('Pokhara')).toEqual({ name: 'Pokhara', code: null, country: null });
  });

  it('returns null for empty input', () => {
    expect(resolveCity('  ')).toBeNull();
  });
});

describe('buildFlightLinks', () => {
  const base = { depart: '2026-12-12', ret: '2027-01-01', passengers: 2, cabin: 'business' as const };

  it('builds all four links when both cities are known', () => {
    const links = buildFlightLinks({ ...base, from: resolveCity('Mumbai')!, to: resolveCity('Hanoi')! });
    expect(links.map((l) => l.provider)).toEqual(['Skyscanner', 'Google Flights', 'Kayak', 'Aviasales']);
    expect(links[0]!.url).toBe('https://www.skyscanner.net/transport/flights/bom/han/261212/270101/?adultsv2=2&cabinclass=business&rtn=1');
    expect(links[2]!.url).toBe('https://www.kayak.com/flights/BOM-HAN/2026-12-12/2027-01-01/2adults/business?sort=price_a');
    expect(links[3]!.url).toBe('https://www.aviasales.com/search/BOM1212HAN01012');
  });

  it('falls back to Google Flights for an unknown city', () => {
    const links = buildFlightLinks({ ...base, ret: null, from: resolveCity('Pokhara')!, to: resolveCity('Hanoi')! });
    expect(links.map((l) => l.provider)).toEqual(['Google Flights']);
    expect(decodeURIComponent(links[0]!.url)).toContain('Flights from Pokhara to Hanoi on 2026-12-12 one way business class for 2 adults');
  });
});

describe('text helpers', () => {
  const opt = (type: EntryOption['type'], act: string): EntryOption => ({
    type,
    act,
    label: type,
    days: 30,
    fee: 'x',
    where: '',
    url: null,
  });

  it('describes multiple options in one sentence', () => {
    const e = {
      type: 'voa' as const,
      days: 30,
      options: [opt('voa', 'get a visa when you land'), opt('evisa', 'apply for an e-visa online before you fly')],
    };
    expect(entryTag(e)).toBe('VOA or e-Visa');
    expect(entrySentence(e, true)).toBe('Two ways in: get a visa when you land, or apply for an e-visa online before you fly.');
  });

  it('formats stays', () => {
    expect(stayText({ type: 'free', days: 90 })).toBe('90 days');
    expect(stayText({ type: 'visa', days: null })).toBe('Per visa');
    expect(stayText({ type: 'home', days: null })).toBe('No limit');
  });

  it('adds "the" where English needs it', () => {
    expect(fromName(countryBySlug('united-kingdom')!)).toBe('the United Kingdom');
    expect(fromName(countryBySlug('india')!)).toBe('India');
  });
});
