import type { EntryType } from './types.js';

/** Order used for counts, filters and status bars. */
export const TYPE_ORDER: readonly EntryType[] = ['free', 'voa', 'eta', 'evisa', 'visa', 'none', 'home'];

export const TYPE_LABEL: Readonly<Record<EntryType, string>> = {
  free: 'Visa-free',
  evisa: 'e-Visa',
  voa: 'Visa on arrival',
  eta: 'eTA',
  visa: 'Visa required',
  none: 'No entry',
  home: 'Citizen',
};

export const TYPE_SHORT: Readonly<Record<EntryType, string>> = {
  free: 'Visa-free',
  voa: 'VOA',
  eta: 'eTA',
  evisa: 'e-Visa',
  visa: 'Embassy visa',
  none: 'No entry',
  home: 'Citizen',
};

/** Text printed on an inked entry stamp. */
export const STAMP_LABEL: Readonly<Record<EntryType, string>> = {
  free: 'ADMITTED',
  voa: 'VISA ON ARRIVAL',
  eta: 'ETA GRANTED',
  evisa: 'E-VISA',
  visa: 'VISA REQUIRED',
  none: 'NOT ADMITTED',
  home: 'CITIZEN',
};

/** Entry types that count towards the mobility score: no application before travel. */
export const MOBILITY_TYPES: readonly EntryType[] = ['free', 'voa', 'eta'];

export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const;

export const SEASON_LEVEL: Readonly<Record<string, string>> = { B: 'Best', G: 'Good', S: 'Mixed', X: 'Avoid' };

export const CABINS = { economy: 'Economy', premium: 'Premium economy', business: 'Business' } as const;
export type Cabin = keyof typeof CABINS;

/** Date the rules were cross-checked, and date of the underlying open dataset. */
export const VERIFIED_DATE = '28 Oct 2026';
export const DATASET_DATE = '17 Feb 2026';

/** Destinations whose rules were reviewed in depth (official portals, arrival forms, regional seasons). */
export const CURATED_DESTINATIONS: readonly string[] = ['VN', 'TH', 'PH', 'ID'];
