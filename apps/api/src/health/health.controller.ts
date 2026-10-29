import { Controller, Get, Header, Inject } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { HealthCheck, HealthCheckService, HealthIndicatorService } from '@nestjs/terminus';
import { DATASET_VERSION } from '@stamped/core';
import { eq, sql } from 'drizzle-orm';
import { DB } from '../database/database.module.js';
import type { Database } from '../database/database.js';
import { datasetMeta } from '../database/schema.js';

@ApiTags('health')
@SkipThrottle()
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly indicators: HealthIndicatorService,
    @Inject(DB) private readonly db: Database,
  ) {}

  /** Liveness: the process is up. */
  @Get('live')
  @Header('Cache-Control', 'no-store')
  @ApiOperation({ summary: 'Liveness probe' })
  live() {
    return { status: 'ok' };
  }

  /** Readiness: the database answers and the data set is loaded. */
  @Get()
  @HealthCheck()
  @Header('Cache-Control', 'no-store')
  @ApiOperation({ summary: 'Readiness probe: database reachable and data loaded' })
  check() {
    return this.health.check([
      async () => {
        const db = this.indicators.check('database');
        try {
          await this.db.execute(sql`select 1`);
          return db.up();
        } catch (e) {
          return db.down({ message: e instanceof Error ? e.message : 'unreachable' });
        }
      },
      async () => {
        const data = this.indicators.check('dataset');
        try {
          const [row] = await this.db.select().from(datasetMeta).where(eq(datasetMeta.key, 'version')).limit(1);
          if (!row) return data.down({ message: 'Data set not loaded. Run the seed.' });
          return row.value === DATASET_VERSION
            ? data.up({ version: row.value })
            : data.degraded({ version: row.value, expected: DATASET_VERSION });
        } catch (e) {
          return data.down({ message: e instanceof Error ? e.message : 'unavailable' });
        }
      },
    ]);
  }
}
