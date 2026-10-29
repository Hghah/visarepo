import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { EntryDetail } from '@stamped/core';
import { and, eq } from 'drizzle-orm';
import { toEntry } from '../common/mappers.js';
import { CountriesService } from '../countries/countries.service.js';
import { DB } from '../database/database.module.js';
import type { Database } from '../database/database.js';
import { entries } from '../database/schema.js';

@Injectable()
export class EntriesService {
  constructor(
    @Inject(DB) private readonly db: Database,
    private readonly countries: CountriesService,
  ) {}

  async detail(passport: string, destination: string): Promise<EntryDetail> {
    const [[row], pp, dest] = await Promise.all([
      this.db
        .select()
        .from(entries)
        .where(and(eq(entries.passportCode, passport), eq(entries.destinationCode, destination)))
        .limit(1),
      this.countries.detail(passport),
      this.countries.detail(destination),
    ]);
    if (!row) throw new NotFoundException(`No entry rule loaded for ${passport} to ${destination}`);
    return { entry: toEntry(row), passport: pp, destination: dest };
  }
}
