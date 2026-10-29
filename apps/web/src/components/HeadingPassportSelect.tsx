'use client';
import { COUNTRIES, fromName } from '@stamped/core';
import { useLayoutEffect, useRef } from 'react';
import { usePassportSwitch } from '@/lib/passport.client';

/** The passport menu set inside a heading. It sizes itself to the chosen name. */
export function HeadingPassportSelect({ passport }: { passport: string }) {
  const ref = useRef<HTMLSelectElement>(null);
  const [switchPassport, pending] = usePassportSwitch();

  // Browsers without `field-sizing: content` keep a select as wide as its longest option.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || CSS.supports('field-sizing', 'content')) return;
    const cs = getComputedStyle(el);
    const ctx = document.createElement('canvas').getContext('2d');
    if (!ctx) return;
    ctx.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    const label = el.options[el.selectedIndex]?.text ?? '';
    el.style.width = `${Math.ceil(ctx.measureText(label).width + parseFloat(cs.paddingRight) + 6)}px`;
  }, [passport]);

  return (
    <span className="hsel">
      <select
        ref={ref}
        id="hpp"
        aria-label="Passport"
        value={passport}
        aria-busy={pending}
        onChange={(e) => switchPassport(e.target.value)}
      >
        {COUNTRIES.map((c) => (
          <option key={c.code} value={c.code}>
            {fromName(c)}
          </option>
        ))}
      </select>
    </span>
  );
}
