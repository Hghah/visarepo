import { TYPE_LABEL, TYPE_SHORT } from './labels.js';
import type { Entry } from './types.js';

type EntryLike = Pick<Entry, 'type' | 'days' | 'options'>;

export const isMulti = (e: Pick<Entry, 'options'>): boolean => e.options.length > 1;

/** "VOA or e-Visa" for multi-option entries, otherwise the type label. */
export function entryTag(e: EntryLike): string {
  if (!isMulti(e)) return TYPE_LABEL[e.type];
  return [...new Set(e.options.map((o) => TYPE_SHORT[o.type]))].join(' or ');
}

export function stayText(e: Pick<Entry, 'type' | 'days'>): string {
  if (e.type === 'home') return 'No limit';
  if (e.type === 'none') return '—';
  if (e.days) return `${e.days} days`;
  return e.type === 'free' ? 'Not fixed' : 'Per visa';
}

const NUMBER_WORDS = ['', 'One', 'Two', 'Three', 'Four', 'Five'];

/** One sentence that answers "how do I get in?". */
export function entrySentence(e: EntryLike, generic: boolean): string {
  if (isMulti(e)) {
    return `${NUMBER_WORDS[e.options.length] ?? e.options.length} ways in: ${e.options.map((o) => o.act).join(', or ')}.`;
  }
  const d = e.days;
  switch (e.type) {
    case 'free':
      return d ? `Stay up to ${d} days without a visa.` : 'Enter without a visa.';
    case 'evisa':
      return `Get an e-visa online before you fly.${d ? ` Stays up to ${d} days.` : ''}`;
    case 'voa':
      return `${generic ? 'Get your visa when you land.' : 'Buy the visa online or at the airport.'}${d ? ` Stays up to ${d} days.` : ''}`;
    case 'eta':
      return 'Get an electronic travel authorisation before you fly.';
    case 'visa':
      return `Get a visa before you fly.${d ? ` A tourist visa allows up to ${d} days per entry.` : ''}`;
    case 'none':
      return 'Entry is not currently permitted.';
    case 'home':
      return 'No visa needed. You are a citizen.';
  }
}

export function hostOf(url: string): string {
  return url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/.*$/, '');
}
