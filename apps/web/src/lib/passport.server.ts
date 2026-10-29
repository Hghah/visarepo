import 'server-only';
import { cookies } from 'next/headers';
import { PASSPORT_COOKIE, PASSPORT_PARAM, pickPassport } from './passport';

export type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/** Runtime read: must be called inside a Suspense boundary. */
export async function resolvePassport(searchParams: SearchParams): Promise<string> {
  const [sp, jar] = await Promise.all([searchParams, cookies()]);
  return pickPassport(sp[PASSPORT_PARAM], jar.get(PASSPORT_COOKIE)?.value);
}
