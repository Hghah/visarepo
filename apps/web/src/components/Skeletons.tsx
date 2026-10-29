import type { CSSProperties } from 'react';

/** A shimmering placeholder sized like the content that is streaming in. */
export function Loading({ height, className = '', label = 'Loading' }: { height: number; className?: string; label?: string }) {
  return <div className={`loading ${className}`} style={{ '--h': `${height}px` } as CSSProperties} role="status" aria-label={label} />;
}
