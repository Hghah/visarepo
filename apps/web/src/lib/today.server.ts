import 'server-only';
import { connection } from 'next/server';
import { todayISO } from './dates';

/** Today's date for this request. Reading the clock marks the caller as request-time work. */
export async function requestToday(): Promise<string> {
  await connection();
  return todayISO();
}
