/** The brand mark: an entry stamp with an arrow into a bar (arrivals). */
export function Logo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <g transform="rotate(-9 16 16)">
        <rect x="3.2" y="7" width="25.6" height="18" rx="3.6" fill="none" stroke="currentColor" strokeWidth="2" />
        <rect
          x="6"
          y="9.8"
          width="20"
          height="12.4"
          rx="1.8"
          fill="none"
          stroke="currentColor"
          strokeWidth=".9"
          strokeDasharray="1.3 1.5"
        />
        <path
          d="M9.6 16h8.6m0 0-3-3m3 3-3 3M21.8 12.4v7.2"
          fill="none"
          stroke="var(--accent)"
          strokeWidth="2.1"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}

export function ArrowIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true">
      <path d="M3 8h10m0 0-4-4m4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export const PLANE_PATH =
  'M21.5 12c0-.6-.5-1.1-1.1-1.1h-5.6L9.6 3H7.7l2.6 7.9H5.2L3.6 8.8H2l1 3.2-1 3.2h1.6l1.6-2.1h5.1L7.7 21h1.9l5.2-7.9h5.6c.6 0 1.1-.5 1.1-1.1z';

export function PlaneIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d={PLANE_PATH} />
    </svg>
  );
}

export function SwapIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        d="M3 6h11m0 0-3-3m3 3-3 3M15 12H4m0 0 3-3m-3 3 3 3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** SVG filter that gives stamps a worn, uneven ink. Rendered once per page. */
export function InkFilter() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
      <defs>
        <filter id="ink" x="-8%" y="-8%" width="116%" height="116%">
          <feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves={2} seed={4} result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale={2.4} xChannelSelector="R" yChannelSelector="G" result="d" />
          <feTurbulence type="fractalNoise" baseFrequency=".045" numOctaves={3} seed={11} result="b" />
          <feColorMatrix in="b" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -3 0 0 0 2.6" result="m" />
          <feComposite in="d" in2="m" operator="in" />
        </filter>
      </defs>
    </svg>
  );
}
