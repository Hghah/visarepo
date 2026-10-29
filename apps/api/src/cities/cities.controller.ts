import { Controller, Get, Inject } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { City } from '@stamped/core';
import { asc } from 'drizzle-orm';
import { PublicCache } from '../common/cache-control.js';
import { DB } from '../database/database.module.js';
import type { Database } from '../database/database.js';
import { cities } from '../database/schema.js';

@ApiTags('cities')
@Controller({ path: 'cities', version: '1' })
export class CitiesController {
  constructor(@Inject(DB) private readonly db: Database) {}

  @Get()
  @PublicCache(3600, 86400)
  @ApiOperation({ summary: 'Cities and airport codes offered in the flight search' })
  @ApiOkResponse({ description: 'About 330 cities sorted by name.' })
  async list(): Promise<City[]> {
    const rows = await this.db.select().from(cities).orderBy(asc(cities.name));
    return rows.map((c) => ({ name: c.name, code: c.code, country: c.countryCode }));
  }
}
