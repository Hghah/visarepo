import { isCountryCode } from '@stamped/core';

export const PASSPORT_COOKIE = 'stamped_pp';
export const DEFAULT_PASSPORT = 'IN';
export const PASSPORT_PARAM = 'passport';

/** Upper-cased ISO code when valid, otherwise null. */
export function normalizePassport(value: unknown): string | null {
  const v = Array.isArray(value) ? value[0] : value;
  return typeof v === 'string' && isCountryCode(v) ? v.toUpperCase() : null;
}

/** The passport in the URL wins, then the remembered one, then the default. */
export function pickPassport(fromUrl: unknown, fromCookie: unknown): string {
  return normalizePassport(fromUrl) ?? normalizePassport(fromCookie) ?? DEFAULT_PASSPORT;
}

export function withPassport(path: string, passport: string): string {
  return `${path}?${PASSPORT_PARAM}=${passport}`;
}
