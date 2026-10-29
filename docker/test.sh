#!/bin/sh
# Full check suite, run by `docker compose --profile test run --rm test` (and by CI).
# Expects DATABASE_URL (PostgreSQL) and E2E_BASE_URL (the running web app).
set -eu

step() { printf '\n\033[1;36m▶ %s\033[0m\n' "$1"; }

step "Lint"
pnpm -r lint

step "Typecheck"
pnpm -r typecheck

step "Unit and component tests"
pnpm -r test

step "API end-to-end tests against PostgreSQL"
pnpm --filter @stamped/api test:e2e

step "Browser end-to-end tests against ${E2E_BASE_URL}"
pnpm --filter @stamped/web test:e2e

printf '\n\033[1;32m✔ All checks passed\033[0m\n'
