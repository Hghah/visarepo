import { COUNTRIES } from './countries.data.js';
import type { CountryRef } from './types.js';

export { COUNTRIES };

const BY_CODE = new Map(COUNTRIES.map((c) => [c.code, c]));
const BY_SLUG = new Map(COUNTRIES.map((c) => [c.slug, c]));

export const REGIONS = ['Africa', 'Americas', 'Asia', 'Europe', 'Middle East', 'Oceania'] as const;

export function countryByCode(code: string | null | undefined): CountryRef | undefined {
  return code ? BY_CODE.get(code.toUpperCase()) : undefined;
}

export function countryBySlug(slug: string | null | undefined): CountryRef | undefined {
  return slug ? BY_SLUG.get(slug.toLowerCase()) : undefined;
}

export function isCountryCode(code: unknown): code is string {
  return typeof code === 'string' && BY_CODE.has(code.toUpperCase());
}

/** "the United Kingdom", "India". */
export function fromName(c: CountryRef): string {
  return (c.the ? 'the ' : '') + c.name;
}
