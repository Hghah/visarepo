import type { Cabin } from './labels.js';
import type { ResolvedPlace } from './cities.js';

export interface FlightSearch {
  from: ResolvedPlace;
  to: ResolvedPlace;
  /** ISO dates (YYYY-MM-DD). `ret` is null for one-way trips. */
  depart: string;
  ret: string | null;
  passengers: number;
  cabin: Cabin;
}

export interface FlightLink {
  provider: 'Skyscanner' | 'Google Flights' | 'Kayak' | 'Aviasales';
  hint: string;
  url: string;
}

const yymmdd = (d: string) => d.slice(2).replace(/-/g, '');
const ddmm = (d: string) => d.slice(8, 10) + d.slice(5, 7);

/**
 * Deep links that open each flight site with the search filled in. When either city is not
 * recognised, only Google Flights is returned because it can search by city name.
 */
export function buildFlightLinks(s: FlightSearch): FlightLink[] {
  const { from, to, depart, ret, passengers: pax, cabin } = s;
  const both = Boolean(from.code && to.code);
  const cabTxt = cabin === 'economy' ? '' : cabin === 'premium' ? ' premium economy' : ' business class';
  const q = `Flights from ${both ? from.code : from.name} to ${both ? to.code : to.name} on ${depart}${
    ret ? ' through ' + ret : ' one way'
  }${cabTxt}${pax > 1 ? ` for ${pax} adults` : ''}`;
  const google: FlightLink = {
    provider: 'Google Flights',
    hint: both ? 'See the price calendar' : 'Searches by city name',
    url: `https://www.google.com/travel/flights?q=${encodeURIComponent(q)}`,
  };
  if (!both) return [google];
  const f = from.code!;
  const t = to.code!;
  return [
    {
      provider: 'Skyscanner',
      hint: 'Compare airlines and agents',
      url: `https://www.skyscanner.net/transport/flights/${f.toLowerCase()}/${t.toLowerCase()}/${yymmdd(depart)}/${
        ret ? yymmdd(ret) + '/' : ''
      }?adultsv2=${pax}&cabinclass=${cabin === 'premium' ? 'premiumeconomy' : cabin}&rtn=${ret ? 1 : 0}`,
    },
    google,
    {
      provider: 'Kayak',
      hint: 'Cheapest results first',
      url: `https://www.kayak.com/flights/${f}-${t}/${depart}${ret ? '/' + ret : ''}${pax > 1 ? '/' + pax + 'adults' : ''}${
        cabin === 'business' ? '/business' : cabin === 'premium' ? '/premium' : ''
      }?sort=price_a`,
    },
    {
      provider: 'Aviasales',
      hint: 'Compare fares, economy',
      url: `https://www.aviasales.com/search/${f}${ddmm(depart)}${t}${ret ? ddmm(ret) : ''}${pax}`,
    },
  ];
}
