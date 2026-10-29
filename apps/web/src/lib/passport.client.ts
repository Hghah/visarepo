'use client';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useTransition } from 'react';
import { PASSPORT_COOKIE, withPassport } from './passport';

const ONE_YEAR = 60 * 60 * 24 * 365;

/** Remember the passport for visits without a `?passport=` link. */
export function rememberPassport(passport: string): void {
  const secure = typeof location !== 'undefined' && location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${PASSPORT_COOKIE}=${passport}; Path=/; Max-Age=${ONE_YEAR}; SameSite=Lax${secure}`;
}

export function readPassportCookie(): string | null {
  const m = document.cookie.match(new RegExp(`(?:^|; )${PASSPORT_COOKIE}=([A-Za-z]{2})`));
  return m ? m[1].toUpperCase() : null;
}

/** Switch the page to another passport without losing the scroll position. */
export function usePassportSwitch(): [(passport: string) => void, boolean] {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const go = useCallback(
    (passport: string) => {
      rememberPassport(passport);
      startTransition(() => router.push(withPassport(pathname, passport), { scroll: false }));
    },
    [router, pathname],
  );
  return [go, pending];
}
