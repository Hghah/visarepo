'use client';
import { COUNTRIES, REGIONS, countryBySlug } from '@stamped/core';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { DEFAULT_PASSPORT, PASSPORT_PARAM, normalizePassport, withPassport } from '@/lib/passport';
import { readPassportCookie, rememberPassport, usePassportSwitch } from '@/lib/passport.client';

/** Passport and destination menus in the site header. */
export function Pickers({ cookiePassport }: { cookiePassport: string | null }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [switchPassport] = usePassportSwitch();
  const fromUrl = normalizePassport(params.get(PASSPORT_PARAM));
  const passport = fromUrl ?? cookiePassport ?? DEFAULT_PASSPORT;
  const slug = pathname.split('/')[1] ?? '';
  const destination = countryBySlug(slug) ? slug : '';

  // A shared `?passport=` link becomes the remembered passport.
  useEffect(() => {
    if (fromUrl && readPassportCookie() !== fromUrl) rememberPassport(fromUrl);
  }, [fromUrl]);

  return (
    <div className="picks">
      <div className="pick">
        <label htmlFor="pp">Passport</label>
        <span className="sel">
          <select id="pp" value={passport} onChange={(e) => switchPassport(e.target.value)}>
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
        </span>
      </div>
      <div className="pick">
        <label htmlFor="dest">Going to</label>
        <span className="sel">
          <select
            id="dest"
            value={destination}
            onChange={(e) => router.push(withPassport(e.target.value ? `/${e.target.value}` : '/', passport))}
          >
            <option value="">All destinations</option>
            {REGIONS.map((region) => (
              <optgroup key={region} label={region}>
                {COUNTRIES.filter((c) => c.region === region).map((c) => (
                  <option key={c.code} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </span>
      </div>
    </div>
  );
}
