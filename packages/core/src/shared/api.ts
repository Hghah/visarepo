/** Response shapes of the Stamped REST API (v1), shared by the API and the web app. */
import type { Entry, EntryType, SeasonInfo } from './types.js';

export interface CountrySummary {
  code: string;
  name: string;
  slug: string;
  region: string;
  cover: string;
  takesThe: boolean;
}

export interface CountryDetail extends CountrySummary {
  airportCode: string | null;
  airportCity: string | null;
  nearNote: string | null;
  season: SeasonInfo | null;
}

export interface MobilityScore {
  /** Destinations reachable visa-free, on arrival or with an eTA. */
  score: number;
  /** 1 = strongest. Equal scores share a rank. */
  rank: number;
  /** Number of passports ranked. */
  of: number;
  /** Destinations a passport could reach at most (all countries except its own). */
  possible: number;
  strongest: number;
  /** Every passport's score, highest first, for distribution charts. */
  distribution: number[];
}

export interface PassportSummary {
  passport: CountrySummary;
  counts: Partial<Record<EntryType, number>>;
  /** Destinations offering more than one way in. */
  multi: number;
  mobility: MobilityScore;
}

/** One destination on the departures board for a passport. */
export interface DestinationRow {
  code: string;
  name: string;
  slug: string;
  region: string;
  type: EntryType;
  days: number | null;
  fee: string;
  optionTypes: EntryType[];
}

/** One passport in a destination's comparison list. */
export interface PassportRow {
  code: string;
  name: string;
  cover: string;
  type: EntryType;
  days: number | null;
  fee: string;
  optionTypes: EntryType[];
}

export interface EntryDetail {
  entry: Entry;
  /** Includes the passport country's main airport, shown as the route origin. */
  passport: CountryDetail;
  destination: CountryDetail;
}

export interface MobilityRow {
  code: string;
  name: string;
  score: number;
  rank: number;
}

export interface HealthStatus {
  status: 'ok' | 'error' | 'degraded';
  info?: Record<string, unknown>;
  error?: Record<string, unknown>;
}

/** Version of the rule data shipped in this release; the seed reloads the database when it changes. */
export const DATASET_VERSION = '2026-10-28.1';
