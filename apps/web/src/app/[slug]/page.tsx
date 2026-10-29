import {
  COUNTRIES,
  CURATED_DESTINATIONS,
  DATASET_DATE,
  VERIFIED_DATE,
  countryBySlug,
  fromName,
  isMulti,
  type CountryRef,
} from '@stamped/core';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { Compare } from '@/components/Compare';
import { FlightSearch } from '@/components/FlightSearch';
import { Guilloche } from '@/components/Guilloche';
import { ArrowIcon } from '@/components/Icons';
import { Pass } from '@/components/Pass';
import { Season } from '@/components/Season';
import { Loading } from '@/components/Skeletons';
import { TripProvider } from '@/components/TripContext';
import { Ways } from '@/components/Ways';
import { getDestinationPassports, getEntry } from '@/lib/api';
import { addDays, isoDate, parseISODate } from '@/lib/dates';
import { withPassport } from '@/lib/passport';
import { resolvePassport, type SearchParams } from '@/lib/passport.server';
import { requestToday } from '@/lib/today.server';
import { monthRanges } from '@/lib/season';

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: SearchParams;
}

interface SectionProps {
  country: CountryRef;
  searchParams: SearchParams;
}

/** Every destination's static shell is prerendered at build time; entry data streams in per passport. */
export function generateStaticParams() {
  return COUNTRIES.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const country = countryBySlug(slug);
  if (!country) return { title: 'Destination not found' };
  return {
    title: `${country.name} entry rules`,
    description: `Do you need a visa for ${fromName(country)}? Entry rules for all 199 passports: visa-free stays, visa on arrival, eTA and e-visa options, fees and the best months to go.`,
    alternates: { canonical: `/${country.slug}` },
  };
}

const isGeneric = (code: string) => !CURATED_DESTINATIONS.includes(code);

async function HeroFacts({ country, searchParams }: SectionProps) {
  const passport = await resolvePassport(searchParams);
  const { entry, destination } = await getEntry(passport, country.code);
  const best = destination.season ? monthRanges(destination.season.months, 'B') : '';
  const checked = isGeneric(country.code) && !entry.checked ? `Data as of ${DATASET_DATE}` : `Checked ${VERIFIED_DATE}`;
  return (
    <>
      <dl className="facts">
        {destination.airportCode && (
          <div>
            <dt>Main airport</dt>
            <dd>
              <span className="code">{destination.airportCode}</span> {destination.airportCity}
            </dd>
          </div>
        )}
        {best && (
          <div>
            <dt>Best months</dt>
            <dd>{best}</dd>
          </div>
        )}
      </dl>
      <p className="dh-meta">{checked} · ordinary passports, tourism</p>
    </>
  );
}

async function HeroPass({ country, searchParams }: SectionProps) {
  const passport = await resolvePassport(searchParams);
  const detail = await getEntry(passport, country.code);
  return <Pass detail={detail} generic={isGeneric(country.code)} date={await requestToday()} />;
}

async function Body({ country, searchParams }: SectionProps) {
  const passport = await resolvePassport(searchParams);
  const [detail, rows] = await Promise.all([getEntry(passport, country.code), getDestinationPassports(country.code)]);
  const { entry, passport: pp, destination } = detail;
  const generic = isGeneric(country.code);
  const today = await requestToday();
  const i = COUNTRIES.findIndex((c) => c.code === country.code);
  const next = COUNTRIES[(i + 1) % COUNTRIES.length];

  return (
    <>
      <div className="dwrap wrap gut">
        <TripProvider today={today} defaultDepart={isoDate(addDays(parseISODate(today)!, 30))}>
          <div className="dmain">
            <section id="verdict" className="lead">
              <p className="vnote">{entry.note}</p>
              {generic && (
                <p className="official">
                  Confirm on the official immigration or embassy website of {fromName(country)} before you book.{' '}
                  {entry.checked ? `Checked ${VERIFIED_DATE}` : `Data as of ${DATASET_DATE}`}.
                </p>
              )}
            </section>
            {isMulti(entry) && <Ways entry={entry} />}
            {destination.season && <Season name={country.name} season={destination.season} />}
            <section id="flights">
              <div className="sh">
                <h2>Find a flight to {country.name}</h2>
                <p>Compare the same search across four flight sites and book where it&apos;s cheapest.</p>
              </div>
              <FlightSearch
                destination={{
                  code: country.code,
                  name: country.name,
                  nearNote: destination.nearNote,
                  seasonMonths: destination.season?.months ?? null,
                }}
                fromHint={pp.airportCity ?? 'Delhi'}
                toHint={destination.airportCity ?? ''}
              />
            </section>
          </div>
        </TripProvider>
        <Compare destinationName={country.name} rows={rows} passport={passport} />
      </div>
      <Link className="next" href={withPassport(`/${next.slug}`, passport)}>
        <div className="next-in wrap gut">
          <div>
            <small>Next destination</small>
            <strong>{next.name}</strong>
          </div>
          <span className="arrow" aria-hidden="true">
            <ArrowIcon />
          </span>
        </div>
      </Link>
    </>
  );
}

export default async function DestinationPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const country = countryBySlug(slug);
  if (!country) notFound();

  return (
    <>
      <section className="dh">
        <Guilloche variant="destination" seed={country.slug} />
        <div className="dh-in wrap gut">
          <div className="dh-copy">
            <p className="dh-kick">{country.region}</p>
            <h1 className="dh-title">{country.name}</h1>
            <Suspense fallback={<p className="dh-meta">Loading entry rules…</p>}>
              <HeroFacts country={country} searchParams={searchParams} />
            </Suspense>
          </div>
          <Suspense fallback={<Loading height={360} className="pass-box" label="Loading your entry" />}>
            <HeroPass country={country} searchParams={searchParams} />
          </Suspense>
        </div>
      </section>
      <Suspense
        fallback={
          <div className="dwrap wrap gut">
            <Loading height={720} label="Loading entry details" />
            <Loading height={720} label="Loading passport comparison" />
          </div>
        }
      >
        <Body country={country} searchParams={searchParams} />
      </Suspense>
    </>
  );
}
