# Stamped

Visa and entry rules for 199 passports and 199 destinations: where you can go visa-free, on arrival, with an eTA or e-visa, how long you can stay, what it costs, and when to go. Each destination opens on a boarding-pass verdict. Lists read like an airport departures board.

| Layer    | Stack                                                                                 |
| -------- | ------------------------------------------------------------------------------------- |
| Web      | Next.js 16 (App Router, Cache Components, partial prerendering), React 19, Tailwind 4 |
| API      | NestJS 12, Drizzle ORM, Zod-validated config, Swagger, Terminus health checks         |
| Database | PostgreSQL 17                                                                         |
| Shared   | `@stamped/core`: types, reference data and the entry-rule engine (TypeScript)         |
| Tests    | Vitest (unit, component, API e2e), Playwright (desktop and mobile browsers)           |
| Delivery | Docker (multi-stage, non-root images), Docker Compose, GitHub Actions, GHCR           |

## Quick start (Docker)

You need Docker Desktop (or Docker Engine with Compose v2).

```bash
cp .env.example .env        # optional: the defaults work locally
docker compose up -d --build
```

- Site: http://localhost:3000
- API docs: http://localhost:4000/api/docs
- API health: http://localhost:4000/api/health

On first start, the `migrate` job creates the tables and loads the data set (about 40,000 entry rules), then the API and web start once it finishes.

Stop with `docker compose down`. Add `-v` to also delete the database volume.

## Run every test in Docker

```bash
docker compose --profile test run --rm --build test
```

This starts the stack, then runs the following inside a Playwright container against it:

- lint
- typecheck
- unit and component tests
- API end-to-end tests against PostgreSQL
- browser tests in desktop and mobile Chromium

The HTML report is written to `test-results/playwright-report`.

## Local development

Requirements: Node 22 (see `.nvmrc`), pnpm 10 (`corepack enable` or `npm i -g pnpm@10`), and a PostgreSQL database.

```bash
pnpm install
cp .env.example .env           # set DATABASE_URL; the API and db scripts read this file
pnpm db:up                     # PostgreSQL in Docker on localhost:5432 (or use your own)
pnpm db:prepare                # migrate and load the data set
pnpm dev                       # core (watch) + API on :4000 + web on :3000
```

### Scripts

| Command            | What it does                                                      |
| ------------------ | ----------------------------------------------------------------- |
| `pnpm dev`         | Build core, then watch core, API and web together                 |
| `pnpm build`       | Production builds of all packages, in dependency order            |
| `pnpm check`       | Typecheck, lint and unit tests                                    |
| `pnpm test:e2e`    | API e2e (needs `DATABASE_URL`) and Playwright (needs the site up) |
| `pnpm format`      | Prettier                                                          |
| `pnpm docker:up`   | `docker compose up -d --build`                                    |
| `pnpm docker:test` | The full Docker test run above                                    |

API database tasks run from `apps/api`:

- `pnpm db:generate`: new migration after a schema change
- `pnpm db:migrate`
- `pnpm db:seed`: force a reload
- `pnpm db:studio`

## Project layout

```
apps/
  api/            NestJS REST API
    src/            modules: countries, passports, entries, destinations, mobility, cities, health
    src/database/   Drizzle schema, migrations runner, seeding
    src/cli/        `node dist/cli/run.js migrate | seed | prepare`
    drizzle/        SQL migrations
    test/           e2e tests (real PostgreSQL)
  web/            Next.js site
    src/app/        routes: / and /[slug] (199 destinations), health, sitemap, robots
    src/components/ boarding pass, departures board, stamps, season chart, flight search
    src/lib/        API client (server-only, cached), passport selection, helpers
    tests/          Vitest + Testing Library
    e2e/            Playwright
packages/
  core/           shared types, labels, countries, cities, flight links, entry-rule engine
docker/           test runner script
Dockerfile        targets: api, web, test
docker-compose.yml
```

## How it works

- **Data.** `@stamped/core` holds the rule engine and reference data. The engine merges the Passport Index data set (17 Feb 2026) with rules cross-checked on 28 Oct 2026. On deploy, `prepare` loads every passport and destination pair into PostgreSQL. It only reloads when a release ships a new `DATASET_VERSION`. A golden test pins all 39,601 pairs.
- **API.** Read-only REST under `/api/v1`, with the following security and operations features:
  - Helmet headers and compression
  - Per-IP rate limiting
  - CORS allow-list
  - `Cache-Control` with `stale-while-revalidate`
  - Request logging
  - Graceful shutdown
  - OpenAPI docs at `/api/docs`
- **Web.** Rendering and data:
  - Each page's static shell (headings, country name, layout) is prerendered at build time.
  - Passport-specific data streams in from the API. The API is called only from the Next.js server, never from the browser.
  - API responses are cached for hours with `'use cache'`.
  - The chosen passport lives in the URL (`?passport=GB`) and a cookie, so links are shareable.
  - Unknown paths return a real 404.

  Security and robustness:
  - Strict security headers and a CSP.
  - Trip dates live only in the browser (`localStorage`).

- **Rate limits and the web server.** All visitors' API calls come from the web server's address. The web server sends `INTERNAL_API_TOKEN` so the API's per-IP limit doesn't apply to it. Set the same long random value for both services in production.

### API endpoints

| Method | Path                                     | Returns                                        |
| ------ | ---------------------------------------- | ---------------------------------------------- |
| GET    | `/api/v1/countries`                      | All countries                                  |
| GET    | `/api/v1/countries/:code`                | One country with airport and seasons           |
| GET    | `/api/v1/passports/:code/summary`        | Counts by entry type and mobility score        |
| GET    | `/api/v1/passports/:code/destinations`   | Every destination for a passport               |
| GET    | `/api/v1/entries/:passport/:destination` | Full rule, with every way in                   |
| GET    | `/api/v1/destinations/:code/passports`   | Every passport's entry to one destination      |
| GET    | `/api/v1/mobility`                       | Mobility ranking of all passports              |
| GET    | `/api/v1/cities`                         | Cities and airports for flight search          |
| GET    | `/api/health`, `/api/health/live`        | Readiness (database and data set) and liveness |

## Configuration

All settings are environment variables. See `.env.example` for the full list.

| Variable             | Used by  | Notes                                                                  |
| -------------------- | -------- | ---------------------------------------------------------------------- |
| `DATABASE_URL`       | API      | `postgres://user:pass@host:5432/db`                                    |
| `INTERNAL_API_TOKEN` | API, web | Shared secret, 16+ characters                                          |
| `CORS_ORIGINS`       | API      | Comma-separated browser origins allowed to call the API directly       |
| `SEED_MODE`          | migrate  | `if-stale` (default), `always` or `never`                              |
| `SWAGGER_ENABLED`    | API      | Set `false` to hide `/api/docs`                                        |
| `API_URL`            | web      | Where the Next.js server reaches the API, e.g. `http://api:4000`       |
| `SITE_URL`           | web      | Public URL for sitemap and canonical links; a build argument in Docker |

## Deploying

### Vercel (two projects + Neon PostgreSQL)

The repo deploys to Vercel as two projects from the same Git repository. Each app's `vercel.json` sets its framework and build command.

| Project       | Root Directory | Environment variables                                                                            |
| ------------- | -------------- | ------------------------------------------------------------------------------------------------ |
| `stamped-api` | `apps/api`     | `DATABASE_URL` and `DATABASE_URL_UNPOOLED` (added by the Neon integration), `INTERNAL_API_TOKEN` |
| `stamped`     | `apps/web`     | `API_URL` = the API project's production URL, `INTERNAL_API_TOKEN` (same value)                  |

- **Database.** Production builds of the API run `db:deploy`, which migrates the database and loads the data set when a release changes it. Preview builds skip this step unless `RUN_MIGRATIONS=true` is set.
- **Regions.** Keep the database in the same region as the functions: Vercel's default is Washington, D.C. (`iad1`), so pick US East for Neon.
- **Site URL.** `SITE_URL` defaults to the web project's production domain.

### Docker images

CI builds and pushes `ghcr.io/<owner>/<repo>-api` and `-web` images on every push to `main`. To set the public URL baked into the web image, add a repository variable `SITE_URL`.

To run in production:

1. Run the API image once with `node dist/cli/run.js prepare`.
2. Start the API and web images behind your TLS proxy.
3. Point the web container's `API_URL` at the API.

Only the web service needs to be public.

## Notes

Rules cover ordinary passports travelling for tourism. Entry rules change often, so travellers should confirm on the official portal linked on each page before booking. Stamped doesn't sell tickets: flight search opens Skyscanner, Google Flights, Kayak or Aviasales with the search filled in.
