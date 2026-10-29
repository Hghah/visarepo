/** A seeded barcode strip for the boarding-pass stub. */
export function Bars({ seed }: { seed: string }) {
  let h = 7;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const widths: number[] = [];
  for (let i = 0; i < 38; i++) {
    h = (Math.imul(h, 1103515245) + 12345) >>> 0;
    widths.push(1 + ((h >>> 29) % 3));
  }
  return (
    <span className="bars" aria-hidden="true">
      {widths.map((w, i) => (
        <i key={i} style={{ width: `${w}px` }} />
      ))}
    </span>
  );
}
