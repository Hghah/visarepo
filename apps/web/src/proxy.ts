import { COUNTRIES } from '@stamped/core';
import { NextResponse, type NextRequest } from 'next/server';

const SLUGS = new Set(COUNTRIES.map((c) => c.slug));

/**
 * Destination pages stream from a prerendered shell, which commits a 200 status before the page
 * can call notFound(). Unknown slugs are routed to a path no page matches, so they get a real 404.
 */
export function proxy(request: NextRequest) {
  const slug = request.nextUrl.pathname.slice(1);
  if (slug.includes('.') || SLUGS.has(slug)) return NextResponse.next();
  return NextResponse.rewrite(new URL(`/_unknown/${encodeURIComponent(slug)}`, request.url));
}

export const config = {
  matcher: ['/:slug'],
};
