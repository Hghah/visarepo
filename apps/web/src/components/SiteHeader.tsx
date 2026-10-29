import { cookies } from 'next/headers';
import Link from 'next/link';
import { Suspense } from 'react';
import { Logo } from './Icons';
import { Pickers } from './Pickers';
import { PASSPORT_COOKIE, normalizePassport } from '@/lib/passport';

async function HeaderPickers() {
  const jar = await cookies();
  return <Pickers cookiePassport={normalizePassport(jar.get(PASSPORT_COOKIE)?.value)} />;
}

function PickersFallback() {
  return (
    <div className="picks" aria-hidden="true">
      {['Passport', 'Going to'].map((label) => (
        <div className="pick" key={label}>
          <label>{label}</label>
          <span className="sel">
            <select disabled tabIndex={-1}>
              <option>…</option>
            </select>
          </span>
        </div>
      ))}
    </div>
  );
}

export function SiteHeader() {
  return (
    <header className="top">
      <div className="top-in gut">
        <Link className="brand" href="/" aria-label="Stamped home">
          <Logo />
          Stamped
        </Link>
        <Suspense fallback={<PickersFallback />}>
          <HeaderPickers />
        </Suspense>
      </div>
    </header>
  );
}
