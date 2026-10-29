import { STAMP_LABEL, type EntryType } from '@stamped/core';
import type { CSSProperties, ReactNode } from 'react';
import { PLANE_PATH } from './Icons';
import { hashStr } from '@/lib/random';

const INK: Record<EntryType, string> = {
  free: 'var(--ok)',
  voa: 'var(--warn)',
  eta: 'var(--eta)',
  evisa: 'var(--evisa)',
  visa: 'var(--bad)',
  none: 'var(--fg)',
  home: 'var(--muted)',
};

const SHAPES = ['circle', 'rect', 'oct', 'oval'] as const;

export interface StampProps {
  code: string;
  name: string;
  type: EntryType;
  days: number | null;
  /** Printed when no stay length is known; falls back to the country code. */
  airport?: string | null;
  /** ISO date printed on the stamp. */
  date: string;
  /** Position class from the stylesheet (`s1`, `s2`, `ps`). Also keeps SVG ids unique on the page. */
  slot: string;
  rotate?: number;
}

function stampDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  return Number.isNaN(d.getTime())
    ? ''
    : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).toUpperCase();
}

/** ASCII upper-case name that fits the stamp ring. */
export function stampName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9 .'-]/g, '')
    .slice(0, 22);
}

function text(x: number, y: number, size: number, value: string, opts: { width?: number; spacing?: number } = {}): ReactNode {
  const squeeze =
    opts.width && value.length * 7.2 > opts.width ? { textLength: opts.width, lengthAdjust: 'spacingAndGlyphs' as const } : {};
  return (
    <text x={x} y={y} textAnchor="middle" fontSize={size} letterSpacing={opts.spacing ?? 0} fill="currentColor" stroke="none" {...squeeze}>
      {value}
    </text>
  );
}

const plane = (x: number, y: number, scale: number): ReactNode => (
  <path transform={`translate(${x} ${y}) scale(${scale})`} d={PLANE_PATH} fill="currentColor" stroke="none" />
);

/** An inked entry stamp. Shape is derived from the country and entry type, ink colour from the entry type. */
export function Stamp({ code, name, type, days, airport, date, slot, rotate = 0 }: StampProps) {
  const shape = SHAPES[hashStr(code + type) % 4];
  const nm = stampName(name);
  const label = STAMP_LABEL[type];
  const big = days ? `${days}D` : (airport ?? code);
  const dt = stampDate(date);
  const uid = `${slot}${code}`;

  let body: ReactNode;
  if (shape === 'circle') {
    body = (
      <>
        <circle cx="80" cy="80" r="74" strokeWidth="4" />
        <circle cx="80" cy="80" r="62" strokeWidth="1.4" />
        <path id={`a${uid}`} d="M24 80a56 56 0 0 1 112 0" fill="none" stroke="none" />
        <path id={`b${uid}`} d="M22 80a58 58 0 0 0 116 0" fill="none" stroke="none" />
        <text fontSize="11.5" letterSpacing="2" textAnchor="middle" fill="currentColor" stroke="none">
          <textPath href={`#a${uid}`} startOffset="50%">
            {nm}
          </textPath>
        </text>
        <text fontSize="10" letterSpacing="1.5" textAnchor="middle" fill="currentColor" stroke="none">
          <textPath href={`#b${uid}`} startOffset="50%" dominantBaseline="hanging">
            {label}
          </textPath>
        </text>
        {plane(68, 44, 1)}
        {text(80, 96, 27, big, { spacing: 1 })}
        <line x1="40" y1="106" x2="120" y2="106" strokeWidth="1.2" />
        {text(80, 121, 10.5, dt, { spacing: 1 })}
      </>
    );
  } else if (shape === 'oval') {
    body = (
      <>
        <ellipse cx="80" cy="80" rx="76" ry="56" strokeWidth="4" />
        <ellipse cx="80" cy="80" rx="66" ry="46" strokeWidth="1.3" />
        {text(80, 57, 11, nm, { width: 96, spacing: 1.6 })}
        {plane(30, 70, 0.9)}
        {text(88, 90, 26, big, { spacing: 1 })}
        {text(80, 108, 9.5, label, { width: 92, spacing: 1.2 })}
        {text(80, 121, 9, dt, { spacing: 1 })}
      </>
    );
  } else {
    body = (
      <>
        {shape === 'rect' ? (
          <>
            <rect x="6" y="24" width="148" height="112" rx="12" strokeWidth="4" />
            <rect x="14" y="32" width="132" height="96" rx="6" strokeWidth="1.3" />
          </>
        ) : (
          <>
            <path d="M40 22h80l34 30v56l-34 30H40L6 108V52z" strokeWidth="4" strokeLinejoin="round" />
            <path d="M44 31h72l29 25v48l-29 25H44L15 104V56z" strokeWidth="1.3" strokeLinejoin="round" />
          </>
        )}
        {text(80, 52, 11, nm, { width: 112, spacing: 1.6 })}
        <line x1="24" y1="60" x2="136" y2="60" strokeWidth="1.2" />
        {plane(26, 68, 1)}
        {text(92, 90, 27, big, { spacing: 1 })}
        {text(80, 110, 10, label, { width: 112, spacing: 1.4 })}
        {text(80, 124, 9.5, dt, { spacing: 1 })}
      </>
    );
  }

  const style: CSSProperties = { transform: `rotate(${rotate}deg)`, color: INK[type] };
  return (
    <span className={`stampg ${slot}`} style={style} data-shape={shape}>
      <svg viewBox="0 0 160 160" role="img" aria-label={`${name} entry stamp: ${label.toLowerCase()}`}>
        <g filter="url(#ink)" opacity=".9" fill="none" stroke="currentColor">
          {body}
        </g>
      </svg>
    </span>
  );
}
