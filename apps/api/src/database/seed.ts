import { CITIES, DATASET_VERSION } from '@stamped/core';
import { countrySeeds, resolveAllEntries } from '@stamped/core/engine';
import { eq, sql } from 'drizzle-orm';
import type { Database } from './database.js';
import { cities, countries, datasetMeta, entries, seasonRegions } from './schema.js';

export type SeedMode = 'always' | 'if-stale' | 'never';

export interface SeedResult {
  seeded: boolean;
  version: string;
  countries: number;
  entries: number;
  cities: number;
}

const BATCH = 1000;

export async function loadedVersion(db: Database): Promise<string | null> {
  const [row] = await db.select().from(datasetMeta).where(eq(datasetMeta.key, 'version')).limit(1);
  return row?.value ?? null;
}

/**
 * Load reference data and all 39,601 entry rules in one transaction. Safe to run repeatedly:
 * countries are upserted, the other tables are replaced. In "if-stale" mode nothing happens when
 * the database already holds this release's data set version.
 */
export async function seed(db: Database, mode: SeedMode = 'if-stale'): Promise<SeedResult> {
  if (mode === 'never') return { seeded: false, version: (await loadedVersion(db)) ?? 'none', countries: 0, entries: 0, cities: 0 };
  if (mode === 'if-stale' && (await loadedVersion(db)) === DATASET_VERSION) {
    return { seeded: false, version: DATASET_VERSION, countries: 0, entries: 0, cities: 0 };
  }

  const seeds = countrySeeds();
  const all = resolveAllEntries();
  const now = new Date();

  await db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(814201)`);
    await tx
      .insert(countries)
      .values(
        seeds.map((c) => ({
          code: c.code,
          name: c.name,
          slug: c.slug,
          region: c.region,
          cover: c.cover,
          takesThe: c.takesThe,
          airportCode: c.airportCode,
          airportCity: c.airportCity,
          nearNote: c.nearNote,
          seasonMonths: c.season?.months ?? null,
          seasonNote: c.season?.note ?? null,
          updatedAt: now,
        })),
      )
      .onConflictDoUpdate({
        target: countries.code,
        set: {
          name: sql`excluded.name`,
          slug: sql`excluded.slug`,
          region: sql`excluded.region`,
          cover: sql`excluded.cover`,
          takesThe: sql`excluded.takes_the`,
          airportCode: sql`excluded.airport_code`,
          airportCity: sql`excluded.airport_city`,
          nearNote: sql`excluded.near_note`,
          seasonMonths: sql`excluded.season_months`,
          seasonNote: sql`excluded.season_note`,
          updatedAt: now,
        },
      });

    await tx.delete(seasonRegions);
    await tx
      .insert(seasonRegions)
      .values(
        seeds.flatMap((c) =>
          (c.season?.regions ?? []).map((r, i) => ({ countryCode: c.code, position: i, label: r.label, months: r.months })),
        ),
      );

    await tx.delete(entries);
    for (let i = 0; i < all.length; i += BATCH) {
      await tx.insert(entries).values(
        all.slice(i, i + BATCH).map((e) => ({
          passportCode: e.passport,
          destinationCode: e.destination,
          type: e.type,
          days: e.days,
          ext: e.ext,
          fee: e.fee,
          process: e.process,
          note: e.note,
          stamp: e.stamp,
          apply: e.apply,
          form: e.form,
          options: e.options,
          source: e.source,
          checked: e.checked,
          updatedAt: now,
        })),
      );
    }

    await tx.delete(cities);
    await tx.insert(cities).values(CITIES.map((c) => ({ name: c.name, code: c.code, countryCode: c.country })));

    for (const [key, value] of [
      ['version', DATASET_VERSION],
      ['seeded_at', now.toISOString()],
    ] as const) {
      await tx
        .insert(datasetMeta)
        .values({ key, value, updatedAt: now })
        .onConflictDoUpdate({ target: datasetMeta.key, set: { value, updatedAt: now } });
    }
  });

  return { seeded: true, version: DATASET_VERSION, countries: seeds.length, entries: all.length, cities: CITIES.length };
}
