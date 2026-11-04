import path from 'node:path';
import type { NextConfig } from 'next';

const isProd = process.env.NODE_ENV === 'production';

/**
 * Pages render on the server and stream into the static shell, so inline scripts are Next's own
 * bootstrap. No third-party origins are loaded: fonts are self-hosted and the API is called server-side.
 */
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ');

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  ...(isProd
    ? [
        { key: 'Content-Security-Policy', value: csp },
        { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
      ]
    : []),
];

const nextConfig: NextConfig = {
  // Self-contained server for Docker; Vercel packages the app its own way.
  output: process.env.VERCEL ? undefined : 'standalone',
  // Trace files from the monorepo root so the standalone build includes the workspace packages.
  outputFileTracingRoot: path.join(import.meta.dirname, '../..'),
  poweredByHeader: false,
  reactStrictMode: true,
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    root: path.join(import.meta.dirname, '../..'),
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default nextConfig;
