import { ENTRY_SOURCES, ENTRY_TYPES } from '@stamped/core';
import type { ArrivalForm, EntryOption, Link } from '@stamped/core';
import {
  boolean,
  char,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  serial,
  smallint,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';

export const entryType = pgEnum('entry_type', ENTRY_TYPES);
export const entrySource = pgEnum('entry_source', ENTRY_SOURCES);

/** Every country is both a passport and a destination. */
export const countries = pgTable('countries', {
  code: char('code', { length: 2 }).primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  region: text('region').notNull(),
  cover: varchar('cover', { length: 7 }).notNull(),
  takesThe: boolean('takes_the').notNull().default(false),
  airportCode: char('airport_code', { length: 3 }),
  airportCity: text('airport_city'),
  nearNote: text('near_note'),
  seasonMonths: char('season_months', { length: 12 }),
  seasonNote: text('season_note'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

/** Best-time-to-go rows; most countries have one, large ones have a row per region. */
export const seasonRegions = pgTable(
  'season_regions',
  {
    id: serial('id').primaryKey(),
    countryCode: char('country_code', { length: 2 })
      .notNull()
      .references(() => countries.code, { onDelete: 'cascade' }),
    position: smallint('position').notNull(),
    label: text('label').notNull(),
    months: char('months', { length: 12 }).notNull(),
  },
  (t) => [index('season_regions_country_idx').on(t.countryCode)],
);

/** The resolved entry rule for each passport (row) travelling to each destination. */
export const entries = pgTable(
  'entries',
  {
    passportCode: char('passport_code', { length: 2 })
      .notNull()
      .references(() => countries.code, { onDelete: 'cascade' }),
    destinationCode: char('destination_code', { length: 2 })
      .notNull()
      .references(() => countries.code, { onDelete: 'cascade' }),
    type: entryType('type').notNull(),
    days: integer('days'),
    ext: integer('ext').notNull().default(0),
    fee: text('fee').notNull(),
    process: text('process').notNull(),
    note: text('note').notNull(),
    stamp: jsonb('stamp').$type<string[]>().notNull(),
    apply: jsonb('apply').$type<Link | null>(),
    form: jsonb('form').$type<ArrivalForm | null>(),
    options: jsonb('options').$type<EntryOption[]>().notNull(),
    source: entrySource('source').notNull(),
    checked: boolean('checked').notNull().default(false),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.passportCode, t.destinationCode] }),
    index('entries_destination_idx').on(t.destinationCode),
    index('entries_passport_type_idx').on(t.passportCode, t.type),
  ],
);

/** Cities offered in the flight search. */
export const cities = pgTable(
  'cities',
  {
    id: serial('id').primaryKey(),
    name: text('name').notNull().unique(),
    code: char('code', { length: 3 }).notNull(),
    countryCode: char('country_code', { length: 2 }),
  },
  (t) => [index('cities_code_idx').on(t.code)],
);

/** Key/value facts about the loaded data set, such as its version. */
export const datasetMeta = pgTable('dataset_meta', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const schema = { countries, seasonRegions, entries, cities, datasetMeta };
