import { attachDatabasePool } from '@vercel/functions';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { schema } from './schema.js';

export type Database = NodePgDatabase<typeof schema>;

export interface DatabaseHandle {
  db: Database;
  pool: pg.Pool;
}

export function createDatabase(url: string, max = 10): DatabaseHandle {
  const pool = new pg.Pool({ connectionString: url, max, idleTimeoutMillis: 30_000, connectionTimeoutMillis: 10_000 });
  // On Vercel, keep the function instance alive just long enough to close idle connections before it suspends.
  if (process.env.VERCEL) attachDatabasePool(pool);
  return { db: drizzle(pool, { schema }), pool };
}
