import { Inject, Injectable } from '@nestjs/common';
import type { DestinationRow, EntryType, PassportSummary } from '@stamped/core';
import { asc, eq, sql } from 'drizzle-orm';
import { countsRecord } from '../common/mappers.js';
import { CountriesService } from '../countries/countries.service.js';
import { DB } from '../database/database.module.js';
import type { Database } from '../database/database.js';
import { countries, entries } from '../database/schema.js';
import { MobilityService } from '../mobility/mobility.service.js';

@Injectable()
export class PassportsService {
  constructor(
    @Inject(DB) private readonly db: Database,
    private readonly countries: CountriesService,
    private readonly mobility: MobilityService,
  ) {}

  async summary(code: string): Promise<PassportSummary> {
    const [passport, grouped, [multiRow], mobility] = await Promise.all([
      this.countries.summary(code),
      this.db
        .select({ type: entries.type, n: sql<number>`count(*)`.mapWith(Number) })
        .from(entries)
        .where(eq(entries.passportCode, code))
        .groupBy(entries.type),
      this.db
        .select({ n: sql<number>`count(*) filter (where jsonb_array_length(${entries.options}) > 1)`.mapWith(Number) })
        .from(entries)
        .where(eq(entries.passportCode, code)),
      this.mobility.forPassport(code),
    ]);
    return { passport, counts: countsRecord(grouped), multi: multiRow?.n ?? 0, mobility };
  }

  async destinations(code: string): Promise<DestinationRow[]> {
    const rows = await this.db
      .select({
        code: countries.code,
        name: countries.name,
        slug: countries.slug,
        region: countries.region,
        type: entries.type,
        days: entries.days,
        fee: entries.fee,
        options: entries.options,
      })
      .from(entries)
      .innerJoin(countries, eq(countries.code, entries.destinationCode))
      .where(eq(entries.passportCode, code))
      .orderBy(asc(countries.name));
    return rows.map(({ options, ...r }) => ({ ...r, optionTypes: options.map((o) => o.type as EntryType) }));
  }
}
