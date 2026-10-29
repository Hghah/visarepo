'use client';
import { CABINS, CITIES, MONTHS, buildFlightLinks, countryByCode, resolveCity, type Cabin, type ResolvedPlace } from '@stamped/core';
import { useId, useMemo, useState, type ReactNode } from 'react';
import { SwapIcon } from './Icons';
import { useTrip } from './TripContext';
import { addDays, clamp, daysBetween, isoDate, longDate, parseISODate } from '@/lib/dates';

export interface FlightDestination {
  code: string;
  name: string;
  nearNote: string | null;
  /** 12-letter season string (B/G/S/X), used for the fare tip. */
  seasonMonths: string | null;
}

interface FlightSearchProps {
  /** Set on a destination page; null on the home page. */
  destination: FlightDestination | null;
  fromHint: string;
  toHint: string;
}

const PASSENGERS = [1, 2, 3, 4, 5, 6];

function CityLabel({ place }: { place: ResolvedPlace }) {
  return (
    <>
      {place.name}
      {place.code && (
        <>
          {' '}
          <b>{place.code}</b>
        </>
      )}
    </>
  );
}

function prompt(dep: Date | null, a: ResolvedPlace | null, b: ResolvedPlace | null): string | null {
  if (!dep) return 'Pick a departure date.';
  if (!a && !b) return 'Type the city you fly from and the city you fly to. Pick a suggestion to compare all four flight sites.';
  if (!a) return 'Type the city you fly from.';
  if (!b) return 'Type the city you fly to.';
  if (a.code && a.code === b.code) return 'Choose two different cities.';
  return null;
}

function unknownNote(a: ResolvedPlace, b: ResolvedPlace): string {
  const who = !a.code && !b.code ? "We don't recognise these cities" : `We don't recognise “${(!a.code ? a : b).name}”`;
  return `${who}, so only Google Flights can search them. Pick a city from the suggestions to also search Skyscanner, Kayak and Aviasales.`;
}

/** Builds the same flight search on four sites. City names or airport codes both work. */
export function FlightSearch({ destination, fromHint, toHint }: FlightSearchProps) {
  const { trip, update, ready } = useTrip();
  const [toText, setToText] = useState('');
  const [retDraft, setRetDraft] = useState<string | null>(null);
  const uid = useId();
  const listId = `airports${uid}`;

  const from = resolveCity(trip.from);
  const to = resolveCity(toText);
  const dep = parseISODate(trip.depart);
  const oneWay = trip.kind === 'oneway';
  const ret = dep && !oneWay ? addDays(dep, trip.nights) : null;
  const retValue = retDraft ?? (dep ? isoDate(addDays(dep, trip.nights)) : '');
  const message = prompt(dep, from, to);

  const cities = useMemo(() => [...CITIES].sort((x, y) => x.name.localeCompare(y.name)), []);

  let result: ReactNode;
  if (message || !from || !to || !dep) {
    result = <p className="fl-msg">{message}</p>;
  } else {
    const links = buildFlightLinks({
      from,
      to,
      depart: isoDate(dep),
      ret: ret ? isoDate(ret) : null,
      passengers: trip.passengers,
      cabin: trip.cabin,
    });
    const both = Boolean(from.code && to.code);
    const month = dep.getUTCMonth();
    const level = destination?.seasonMonths?.[month];
    const tip =
      level === 'B'
        ? `${MONTHS[month]} is peak season there, so fares rise as dates fill. Booking early helps.`
        : level === 'S' || level === 'X'
          ? `${MONTHS[month]} is off-peak there, which usually means lower fares.`
          : null;
    result = (
      <>
        <p className="fl-sum">
          <CityLabel place={from} /> → <CityLabel place={to} /> · {longDate(dep)}
          {ret ? ` – ${longDate(ret)}` : ' one way'} · {trip.passengers} {trip.passengers > 1 ? 'travellers' : 'traveller'} ·{' '}
          {CABINS[trip.cabin]}
        </p>
        {!both && <p className="fl-note">{unknownNote(from, to)}</p>}
        {destination?.nearNote && <p className="fl-note">{destination.nearNote}</p>}
        {tip && <p className="fl-note">{tip}</p>}
        <div className="fl-links">
          {links.map((l, i) => (
            <a key={l.provider} className={`fl-go${i === 0 ? ' primary' : ''}`} href={l.url} target="_blank" rel="noopener noreferrer">
              <span>
                <b>{l.provider}</b>
                <small>{l.hint}</small>
              </span>
              <span aria-hidden="true">↗</span>
            </a>
          ))}
        </div>
        <p className="fine">
          Each button opens that site with your search filled in. Stamped doesn&apos;t sell tickets; prices and booking happen on the
          provider&apos;s site.{both && trip.cabin !== 'economy' ? ' Aviasales links search economy.' : ''}
        </p>
      </>
    );
  }

  const cityField = (
    id: string,
    label: string,
    value: string,
    hint: string,
    place: ResolvedPlace | null,
    onChange: (v: string) => void,
  ) => (
    <div className="fl-f">
      <label htmlFor={id}>{label}</label>
      <div className="fl-in">
        <input
          id={id}
          list={listId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete="off"
          spellCheck={false}
          placeholder={hint ? `City, e.g. ${hint}` : 'City'}
        />
        <span className="fl-code" aria-live="polite">
          {place?.code ?? ''}
        </span>
      </div>
    </div>
  );

  return (
    <div className="fl" data-testid="flight-search" data-ready={ready}>
      <div className="fl-main">
        <div className="fl-route">
          {cityField('fl-from', 'From', trip.from, fromHint, from, (v) => update({ from: v }))}
          <button
            type="button"
            className="fl-swap"
            aria-label="Swap from and to"
            onClick={() => {
              const t = toText;
              setToText(trip.from);
              update({ from: t });
            }}
          >
            <SwapIcon />
          </button>
          {cityField('fl-to', 'To', toText, toHint, to, setToText)}
        </div>
        <div className="fl-dates">
          <div className="fl-f">
            <label htmlFor="fl-dep">Depart</label>
            <input type="date" id="fl-dep" value={trip.depart} onChange={(e) => update({ depart: e.target.value })} />
          </div>
          <div className="fl-f">
            <label htmlFor="fl-ret">Return</label>
            <input
              type="date"
              id="fl-ret"
              value={retValue}
              disabled={oneWay}
              min={trip.depart || undefined}
              onBlur={() => setRetDraft(null)}
              onChange={(e) => {
                const r = parseISODate(e.target.value);
                if (dep && r) {
                  update({ nights: clamp(daysBetween(dep, r), 1, 365) });
                  setRetDraft(null);
                } else setRetDraft(e.target.value);
              }}
            />
          </div>
        </div>
        <div className="fl-opts">
          <div className="fl-seg" role="group" aria-label="Trip type">
            <button type="button" aria-pressed={!oneWay} onClick={() => update({ kind: 'return' })}>
              Return
            </button>
            <button type="button" aria-pressed={oneWay} onClick={() => update({ kind: 'oneway' })}>
              One way
            </button>
          </div>
          <div className="fl-f fl-inline">
            <label htmlFor="fl-pax">Travellers</label>
            <span className="sel">
              <select id="fl-pax" value={trip.passengers} onChange={(e) => update({ passengers: Number(e.target.value) })}>
                {PASSENGERS.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </span>
          </div>
          <div className="fl-f fl-inline">
            <label htmlFor="fl-cabin">Cabin</label>
            <span className="sel">
              <select id="fl-cabin" value={trip.cabin} onChange={(e) => update({ cabin: e.target.value as Cabin })}>
                {(Object.keys(CABINS) as Cabin[]).map((k) => (
                  <option key={k} value={k}>
                    {CABINS[k]}
                  </option>
                ))}
              </select>
            </span>
          </div>
        </div>
      </div>
      <div className="fl-stub" aria-live="polite" data-testid="flight-results">
        {result}
      </div>
      <datalist id={listId}>
        {cities.map((c) => {
          const country = countryByCode(c.country)?.name;
          return <option key={c.code + c.name} value={c.name} label={country ? `${c.code} · ${country}` : c.code} />;
        })}
      </datalist>
    </div>
  );
}
