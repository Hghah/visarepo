import { CITIES, CITY_ALIASES } from './cities.data.js';
import type { City } from './types.js';

export { CITIES };

/** Lower-case, accent-free, single-spaced form used for matching typed city names. */
export function normalizeCityName(t: string): string {
  return t
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

const CODE_INDEX = new Map<string, City>();
const NAME_INDEX = new Map<string, City>();
for (const c of CITIES) {
  if (!CODE_INDEX.has(c.code)) CODE_INDEX.set(c.code, c);
  const k = normalizeCityName(c.name);
  if (!NAME_INDEX.has(k)) NAME_INDEX.set(k, c);
}
for (const [alias, code] of Object.entries(CITY_ALIASES)) {
  if (!NAME_INDEX.has(alias)) NAME_INDEX.set(alias, CODE_INDEX.get(code) ?? { name: alias, code, country: null });
}

/** What a typed "From"/"To" value refers to. `code` is null when the city is not recognised. */
export interface ResolvedPlace {
  name: string;
  code: string | null;
  country: string | null;
}

/**
 * Resolve free text to an airport: exact city name or alias, then a 3-letter airport code,
 * then an unambiguous name prefix ("Ho Chi" -> SGN). Unknown text is returned with code null.
 */
export function resolveCity(raw: string | null | undefined): ResolvedPlace | null {
  const t = (raw ?? '').trim();
  if (!t) return null;
  const k = normalizeCityName(t);
  const byName = NAME_INDEX.get(k);
  if (byName) return { name: byName.name, code: byName.code, country: byName.country };
  if (/^[a-z]{3}$/.test(k)) {
    const byCode = CODE_INDEX.get(k.toUpperCase());
    return byCode
      ? { name: byCode.name, code: byCode.code, country: byCode.country }
      : { name: t.toUpperCase(), code: t.toUpperCase(), country: null };
  }
  if (k.length >= 3) {
    const matches = CITIES.filter((c) => normalizeCityName(c.name).startsWith(k));
    if (matches.length === 1) {
      const m = matches[0]!;
      return { name: m.name, code: m.code, country: m.country };
    }
  }
  return { name: t, code: null, country: null };
}
