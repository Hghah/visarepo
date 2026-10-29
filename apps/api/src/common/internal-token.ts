import { timingSafeEqual } from 'node:crypto';
import type { ExecutionContext } from '@nestjs/common';

export const INTERNAL_TOKEN_HEADER = 'x-internal-token';

/** Constant-time check that a header value matches the configured token. */
export function tokenMatches(sent: unknown, token: string | undefined): boolean {
  if (!token || typeof sent !== 'string') return false;
  const a = Buffer.from(sent);
  const b = Buffer.from(token);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** True when the request carries the web server's shared token. */
export function isInternalRequest(ctx: ExecutionContext, token: string | undefined): boolean {
  const req = ctx.switchToHttp().getRequest<{ headers: Record<string, string | string[] | undefined> }>();
  return tokenMatches(req.headers[INTERNAL_TOKEN_HEADER], token);
}
