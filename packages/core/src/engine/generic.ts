import type { Entry, EntryOption, EntrySource, EntryType } from '../shared/types.js';
import { DX } from './data/options.js';
import { MX, RAW_ORDER } from './data/matrix.js';
import { LK_FREE, RMAP, US_FULL, US_PART, WX } from './data/overrides.js';

const CODE_TYPE: Record<string, EntryType> = { F: 'free', A: 'voa', T: 'eta', E: 'evisa', R: 'visa', N: 'none', H: 'home' };
/** Preference when a pair has several routes: the easiest one becomes the main type. */
const PREF = 'FTAERNH';

const OPT_NAME: Record<EntryType, string> = {
  free: 'Visa-free',
  voa: 'Visa on arrival',
  eta: 'eTA',
  evisa: 'e-Visa',
  visa: 'Embassy visa',
  none: 'No entry',
  home: 'Citizen',
};
const OPT_WHERE: Record<EntryType, string> = {
  free: 'Stamped at the border.',
  voa: 'Issued at the airport or land border. Carry cash, a photo and a ticket out.',
  eta: 'Apply online before you fly.',
  evisa: 'Apply online on the official portal before you fly.',
  visa: 'Apply at an embassy or consulate.',
  none: '',
  home: '',
};
const OPT_ACT: Record<EntryType, string> = {
  free: 'enter visa-free',
  voa: 'get a visa when you land',
  eta: 'get an eTA online before you fly',
  evisa: 'apply for an e-visa online before you fly',
  visa: 'apply at an embassy',
  none: 'check official travel advice',
  home: 'enter as a citizen',
};

const US_FULL_SET = new Set(US_FULL);
const US_PART_SET = new Set(US_PART);
const LK_FREE_SET = new Set(LK_FREE);
const PP_INDEX = new Map(RAW_ORDER.map((c, i) => [c, i]));
const MX_ROWS = new Map(Object.entries(MX).map(([d, row]) => [d, row.split(',')]));
const WX_INDEX = new Map(
  Object.entries(WX).map(([pp, list]) => [
    pp,
    new Map(
      list
        .split(',')
        .filter(Boolean)
        .map((x) => x.split(':') as [string, string]),
    ),
  ]),
);

type RawSource = 'ban' | 'wiki' | 'rmap' | 'mx';
const SOURCE: Record<RawSource, EntrySource> = { ban: 'ban', wiki: 'wikipedia', rmap: 'override', mx: 'dataset' };

/** Token for one pair after applying, in order: the US ban, Wikipedia corrections, destination-wide fixes, the dataset. */
function token(dest: string, pp: string): { t: string; src: RawSource } {
  if (dest === 'US' && (US_FULL_SET.has(pp) || US_PART_SET.has(pp))) return { t: 'N', src: 'ban' };
  const w = WX_INDEX.get(pp)?.get(dest);
  if (w) return { t: w, src: 'wiki' };
  const row = MX_ROWS.get(dest);
  const idx = PP_INDEX.get(pp);
  if (!row || idx === undefined) throw new Error(`Unknown pair ${pp} -> ${dest}`);
  const t = row[idx]!;
  const rm = RMAP[dest];
  if (rm) {
    let v = rm[t] ?? rm[/^\d+$/.test(t) ? 'F' : t];
    if (v) {
      if (!v.includes('/') && /^\d+$/.test(t) && !/^[RN]$/.test(v)) v += '/' + t;
      return { t: v, src: 'rmap' };
    }
  }
  return { t, src: 'mx' };
}

function parseToken(t: string): { codes: string[]; days: number | null } {
  if (/^\d+$/.test(t)) return { codes: ['F'], days: Number(t) };
  const [c, d] = t.split('/');
  return { codes: c!.split('+'), days: d ? Number(d) : null };
}

type Opt = EntryOption & { short: string };

function makeOption(dest: string, code: string, days: number | null): Opt {
  const type = CODE_TYPE[code]!;
  const dx = DX[dest]?.[code as 'F' | 'A' | 'T' | 'E' | 'R'] ?? {};
  const stay = dx.days ?? (type === 'visa' || type === 'none' ? null : days);
  return {
    type,
    label: dx.n ?? OPT_NAME[type],
    days: stay,
    fee: dx.fee ?? (type === 'free' ? 'Free' : 'Varies by nationality'),
    short: dx.f ?? dx.fee ?? (type === 'free' ? 'Free' : 'Varies'),
    where: dx.where ?? OPT_WHERE[type],
    url: dx.url ?? null,
    act: dx.act ?? (type === 'free' && stay ? `enter visa-free for ${stay} days` : OPT_ACT[type]),
  };
}

interface Base {
  type: EntryType;
  days: number | null;
  fee: string;
  process: string;
  stamp: string[];
  note: string;
}

function baseRule(code: string): Base {
  switch (code) {
    case 'F':
      return {
        type: 'free',
        days: null,
        fee: 'Free',
        process: 'No visa needed',
        stamp: ['Visa-free', 'No visa'],
        note: 'No visa is needed, and no fixed day limit is listed, as with free-movement areas.',
      };
    case 'A':
      return {
        type: 'voa',
        days: null,
        fee: 'Varies',
        process: 'Issued at the border',
        stamp: ['On arrival', 'At border'],
        note: 'You get the visa when you land. Fees and the length of stay vary, so carry cash in a major currency and a ticket out.',
      };
    case 'T':
      return {
        type: 'eta',
        days: null,
        fee: 'Varies',
        process: 'Online before you fly',
        stamp: ['eTA', 'Apply online'],
        note: 'You need an electronic travel authorisation before you fly. It is usually quick to get online.',
      };
    case 'E':
      return {
        type: 'evisa',
        days: null,
        fee: 'Varies',
        process: 'Online before you fly',
        stamp: ['e-Visa', 'Apply online'],
        note: 'Apply for an e-visa online before you fly. The fee and processing time depend on your nationality.',
      };
    case 'N':
      return {
        type: 'none',
        days: null,
        fee: '—',
        process: 'Not admitted',
        stamp: ['No entry', 'Not admitted'],
        note: 'This passport is not currently admitted, for example because of a travel ban or conflict. Follow official travel advice.',
      };
    default:
      return {
        type: 'visa',
        days: null,
        fee: 'Varies',
        process: 'Apply before you fly',
        stamp: ['Visa required', 'Apply first'],
        note: 'You need a visa from an embassy or consulate before you travel. Allow several weeks.',
      };
  }
}

export function homeEntry(pp: string): Entry {
  return {
    passport: pp,
    destination: pp,
    type: 'home',
    days: null,
    ext: 0,
    fee: 'None',
    process: 'Citizen',
    note: "This is your own passport's country, so no visa or entry permission applies.",
    stamp: ['Citizen', 'Home', 'No visa'],
    apply: null,
    form: null,
    options: [
      {
        type: 'home',
        label: 'Citizen',
        days: null,
        fee: 'None',
        where: 'Enter on your own passport.',
        url: null,
        act: 'enter as a citizen',
      },
    ],
    source: 'home',
    checked: true,
  };
}

const hostOf = (u: string) => u.replace(/^https?:\/\/(www\.)?/, '').replace(/\/.*$/, '');
const strip = ({ short: _short, ...o }: Opt): EntryOption => o;

/** Entry rule for any destination outside the four hand-checked ones. */
export function datasetEntry(dest: string, pp: string): Entry {
  if (dest === pp) return homeEntry(pp);
  const { t, src } = token(dest, pp);
  const { codes, days } = parseToken(t);
  if (codes[0] === 'H') return homeEntry(pp);
  const order = [...new Set(codes)].sort((a, b) => PREF.indexOf(a) - PREF.indexOf(b));
  const opts = order.map((c) => makeOption(dest, c, days));
  const main = opts[0]!;
  const dx = DX[dest];
  const r = baseRule(order[0]!);
  let apply: Entry['apply'] = null;

  if (main.days && r.type !== 'visa' && r.type !== 'none') {
    r.days = main.days;
    r.stamp = [r.stamp[0]!, `${main.days} days`];
    if (r.type === 'free') r.note = `Visa-free for up to ${main.days} days for tourism.`;
  }
  if (dx?.[order[0] as 'F']) {
    r.fee = main.short;
    if (r.type !== 'free') r.stamp = [r.stamp[0]!, r.stamp[1]!, main.short];
  }
  if (main.url && (r.type === 'evisa' || r.type === 'eta')) apply = { label: `Apply at ${hostOf(main.url)}`, url: main.url };
  if (src === 'ban') {
    r.note = US_FULL_SET.has(pp)
      ? 'Under the US entry suspension in force since 1 January 2026, this passport cannot get a US visitor visa. Narrow exceptions exist, for example for existing visa holders and some dual nationals.'
      : 'Since 1 January 2026 the US has suspended B-1/B-2 visitor visas for this passport (and student and exchange visas). Visas issued before then stay valid.';
  }
  if (dest === 'LK' && LK_FREE_SET.has(pp)) {
    for (const o of opts) {
      if (o.type === 'eta') {
        o.fee = 'Free since 25 May 2026; you still apply online';
        o.short = 'Free';
        if (o === main) r.fee = 'Free';
      }
    }
  }
  if (opts.length > 1) {
    r.note = dx?.tip ?? 'There is more than one way in. Each option is listed with its fee and where to get it.';
  } else if (dx?.tip && dx[order[0] as 'F'] && r.type !== 'free' && r.type !== 'none') {
    r.note = dx.tip;
  }

  return {
    passport: pp,
    destination: dest,
    type: r.type,
    days: r.days,
    ext: 0,
    fee: r.fee,
    process: r.process,
    note: r.note,
    stamp: r.stamp,
    apply,
    form: null,
    options: opts.map(strip),
    source: SOURCE[src],
    checked: src !== 'mx' || Boolean(dx),
  };
}
