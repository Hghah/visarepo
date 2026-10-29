import type { ArrivalForm, Entry, EntryOption, EntryType, Link } from '../shared/types.js';
import {
  ID_ASEAN,
  ID_FREE,
  ID_VOA,
  LINKS as L,
  PH_14,
  PH_30,
  PH_59,
  PH_EV,
  TH_14,
  TH_15,
  TH_30,
  TH_90,
  TH_R30,
  TH_VOA,
  VN_45A,
  VN_45B,
  VN_FREE,
} from './data/curated-lists.js';
import { homeEntry } from './generic.js';

/** Destinations whose rules were checked by hand against official notices (28 Oct 2026). */
export const CURATED = ['VN', 'TH', 'PH', 'ID'] as const;
export type CuratedCode = (typeof CURATED)[number];

export const ARRIVAL_FORMS: Record<CuratedCode, ArrivalForm> = {
  VN: { name: 'Pre-arrival declaration', short: 'Pre-arrival form', url: L.vnPai },
  TH: { name: 'Thailand Digital Arrival Card', short: 'TDAC', url: L.thTdac },
  PH: { name: 'eTravel registration', short: 'eTravel', url: L.phEtravel },
  ID: { name: 'All Indonesia arrival card', short: 'Arrival card', url: L.idAll },
};

interface Rule {
  type: EntryType;
  days: number | null;
  ext?: number;
  fee: string;
  process: string;
  stamp: string[];
  note: string;
  apply?: Link;
  opts?: EntryOption[];
}

const opt = (o: Omit<EntryOption, 'url'> & { url?: string | null }): EntryOption => ({ ...o, url: o.url ?? null });

const DEFAULT_LABEL: Record<EntryType, string> = {
  free: 'Visa-free',
  voa: 'Visa on arrival',
  eta: 'eTA',
  evisa: 'e-Visa',
  visa: 'Tourist visa',
  none: 'No entry',
  home: 'Citizen',
};
const DEFAULT_ACT: Record<EntryType, string> = {
  free: 'enter visa-free',
  voa: 'get a visa when you land',
  eta: 'get an eTA online before you fly',
  evisa: 'apply for an e-visa online before you fly',
  visa: 'apply for a visa before you fly',
  none: 'check official travel advice',
  home: 'enter as a citizen',
};

function vietnam(pp: string): Rule {
  const d = VN_FREE[pp];
  if (d) {
    const note45A = VN_45A.has(pp)
      ? ' The exemption runs until 14 March 2028.'
      : VN_45B.has(pp)
        ? ' The exemption runs until 14 August 2028.'
        : '';
    return {
      type: 'free',
      days: d,
      ext: 0,
      fee: 'Free',
      process: 'Stamped at the border',
      stamp: ['Visa-free', `${d} days`],
      note: `Single entry, no visa needed.${note45A} For a longer stay, or a loop through Cambodia or Laos and back, the 90-day e-visa gives you more room.`,
      opts: [
        opt({
          type: 'free',
          label: 'Visa-free',
          days: d,
          fee: 'Free',
          where: 'Stamped at the border. Single entry, cannot be extended.',
          act: `enter visa-free for ${d} days`,
        }),
        opt({
          type: 'evisa',
          label: 'e-Visa',
          days: 90,
          fee: 'US$25 single, US$50 multiple entry',
          where: 'Online, about 3 working days. Open to every nationality.',
          url: L.vnEvisa,
          act: 'apply for a 90-day e-visa',
        }),
      ],
    };
  }
  return {
    type: 'evisa',
    days: 90,
    ext: 0,
    fee: 'US$25',
    process: 'About 3 working days to process',
    stamp: ['e-Visa', '90 days', 'US$25'],
    apply: { label: 'Apply at evisa.gov.vn', url: L.vnEvisa },
    note: 'Every nationality can use the e-visa. US$25 covers a single entry and US$50 a multiple entry, each for up to 90 days. Use only evisa.gov.vn. Look-alike sites add their own service fees.',
  };
}

function thailand(pp: string): Rule {
  const tr = opt({
    type: 'evisa',
    label: 'Tourist visa (e-visa)',
    days: 60,
    fee: 'Set by the embassy, e.g. SGD 50 single entry',
    where: 'Apply on the Thai e-visa portal at least 3 weeks ahead. Extendable by 30 days in Thailand.',
    url: L.thEvisa,
    act: 'apply for a 60-day tourist e-visa',
  });
  const ex = (days: number, ext: number, note: string): Rule => ({
    type: 'free',
    days,
    ext,
    fee: 'Free',
    process: 'Stamped on arrival',
    stamp: ['Visa-free', `${days} days`],
    note,
    opts: [
      opt({
        type: 'free',
        label: 'Visa-free',
        days,
        fee: 'Free',
        where: ext ? `Stamped on arrival. Extendable once by ${ext} days for 1,900 THB.` : 'Stamped on arrival. Cannot be extended.',
        act: `enter visa-free for ${days} days`,
      }),
      tr,
    ],
  });
  if (TH_30.has(pp))
    return ex(
      30,
      30,
      'Since 15 September 2026 most passports get 30 days, down from 60. The exemption covers tourism only. Working, even remotely for a company abroad, needs a proper visa.',
    );
  if (TH_R30.has(pp))
    return ex(
      30,
      30,
      `${pp === 'RU' ? 'Russian passports get' : 'This passport gets'} 30 days under a separate two-way agreement, which the 2026 reform left unchanged. The stay is for tourism only.`,
    );
  if (TH_90.has(pp))
    return ex(90, 30, 'A two-way agreement gives this passport 90 days, unchanged by the 2026 reform. The stay is for tourism only.');
  if (TH_15.has(pp)) return ex(15, 0, 'This passport gets 15 days visa-free for tourism under the 2026 rules.');
  if (TH_14.has(pp))
    return ex(
      14,
      0,
      pp === 'MM'
        ? '14 days visa-free under a two-way agreement, for arrivals by air only.'
        : '14 days visa-free under a two-way agreement.',
    );
  if (TH_VOA.has(pp)) {
    return {
      type: 'voa',
      days: 15,
      ext: 0,
      fee: '2,000 THB',
      process: 'Issued at the airport counter',
      stamp: ['On arrival', '15 days', '2,000 THB'],
      note: 'Apply at the Visa on Arrival counter when you land and pay about 2,000 THB. Bring a passport photo, a ticket out within 15 days and your accommodation details. Staying longer? Get the 60-day tourist e-visa before you fly.',
      opts: [
        opt({
          type: 'voa',
          label: 'Visa on arrival',
          days: 15,
          fee: '2,000 THB',
          where: 'Counter at the main airports. Bring a photo, a ticket out within 15 days and your hotel details.',
          act: 'get a 15-day visa when you land',
        }),
        tr,
      ],
    };
  }
  return {
    type: 'visa',
    days: 60,
    ext: 30,
    fee: 'Varies',
    process: 'Apply before you fly',
    stamp: ['Visa required', 'Apply first'],
    apply: { label: 'Apply at thaievisa.go.th', url: L.thEvisa },
    note: 'This passport is not on the 2026 exemption list, so you need a tourist visa before travel. Most nationalities can apply online. A tourist visa allows up to 60 days per entry, extendable by 30.',
  };
}

const PH_EVISA_HIGH = new Set(['IN', 'KE', 'NG']);
function phEvisa(pp: string): EntryOption {
  const hi = PH_EVISA_HIGH.has(pp);
  return opt({
    type: 'evisa',
    label: 'e-Visa, 9(a) visitor',
    days: 59,
    fee: hi ? 'US$65 single (3 months); US$105 or US$145 multiple' : 'US$55 single (3 months); US$85 or US$115 multiple',
    where: 'Online, 7 to 12 working days for a single entry. For citizens and residents of the e-visa countries.',
    url: L.phEvisa,
    act: 'apply for a 59-day e-visa',
  });
}
const PH_14_NOTES: Record<string, string> = {
  CN: '14 days visa-free since 16 January 2026, for tourism or business. Entry only through Manila (NAIA) or Mactan-Cebu airports. The stay cannot be extended or converted.',
  TW: '14 days visa-free under a programme renewed until 30 June 2027. Staying longer means getting a visa before you travel.',
  HK: 'Hong Kong SAR passports get 14 days visa-free.',
  MO: 'Macau SAR passports get 14 days visa-free.',
};

function philippines(pp: string): Rule {
  const fr = (days: number, ext: number, note: string): Rule => ({
    type: 'free',
    days,
    ext,
    fee: 'Free',
    process: 'Stamped on arrival',
    stamp: ['Visa-free', `${days} days`],
    note,
  });
  let r: Rule;
  if (pp === 'IN') {
    r = fr(
      14,
      0,
      'Every Indian passport gets 14 days for tourism, since 8 June 2025. With a valid US, Japan, Australia, Canada, Schengen, Singapore or UK visa or residence permit, the stay is 30 days. Neither can be extended or converted to another visa.',
    );
    r.opts = [
      opt({
        type: 'free',
        label: 'Visa-free',
        days: 14,
        fee: 'Free',
        where: 'Stamped on arrival. Cannot be extended or converted.',
        act: 'enter visa-free for 14 days',
      }),
      opt({
        type: 'free',
        label: 'Visa-free with a qualifying visa',
        days: 30,
        fee: 'Free',
        where:
          'For holders of a valid US, Japan, Australia, Canada, Schengen, Singapore or UK visa or residence permit. Carry it with you.',
        act: 'stay 30 days if you hold a qualifying visa',
      }),
      phEvisa(pp),
    ];
    return r;
  }
  if (PH_30.has(pp))
    r = fr(30, 29, '30 days visa-free for tourism. Want longer? Extend at a Bureau of Immigration office before your 30 days run out.');
  else if (PH_59.has(pp)) r = fr(59, 0, 'A bilateral agreement gives this passport 59 days visa-free for tourism.');
  else if (PH_EV.has(pp)) {
    const ev = phEvisa(pp);
    const hi = PH_EVISA_HIGH.has(pp);
    return {
      type: 'evisa',
      days: 59,
      ext: 0,
      fee: hi ? 'US$65' : 'US$55',
      process: 'Online, 7 to 12 working days',
      stamp: ['e-Visa', '59 days', hi ? 'US$65' : 'US$55'],
      apply: { label: 'Apply at evisa.gov.ph', url: L.phEvisa },
      note: `This passport can get the 9(a) temporary visitor visa online: ${ev.fee}. You can still apply at a Philippine embassy instead.`,
      opts: [
        ev,
        opt({
          type: 'visa',
          label: 'Embassy visa',
          days: null,
          fee: 'Varies',
          where: 'At a Philippine embassy or consulate.',
          act: 'apply at an embassy',
        }),
      ],
    };
  } else if (PH_14.has(pp)) r = fr(14, 0, PH_14_NOTES[pp] ?? '14 days visa-free.');
  else {
    return {
      type: 'visa',
      days: null,
      ext: 0,
      fee: 'Varies',
      process: 'Apply before you fly',
      stamp: ['Visa required', 'Apply first'],
      apply: { label: 'Philippine e-visa portal', url: L.phEvisa },
      note: 'This passport is not on the visa-free list, so you need a visa before travel. Apply at a Philippine embassy or consulate. If you live in an e-visa country (Austria, France, Greece, India, Indonesia, Japan, Kenya, the Netherlands, Nigeria, Singapore, South Korea or the UAE), you can apply online at evisa.gov.ph.',
    };
  }
  if (PH_EV.has(pp) && r.type === 'free') {
    r.opts = [
      opt({
        type: 'free',
        label: 'Visa-free',
        days: r.days,
        fee: 'Free',
        where: r.ext
          ? 'Stamped on arrival. Extendable at the Bureau of Immigration.'
          : 'Stamped on arrival. Cannot be extended or converted.',
        act: `enter visa-free for ${r.days} days`,
      }),
      phEvisa(pp),
    ];
  }
  return r;
}

function indonesia(pp: string): Rule {
  const c1 = opt({
    type: 'evisa',
    label: 'C1 tourist e-visa',
    days: 60,
    fee: 'IDR 1,000,000 (about US$60)',
    where: 'Online, about 7 to 10 working days. Extendable twice by 60 days with a local sponsor, up to 180 days.',
    url: L.idEvisa,
    act: 'apply for the 60-day C1 tourist e-visa',
  });
  if (ID_FREE.has(pp)) {
    return {
      type: 'free',
      days: 30,
      ext: 0,
      fee: 'Free',
      process: 'Stamped on arrival',
      stamp: ['Visa-free', '30 days'],
      note: `${ID_ASEAN.has(pp) ? 'ASEAN passports get' : 'This passport gets'} 30 days visa-free. The stay cannot be extended or converted to another visa. Staying longer? Get the 60-day C1 tourist e-visa before you fly.`,
      opts: [
        opt({
          type: 'free',
          label: 'Visa-free',
          days: 30,
          fee: 'Free',
          where: 'Stamped on arrival. Cannot be extended or converted.',
          act: 'enter visa-free for 30 days',
        }),
        c1,
      ],
    };
  }
  if (ID_VOA.has(pp)) {
    return {
      type: 'voa',
      days: 30,
      ext: 30,
      fee: 'IDR 500K',
      process: 'e-VOA in about 1 working day',
      stamp: ['On arrival', '30 days', 'IDR 500K'],
      apply: { label: 'Get the e-VOA', url: L.idEvisa },
      note: 'The e-VOA and the airport visa on arrival are the same visa: 30 days, extendable once by 30 days in person. For up to 180 days, take the C1 tourist e-visa instead.',
      opts: [
        opt({
          type: 'voa',
          label: 'e-VOA, bought online',
          days: 30,
          fee: 'IDR 500,000',
          where: 'Online at least 48 hours before you fly. Opens the airport e-gates. Extendable once by 30 days.',
          url: L.idEvisa,
          act: 'buy the e-VOA online',
        }),
        opt({
          type: 'voa',
          label: 'Visa on arrival at the counter',
          days: 30,
          fee: 'IDR 500,000',
          where: 'Pay by card or cash at major airports and seaports. Extendable once by 30 days.',
          act: 'pay at the arrival counter',
        }),
        c1,
      ],
    };
  }
  return {
    type: 'visa',
    days: null,
    ext: 0,
    fee: 'Varies',
    process: 'Apply before you fly',
    stamp: ['Visa required', 'Apply first'],
    apply: { label: 'Apply at evisa.imigrasi.go.id', url: L.idEvisa },
    note: 'This passport is not on the visa-free or visa-on-arrival lists, so you need a visa before you fly. Apply on the immigration e-visa portal; some nationalities need an Indonesian sponsor.',
  };
}

const RULES: Record<CuratedCode, (pp: string) => Rule> = { VN: vietnam, TH: thailand, PH: philippines, ID: indonesia };

export function isCurated(code: string): code is CuratedCode {
  return (CURATED as readonly string[]).includes(code);
}

/** Entry rule for Vietnam, Thailand, the Philippines or Indonesia. */
export function curatedEntry(dest: CuratedCode, pp: string): Entry {
  if (dest === pp) return homeEntry(pp);
  const r = RULES[dest](pp);
  const options = r.opts ?? [
    opt({
      type: r.type,
      label: DEFAULT_LABEL[r.type],
      days: r.days,
      fee: r.fee,
      where: r.process,
      url: r.apply?.url ?? null,
      act: r.days && r.type === 'free' ? `enter visa-free for ${r.days} days` : DEFAULT_ACT[r.type],
    }),
  ];
  return {
    passport: pp,
    destination: dest,
    type: r.type,
    days: r.days,
    ext: r.ext ?? 0,
    fee: r.fee,
    process: r.process,
    note: r.note,
    stamp: r.stamp,
    apply: r.apply ?? null,
    form: ARRIVAL_FORMS[dest],
    options,
    source: 'curated',
    checked: true,
  };
}
