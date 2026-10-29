import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { CountryDetail, CountrySummary } from '@stamped/core';
import { asc, eq } from 'drizzle-orm';
import { toCountryDetail, toCountrySummary } from '../common/mappers.js';
import { DB } from '../database/database.module.js';
import type { Database } from '../database/database.js';
import { countries, seasonRegions } from '../database/schema.js';

@Injectable()
export class CountriesService {
  constructor(@Inject(DB) private readonly db: Database) {}

  async list(): Promise<CountrySummary[]> {
    const rows = await this.db.select().from(countries).orderBy(asc(countries.name));
    return rows.map(toCountrySummary);
  }

  async summary(code: string): Promise<CountrySummary> {
    const [row] = await this.db.select().from(countries).where(eq(countries.code, code)).limit(1);
    if (!row) throw new NotFoundException(`Country ${code} is not loaded`);
    return toCountrySummary(row);
  }

  async detail(code: string): Promise<CountryDetail> {
    const [row] = await this.db.select().from(countries).where(eq(countries.code, code)).limit(1);
    if (!row) throw new NotFoundException(`Country ${code} is not loaded`);
    const regions = await this.db.select().from(seasonRegions).where(eq(seasonRegions.countryCode, code));
    return toCountryDetail(row, regions);
  }
}
