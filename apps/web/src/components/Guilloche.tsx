'use client';
import { useEffect, useRef } from 'react';
import { hashStr, rng } from '@/lib/random';

type Variant = 'home' | 'destination';

/**
 * The security-paper background: seeded guilloche waves, plus rosettes on the home page or contour
 * "relief" lines on a destination, like the hidden pattern on a passport visa page.
 */
function draw(cv: HTMLCanvasElement, variant: Variant, seed: string): void {
  const rc = cv.getBoundingClientRect();
  if (!rc.width) return;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  cv.width = Math.round(rc.width * dpr);
  cv.height = Math.round(rc.height * dpr);
  const x = cv.getContext('2d');
  if (!x) return;
  x.setTransform(dpr, 0, 0, dpr, 0, 0);
  const W = rc.width;
  const H = rc.height;
  const R = rng(hashStr(seed));
  const cs = getComputedStyle(document.body);
  const ga = cs.getPropertyValue('--guil-a').trim();
  const gb = cs.getPropertyValue('--guil-b').trim();
  const gc = cs.getPropertyValue('--guil-c').trim();
  const rain = x.createLinearGradient(0, 0, W, H);
  rain.addColorStop(0, ga);
  rain.addColorStop(0.5, gb);
  rain.addColorStop(1, gc);
  const f1 = 26 + R() * 30;
  const f2 = 90 + R() * 90;
  const a1 = 4 + R() * 6;
  const a2 = 4 + R() * 7;
  const ph = R() * 6;
  const n = variant === 'home' ? 40 : 30;
  x.lineWidth = 0.7;
  x.strokeStyle = rain;
  for (let i = 0; i < n; i++) {
    x.beginPath();
    for (let px = 0; px <= W + 6; px += 5) {
      const y = H * 0.04 + i * ((H * 0.94) / n) + Math.sin(px / f1 + i * 0.42 + ph) * a1 + Math.sin(px / f2 + i * 0.11) * a2;
      if (px) x.lineTo(px, y);
      else x.moveTo(px, y);
    }
    x.stroke();
  }

  if (variant === 'home') {
    const cx = W > 860 ? W * 0.24 : W * 0.8;
    const cy = W > 860 ? H * 0.82 : H * 0.18;
    const u = Math.min(W, H) * 0.05;
    const rosette = (a: number, b: number, d: number, col: string, loops: number) => {
      x.beginPath();
      x.strokeStyle = col;
      const k = (a - b) / b;
      for (let t = 0; t <= Math.PI * 2 * loops + 0.01; t += 0.008) {
        const px = cx + (a - b) * Math.cos(t) + d * Math.cos(k * t);
        const py = cy + (a - b) * Math.sin(t) - d * Math.sin(k * t);
        if (t) x.lineTo(px, py);
        else x.moveTo(px, py);
      }
      x.stroke();
    };
    rosette(7 * u, 2 * u, 3.2 * u, ga, 2);
    rosette(9 * u, 4 * u, 2.6 * u, gc, 4);
    rosette(5 * u, 3 * u, 1.6 * u, gb, 3);
    return;
  }

  const peaks: [number, number][] = [
    [W * (0.06 + R() * 0.3), H * (0.25 + R() * 0.55)],
    [W * (0.3 + R() * 0.25), H * (0.15 + R() * 0.7)],
  ];
  const k1 = 2 + Math.floor(R() * 3);
  const k2 = 4 + Math.floor(R() * 4);
  const p1 = R() * 6;
  const p2 = R() * 6;
  x.lineWidth = 0.9;
  peaks.forEach(([cx, cy], pi) => {
    const rings = 12 + pi * 4;
    const base = 6 + R() * 6;
    const step = Math.min(W, H) * (0.028 + R() * 0.012);
    for (let k = 0; k < rings; k++) {
      x.beginPath();
      x.strokeStyle = k % 5 === 4 ? gc : pi ? gb : ga;
      const r0 = base + k * step;
      for (let t = 0; t <= Math.PI * 2 + 0.02; t += 0.03) {
        const rr = r0 * (1 + 0.16 * Math.sin(k1 * t + p1 + k * 0.07) + 0.07 * Math.sin(k2 * t + p2 - k * 0.05));
        const px = cx + rr * Math.cos(t);
        const py = cy + rr * 0.78 * Math.sin(t);
        if (t) x.lineTo(px, py);
        else x.moveTo(px, py);
      }
      x.stroke();
    }
  });
}

export function Guilloche({ variant, seed }: { variant: Variant; seed: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    let frame = requestAnimationFrame(() => draw(cv, variant, seed));
    const redraw = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => draw(cv, variant, seed));
    };
    const ro = new ResizeObserver(redraw);
    ro.observe(cv);
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', redraw);
    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
      mq.removeEventListener('change', redraw);
    };
  }, [variant, seed]);

  return <canvas ref={ref} aria-hidden="true" />;
}
