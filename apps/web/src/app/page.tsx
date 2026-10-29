import { COUNTRIES, VERIFIED_DATE, type DestinationRow, type EntryType } from '@stamped/core';
import { Suspense } from 'react';
import { Board } from '@/components/Board';
import { DataPage } from '@/components/DataPage';
import { FlightSearch } from '@/components/FlightSearch';
import { Guilloche } from '@/components/Guilloche';
import { HeadingPassportSelect } from '@/components/HeadingPassportSelect';
import { Loading } from '@/components/Skeletons';
import { Stamp } from '@/components/Stamp';
import { TripProvider } from '@/components/TripContext';
import { getCountry, getPassportDestinations, getPassportSummary } from '@/lib/api';
import { addDays, isoDate, parseISODate } from '@/lib/dates';
import { resolvePassport, type SearchParams } from '@/lib/passport.server';
import { requestToday } from '@/lib/today.server';

interface PageProps {
  searchParams: SearchParams;
}

const BOARD_LEDE = 'Every destination on one board. Filter by entry type or search, then open a row for its entry details.';

/** The single-option destination of a type with the longest stay, for the hero stamps. */
function longestStay(rows: DestinationRow[], type: EntryType): DestinationRow | undefined {
  return rows
    .filter((r) => r.type === type && r.optionTypes.length < 2)
    .sort((a, b) => (b.days ?? 0) - (a.days ?? 0) || a.name.localeCompare(b.name))[0];
}

async function HeroArt({ searchParams }: PageProps) {
  const passport = await resolvePassport(searchParams);
  const [summary, rows] = await Promise.all([getPassportSummary(passport), getPassportDestinations(passport)]);
  const today = await requestToday();
  const free = longestStay(rows, 'free');
  const second = longestStay(rows, 'voa') ?? longestStay(rows, 'evisa');
  return (
    <div className="hh-art">
      <DataPage summary={summary} />
      {free && <Stamp slot="s1" code={free.code} name={free.name} type="free" days={free.days} date={today} rotate={-12} />}
      {second && <Stamp slot="s2" code={second.code} name={second.name} type={second.type} days={second.days} date={today} rotate={9} />}
    </div>
  );
}

async function DestinationsBoard({ searchParams }: PageProps) {
  const passport = await resolvePassport(searchParams);
  const rows = await getPassportDestinations(passport);
  return (
    <>
      <div className="hhead">
        <h2>
          Where a passport from <HeadingPassportSelect passport={passport} /> gets you in
        </h2>
        <p>{BOARD_LEDE}</p>
      </div>
      <Board rows={rows} passport={passport} />
    </>
  );
}

async function HomeFlights({ searchParams }: PageProps) {
  const passport = await resolvePassport(searchParams);
  const country = await getCountry(passport);
  const today = await requestToday();
  return (
    <TripProvider today={today} defaultDepart={isoDate(addDays(parseISODate(today)!, 30))}>
      <FlightSearch destination={null} fromHint={country.airportCity ?? 'Delhi'} toHint="Bangkok" />
    </TripProvider>
  );
}

export default function HomePage({ searchParams }: PageProps) {
  return (
    <>
      <section className="hh">
        <Guilloche variant="home" seed="home" />
        <div className="hh-in wrap gut">
          <div className="hh-copy">
            <h1>Know the entry rules before you book.</h1>
            <p className="lede">
              Choose your passport in the menu at the top. See where it gets you in, what each country asks for, what it costs and how long
              you can stay. {COUNTRIES.length} destinations, checked {VERIFIED_DATE}.
            </p>
          </div>
          <Suspense
            fallback={
              <div className="hh-art">
                <Loading height={480} label="Loading passport summary" />
              </div>
            }
          >
            <HeroArt searchParams={searchParams} />
          </Suspense>
        </div>
      </section>

      <section className="hsec wrap gut" id="all">
        <Suspense
          fallback={
            <>
              <div className="hhead">
                <h2>Where your passport gets you in</h2>
                <p>{BOARD_LEDE}</p>
              </div>
              <Loading height={640} label="Loading destinations" />
            </>
          }
        >
          <DestinationsBoard searchParams={searchParams} />
        </Suspense>
      </section>

      <section className="hsec wrap gut" id="flights">
        <div className="hhead">
          <h2>Find a cheap flight</h2>
          <p>Pick a destination and dates. The same search opens on four flight sites, so you can book where it&apos;s cheapest.</p>
        </div>
        <Suspense fallback={<Loading height={320} label="Loading flight search" />}>
          <HomeFlights searchParams={searchParams} />
        </Suspense>
      </section>
    </>
  );
}
