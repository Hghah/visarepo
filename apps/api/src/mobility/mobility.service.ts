import { Inject, Injectable } from '@nestjs/common';
import type { MobilityRow, MobilityScore } from '@stamped/core';
import { MOBILITY_TYPES } from '@stamped/core';
import { asc, sql } from 'drizzle-orm';
import { rankOf } from '../common/mappers.js';
import { DB } from '../database/database.module.js';
import type { Database } from '../database/database.js';
import { countries, entries } from '../database/schema.js';

interface Snapshot {
  at: number;
  scores: Map<string, number>;
  sorted: number[];
  names: Map<string, string>;
}

const TTL_MS = 10 * 60_000;

/**
 * Mobility score = destinations a passport can enter without applying in advance (visa-free, on arrival or eTA).
 * Scores only change when the data set is reloaded, so they are computed once and cached for 10 minutes.
 */
@Injectable()
export class MobilityService {
  private snapshot: Snapshot | null = null;
  private pending: Promise<Snapshot> | null = null;

  constructor(@Inject(DB) private readonly db: Database) {}

  private async load(): Promise<Snapshot> {
    const types = sql.join(
      MOBILITY_TYPES.map((t) => sql`${t}`),
      sql`, `,
    );
    const rows = await this.db
      .select({
        code: countries.code,
        name: countries.name,
        score:
          sql<number>`count(${entries.destinationCode}) filter (where ${entries.type} in (${types}) and ${entries.passportCode} <> ${entries.destinationCode})`.mapWith(
            Number,
          ),
      })
      .from(countries)
      .leftJoin(entries, sql`${entries.passportCode} = ${countries.code}`)
      .groupBy(countries.code, countries.name)
      .orderBy(asc(countries.name));
    const scores = new Map(rows.map((r) => [r.code, r.score]));
    return {
      at: Date.now(),
      scores,
      sorted: [...scores.values()].sort((a, b) => b - a),
      names: new Map(rows.map((r) => [r.code, r.name])),
    };
  }

  private async current(): Promise<Snapshot> {
    if (this.snapshot && Date.now() - this.snapshot.at < TTL_MS) return this.snapshot;
    this.pending ??= this.load().finally(() => (this.pending = null));
    this.snapshot = await this.pending;
    return this.snapshot;
  }

  async forPassport(code: string): Promise<MobilityScore> {
    const s = await this.current();
    const score = s.scores.get(code) ?? 0;
    return {
      score,
      rank: rankOf(score, s.sorted),
      of: s.sorted.length,
      possible: Math.max(0, s.sorted.length - 1),
      strongest: s.sorted[0] ?? 0,
      distribution: s.sorted,
    };
  }

  async ranking(): Promise<MobilityRow[]> {
    const s = await this.current();
    return [...s.scores.entries()]
      .map(([code, score]) => ({ code, name: s.names.get(code) ?? code, score, rank: rankOf(score, s.sorted) }))
      .sort((a, b) => a.rank - b.rank || a.name.localeCompare(b.name));
  }

  /** Forget cached scores, e.g. after reloading the data set. */
  invalidate(): void {
    this.snapshot = null;
  }
}
