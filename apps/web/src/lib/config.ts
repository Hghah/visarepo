/** Base URL of the Stamped API, reachable from the Next.js server (not the browser). */
export const API_URL = (process.env.API_URL ?? 'http://localhost:4000').replace(/\/$/, '');

/**
 * Public URL of this site, used for canonical links, Open Graph and the sitemap.
 * On Vercel it defaults to the project's production domain.
 */
export const SITE_URL = (
  process.env.SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:3000')
).replace(/\/$/, '');

/** Shared secret that lets this server's API calls skip the per-IP rate limit. Server-side only. */
export const INTERNAL_API_TOKEN = process.env.INTERNAL_API_TOKEN || undefined;
