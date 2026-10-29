export const ENTRY_TYPES = ['free', 'voa', 'eta', 'evisa', 'visa', 'none', 'home'] as const;
export type EntryType = (typeof ENTRY_TYPES)[number];

export const ENTRY_SOURCES = ['curated', 'dataset', 'wikipedia', 'override', 'ban', 'home'] as const;
/** Where an entry rule comes from: hand-checked rules, the open dataset, Wikipedia cross-check, a destination-wide fix, the US ban, or the traveller's own country. */
export type EntrySource = (typeof ENTRY_SOURCES)[number];

export interface CountryRef {
  /** ISO 3166-1 alpha-2 code (XK for Kosovo). */
  code: string;
  name: string;
  slug: string;
  region: string;
  /** Passport cover colour, used for the small booklet graphic. */
  cover: string;
  /** Whether the name takes "the" in a sentence ("from the United Kingdom"). */
  the: boolean;
}

export interface City {
  name: string;
  /** IATA airport code. */
  code: string;
  /** ISO country code, or null when unknown. */
  country: string | null;
}

/** One way to enter a country, e.g. visa on arrival or e-visa. */
export interface EntryOption {
  type: EntryType;
  label: string;
  days: number | null;
  fee: string;
  where: string;
  url: string | null;
  /** Short verb phrase used in sentences: "apply for an e-visa online before you fly". */
  act: string;
}

export interface Link {
  label: string;
  url: string;
}

export interface ArrivalForm {
  name: string;
  short: string;
  url: string;
}

/** The resolved entry rule for one passport travelling to one destination. */
export interface Entry {
  passport: string;
  destination: string;
  type: EntryType;
  days: number | null;
  /** Days an in-country extension adds (0 when none). */
  ext: number;
  fee: string;
  process: string;
  note: string;
  /** Short words printed on the entry stamp: [kind, stay, fee?]. */
  stamp: string[];
  apply: Link | null;
  form: ArrivalForm | null;
  /** Every way in, the main one first. Length > 1 means the traveller can choose. */
  options: EntryOption[];
  source: EntrySource;
  /** True when the rule was verified on the cross-check date rather than taken from the dataset as-is. */
  checked: boolean;
}

export interface SeasonInfo {
  /** 12 characters, January to December: B best, G good, S mixed, X avoid. */
  months: string;
  note: string;
  regions: { label: string; months: string }[];
}
