import { existsSync } from 'node:fs';
import { Logger } from '@nestjs/common';
import { validateEnv } from '../config/env.js';
import { createDatabase } from '../database/database.js';
import { runMigrations } from '../database/migrate.js';
import { seed, type SeedMode } from '../database/seed.js';

/**
 * Database tasks for deployments and local setup:
 *   node dist/cli/run.js migrate            apply pending migrations
 *   node dist/cli/run.js seed [--force]     load the data set (only when this release's version is missing, unless --force)
 *   node dist/cli/run.js prepare            migrate, then seed according to SEED_MODE (always | if-stale | never)
 *   node dist/cli/run.js deploy             `prepare` for Vercel builds: runs for production deployments only,
 *                                           unless RUN_MIGRATIONS=true (e.g. previews on their own database branch)
 *
 * Migrations use DATABASE_URL_UNPOOLED when set (a direct connection, as provided by Neon), else DATABASE_URL.
 */
function loadLocalEnv(): void {
  // Same files as the API in development; variables already set in the environment are kept.
  for (const file of ['.env', '../../.env']) if (existsSync(file)) process.loadEnvFile(file);
}

async function main(): Promise<void> {
  loadLocalEnv();
  const logger = new Logger('DB');
  const [requested = 'prepare', ...flags] = process.argv.slice(2);
  let task = requested;
  if (task === 'deploy') {
    const vercelEnv = process.env.VERCEL_ENV;
    if (vercelEnv && vercelEnv !== 'production' && process.env.RUN_MIGRATIONS !== 'true') {
      logger.log(`Skipping database preparation for a ${vercelEnv} deployment (set RUN_MIGRATIONS=true to run it)`);
      return;
    }
    task = 'prepare';
  }
  const env = validateEnv(process.env);
  const { db, pool } = createDatabase(process.env.DATABASE_URL_UNPOOLED || env.DATABASE_URL, 2);
  try {
    if (task === 'migrate' || task === 'prepare') {
      await runMigrations(db);
      logger.log('Migrations applied');
    }
    if (task === 'seed' || task === 'prepare') {
      const mode: SeedMode = flags.includes('--force')
        ? 'always'
        : task === 'prepare'
          ? ((process.env.SEED_MODE as SeedMode | undefined) ?? 'if-stale')
          : 'if-stale';
      const started = Date.now();
      const r = await seed(db, mode);
      logger.log(
        r.seeded
          ? `Loaded data set ${r.version}: ${r.countries} countries, ${r.entries} entry rules, ${r.cities} cities in ${Date.now() - started} ms`
          : `Data set ${r.version} already loaded; nothing to do`,
      );
    }
    if (!['migrate', 'seed', 'prepare'].includes(task)) throw new Error(`Unknown task "${task}". Use migrate, seed, prepare or deploy.`);
  } finally {
    await pool.end();
  }
}

main().catch((err: unknown) => {
  Logger.error(err instanceof Error ? err.message : String(err), 'DB');
  process.exit(1);
});
