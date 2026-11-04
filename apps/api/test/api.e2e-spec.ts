import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { DestinationRow, EntryDetail, MobilityRow, PassportRow, PassportSummary } from '@stamped/core';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { createDatabase } from '../src/database/database.js';
import { runMigrations } from '../src/database/migrate.js';
import { seed } from '../src/database/seed.js';
import { configureApp } from '../src/setup.js';

/**
 * End-to-end tests against a real PostgreSQL database.
 * Set DATABASE_URL to an empty or disposable database; the suite migrates and seeds it.
 */
describe('Stamped API (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const { db, pool } = createDatabase(process.env.DATABASE_URL!, 2);
    await runMigrations(db);
    await seed(db, 'if-stale');
    await pool.end();

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
  }, 120_000);

  afterAll(async () => {
    await app?.close();
  });

  const api = () => request(app.getHttpServer());

  it('reports healthy with the data set loaded', async () => {
    const res = await api().get('/api/health').expect(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.info.dataset.status).toBe('up');
  });

  it('lists all 199 countries', async () => {
    const res = await api().get('/api/v1/countries').expect(200);
    expect(res.body).toHaveLength(199);
    expect(res.headers['cache-control']).toContain('public');
  });

  it('returns a country with its season and airport', async () => {
    const res = await api().get('/api/v1/countries/vn').expect(200);
    expect(res.body).toMatchObject({ code: 'VN', airportCode: 'SGN' });
    expect(res.body.season.regions).toHaveLength(3);
  });

  it('summarises a passport with its mobility score', async () => {
    const res = await api().get('/api/v1/passports/IN/summary').expect(200);
    const body = res.body as PassportSummary;
    expect(body.passport.name).toBe('India');
    expect(body.mobility.of).toBe(199);
    expect(body.mobility.score).toBe((body.counts.free ?? 0) + (body.counts.voa ?? 0) + (body.counts.eta ?? 0));
    expect(Object.values(body.counts).reduce((a, b) => a + (b ?? 0), 0)).toBe(199);
  });

  it('lists every destination for a passport', async () => {
    const res = await api().get('/api/v1/passports/GB/destinations').expect(200);
    const rows = res.body as DestinationRow[];
    expect(rows).toHaveLength(199);
    expect(rows.find((r) => r.code === 'VN')).toMatchObject({ type: 'free', days: 45, optionTypes: ['free', 'evisa'] });
  });

  it('returns every way in for a multi-option destination', async () => {
    const res = await api().get('/api/v1/entries/IN/KH').expect(200);
    const body = res.body as EntryDetail;
    expect(body.entry.options.map((o) => o.type)).toEqual(['voa', 'evisa']);
    expect(body.destination.name).toBe('Cambodia');
  });

  it('compares all passports for a destination', async () => {
    const res = await api().get('/api/v1/destinations/TH/passports').expect(200);
    const rows = res.body as PassportRow[];
    expect(rows).toHaveLength(199);
    expect(rows.find((r) => r.code === 'TH')?.type).toBe('home');
  });

  it('ranks passports by mobility', async () => {
    const res = await api().get('/api/v1/mobility').expect(200);
    const rows = res.body as MobilityRow[];
    expect(rows[0]!.rank).toBe(1);
    expect(rows.at(-1)!.code).toBe('AF');
  });

  it('lists flight-search cities', async () => {
    const res = await api().get('/api/v1/cities').expect(200);
    expect(res.body.length).toBeGreaterThan(300);
  });

  it('answers 404 for unknown country codes', async () => {
    const res = await api().get('/api/v1/entries/XX/KH').expect(404);
    expect(res.body.message).toContain('Unknown country code');
  });

  it('sends security headers', async () => {
    const res = await api().get('/api/v1/countries').expect(200);
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });

  it('serves the OpenAPI document and the docs page', async () => {
    const spec = await api().get('/api/docs/openapi.json').expect(200);
    expect(spec.body.info.title).toBe('Stamped API');
    expect(Object.keys(spec.body.paths)).toContain('/api/v1/entries/{passport}/{destination}');

    const page = await api().get('/api/docs').expect(200);
    expect(page.text).toContain('swagger-ui-bundle.js');
    expect(page.headers['content-security-policy']).toContain('https://cdn.jsdelivr.net/npm/swagger-ui-dist@');
    await api()
      .get('/api/docs/init.js')
      .expect(200)
      .expect('content-type', /javascript/);
  });
});
