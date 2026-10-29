import { hostOf, type Entry } from '@stamped/core';

const NUMBER_WORDS = ['', 'One', 'Two', 'Three', 'Four', 'Five'];

/** Side-by-side tickets when a destination offers more than one way in. */
export function Ways({ entry }: { entry: Entry }) {
  const n = entry.options.length;
  return (
    <section id="ways">
      <div className="sh">
        <h2>{NUMBER_WORDS[n] ?? n} ways in</h2>
        <p>Each route with its stay, fee and where to get it. Pick the one that fits your trip.</p>
      </div>
      <div className="ways">
        {entry.options.map((o, i) => (
          <div key={`${o.type}-${i}`} className={`ticket tk-${o.type}`}>
            <span className="tk-h">
              <i className={`dt mx-${o.type}`} />
              {o.label}
            </span>
            <p className="tk-stay">{o.days ? `${o.days} days` : o.type === 'visa' ? 'Set by the visa' : 'Set on entry'}</p>
            <p className="tk-fee">{o.fee}</p>
            <p className="tk-where">{o.where}</p>
            {o.url && (
              <a href={o.url} target="_blank" rel="noopener noreferrer">
                {hostOf(o.url)} ↗
              </a>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
