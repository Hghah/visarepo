import { Inject, Injectable } from '@nestjs/common';
import type { EntryType, PassportRow } from '@stamped/core';
import { asc, eq } from 'drizzle-orm';
import { DB } from '../database/database.module.js';
import type { Database } from '../database/database.js';
import { countries, entries } from '../database/schema.js';

@Injectable()
export class DestinationsService {
  constructor(@Inject(DB) private readonly db: Database) {}

  async passports(destination: string): Promise<PassportRow[]> {
    const rows = await this.db
      .select({
        code: countries.code,
        name: countries.name,
        cover: countries.cover,
        type: entries.type,
        days: entries.days,
        fee: entries.fee,
        options: entries.options,
      })
      .from(entries)
      .innerJoin(countries, eq(countries.code, entries.passportCode))
      .where(eq(entries.destinationCode, destination))
      .orderBy(asc(countries.name));
    return rows.map(({ options, ...r }) => ({ ...r, optionTypes: options.map((o) => o.type as EntryType) }));
  }
}
