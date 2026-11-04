# syntax=docker/dockerfile:1.7
# One Dockerfile, three targets:
#   api   NestJS API (also runs migrations and seeding via `node dist/cli/run.js prepare`)
#   web   Next.js standalone server
#   test  lint, typecheck, unit, API e2e and Playwright browser tests

ARG NODE_VERSION=22
ARG PNPM_VERSION=10.28.0

# ---------- base: Node + pnpm ----------
FROM node:${NODE_VERSION}-alpine AS base
ARG PNPM_VERSION
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH NEXT_TELEMETRY_DISABLED=1
RUN npm install -g pnpm@${PNPM_VERSION} --no-fund --no-audit
WORKDIR /repo

# ---------- deps: install once from the lockfile (cached until a manifest changes) ----------
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/core/package.json packages/core/
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store pnpm install --frozen-lockfile

# ---------- build: compile all three packages ----------
FROM deps AS build
# Public URL baked into the sitemap, robots.txt and canonical links.
ARG SITE_URL=http://localhost:3000
ENV SITE_URL=${SITE_URL}
COPY . .
RUN pnpm --filter @stamped/core build \
 && pnpm --filter @stamped/api build \
 && pnpm --filter @stamped/web build \
 && pnpm --filter @stamped/api deploy --prod --legacy /out/api

# ---------- api: production image ----------
FROM node:${NODE_VERSION}-alpine AS api
ENV NODE_ENV=production HOST=0.0.0.0 PORT=4000
WORKDIR /app
COPY --from=build --chown=node:node /out/api ./
USER node
EXPOSE 4000
HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=5 \
  CMD wget -qO- http://127.0.0.1:4000/api/health/live >/dev/null || exit 1
CMD ["node", "dist/main.js"]

# ---------- web: production image ----------
FROM node:${NODE_VERSION}-alpine AS web
ARG SITE_URL=http://localhost:3000
ENV NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0 NEXT_TELEMETRY_DISABLED=1 SITE_URL=${SITE_URL}
WORKDIR /app
COPY --from=build --chown=node:node /repo/apps/web/.next/standalone ./
COPY --from=build --chown=node:node /repo/apps/web/.next/static ./apps/web/.next/static
USER node
EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=5 \
  CMD wget -qO- http://127.0.0.1:3000/api/health >/dev/null || exit 1
CMD ["node", "apps/web/server.js"]

# ---------- test: everything that CI runs, with browsers ----------
# Playwright's image (Ubuntu, glibc) matches @playwright/test 1.63.0, so its browsers are already installed.
FROM mcr.microsoft.com/playwright:v1.64.1-noble AS test
ARG PNPM_VERSION
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH CI=1 NEXT_TELEMETRY_DISABLED=1
RUN npm install -g pnpm@${PNPM_VERSION} --no-fund --no-audit
WORKDIR /repo
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/core/package.json packages/core/
RUN --mount=type=cache,id=pnpm-store-glibc,target=/pnpm/store pnpm install --frozen-lockfile
COPY . .
RUN pnpm --filter @stamped/core build
CMD ["sh", "docker/test.sh"]
