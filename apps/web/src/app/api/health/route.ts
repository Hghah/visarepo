import { connection } from 'next/server';
import { API_URL } from '@/lib/config';

/**
 * Liveness for the web container. `?deep=1` also checks that the API answers, for readiness probes.
 */
export async function GET(request: Request): Promise<Response> {
  await connection();
  const deep = new URL(request.url).searchParams.get('deep') === '1';
  if (!deep) return Response.json({ status: 'ok' }, { headers: { 'cache-control': 'no-store' } });
  try {
    const res = await fetch(`${API_URL}/api/health`, { signal: AbortSignal.timeout(3000), cache: 'no-store' });
    const api = (await res.json()) as { status?: string };
    const ok = res.ok && api.status === 'ok';
    return Response.json(
      { status: ok ? 'ok' : 'degraded', api: api.status ?? res.status },
      { status: ok ? 200 : 503, headers: { 'cache-control': 'no-store' } },
    );
  } catch {
    return Response.json({ status: 'degraded', api: 'unreachable' }, { status: 503, headers: { 'cache-control': 'no-store' } });
  }
}
