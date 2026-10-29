import { STAMP_LABEL, entrySentence, entryTag, stayText, type EntryDetail } from '@stamped/core';
import { Bars } from './Bars';
import { Flap } from './Flap';
import { PlaneIcon } from './Icons';
import { Stamp } from './Stamp';
import { hashStr } from '@/lib/random';

interface PassProps {
  detail: EntryDetail;
  /** True for destinations outside the in-depth reviewed set. */
  generic: boolean;
  /** ISO date printed on the entry stamp. */
  date: string;
}

/** The verdict as a boarding pass: route, entry type, stay, fee and the official links. */
export function Pass({ detail, generic, date }: PassProps) {
  const { entry: r, passport: p, destination: c } = detail;
  const from = p.airportCode ?? p.code;
  const to = c.airportCode ?? c.code;
  const tag = entryTag(r);
  const ext = r.ext ? `+${r.ext} days` : generic && r.type !== 'home' && r.type !== 'none' ? 'Ask locally' : 'None';
  const rotate = (hashStr(c.code + p.code) % 15) - 11;
  const micro = `${c.name.toUpperCase()} · ${to} · ${STAMP_LABEL[r.type]} · `.repeat(14);

  return (
    <div className="pass-box">
      <div className="pass-wrap" style={{ filter: 'drop-shadow(0 22px 26px rgba(5,8,12,.18))' }}>
        <article className="pass" aria-label={`Your entry to ${c.name}`}>
          <div className="pass-main">
            <div className="pass-route">
              <div>
                <span className="pc">{from}</span>
                <span className="pn">{p.name} passport</span>
              </div>
              <span className="pass-fly">
                <PlaneIcon />
              </span>
              <div className="r">
                <span className="pc">{to}</span>
                <span className="pn">{c.name}</span>
              </div>
            </div>
            <div>
              <span className="pass-k">Entry</span>
              <p className={`pass-status st-${r.type}${tag.length > 12 ? ' long' : ''}`} data-testid="entry-status">
                <Flap text={tag} />
              </p>
            </div>
            <p className="pass-line">{entrySentence(r, generic)}</p>
            {r.type !== 'home' && (r.apply || r.form) && (
              <div className="vcta">
                {r.apply && (
                  <a className="btn" href={r.apply.url} target="_blank" rel="noopener noreferrer">
                    {r.apply.label} ↗
                  </a>
                )}
                {r.form && (
                  <a className={`btn${r.apply ? ' btn-ghost' : ''}`} href={r.form.url} target="_blank" rel="noopener noreferrer">
                    {r.form.name} ↗
                  </a>
                )}
              </div>
            )}
            <p className="micro" aria-hidden="true">
              {micro}
            </p>
          </div>
          <div className="pass-stub">
            <div>
              <span className="pass-k">Max stay</span>
              <b data-testid="max-stay">{stayText(r)}</b>
            </div>
            <div>
              <span className="pass-k">Visa fee</span>
              <b>{r.fee}</b>
            </div>
            <div>
              <span className="pass-k">Extension</span>
              <b>{ext}</b>
            </div>
            <Bars seed={from + to + p.code} />
          </div>
        </article>
      </div>
      {r.type !== 'home' && (
        <Stamp slot="ps" code={c.code} name={c.name} type={r.type} days={r.days} airport={c.airportCode} date={date} rotate={rotate} />
      )}
    </div>
  );
}
