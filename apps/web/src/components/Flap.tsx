import type { CSSProperties } from 'react';

/** Split-flap text: each letter flips into place, like an airport departure board. Words never break mid-word. */
export function Flap({ text, delay = 0 }: { text: string; delay?: number }) {
  let i = 0;
  const words = text.split(' ');
  return (
    <span className="flap" style={delay ? ({ '--d': `${delay}ms` } as CSSProperties) : undefined}>
      <span className="sr">{text}</span>
      <span aria-hidden="true">
        {words.map((w, wi) => (
          <span key={wi}>
            <span className="fw">
              {[...w].map((ch) => (
                <span key={i} className="fc" style={{ '--i': i++ } as CSSProperties}>
                  {ch}
                </span>
              ))}
            </span>
            {wi < words.length - 1 ? ' ' : null}
          </span>
        ))}
      </span>
    </span>
  );
}
