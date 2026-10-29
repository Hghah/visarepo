import 'server-only';
import type { CountryDetail, DestinationRow, EntryDetail, PassportRow, PassportSummary } from '@stamped/core';
import { cacheLife, cacheTag } from 'next/cache';
import { API_URL, INTERNAL_API_TOKEN } from './config';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function get<T>(path: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}/api/v1${path}`, {
      headers: { accept: 'application/json', ...(INTERNAL_API_TOKEN ? { 'x-internal-token': INTERNAL_API_TOKEN } : {}) },
      signal: AbortSignal.timeout(10_000),
    });
  } catch (err) {
    throw new ApiError(`Entry-rules service unreachable: ${err instanceof Error ? err.message : String(err)}`, 503);
  }
  if (!res.ok) throw new ApiError(`GET ${path} failed with ${res.status}`, res.status);
  return (await res.json()) as T;
}

/* Rule data only changes when a new data set is deployed, so results are cached for hours. */

export async function getPassportSummary(passport: string): Promise<PassportSummary> {
  'use cache';
  cacheLife('hours');
  cacheTag('dataset', `passport:${passport}`);
  return get(`/passports/${passport}/summary`);
}

export async function getPassportDestinations(passport: string): Promise<DestinationRow[]> {
  'use cache';
  cacheLife('hours');
  cacheTag('dataset', `passport:${passport}`);
  return get(`/passports/${passport}/destinations`);
}

export async function getEntry(passport: string, destination: string): Promise<EntryDetail> {
  'use cache';
  cacheLife('hours');
  cacheTag('dataset', `entry:${passport}:${destination}`);
  return get(`/entries/${passport}/${destination}`);
}

export async function getDestinationPassports(destination: string): Promise<PassportRow[]> {
  'use cache';
  cacheLife('hours');
  cacheTag('dataset', `destination:${destination}`);
  return get(`/destinations/${destination}/passports`);
}

export async function getCountry(code: string): Promise<CountryDetail> {
  'use cache';
  cacheLife('hours');
  cacheTag('dataset', `country:${code}`);
  return get(`/countries/${code}`);
}
