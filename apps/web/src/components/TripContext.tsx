'use client';
import type { Cabin } from '@stamped/core';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { clamp, parseISODate } from '@/lib/dates';

export interface Trip {
  /** YYYY-MM-DD, or '' while the field is being edited. */
  depart: string;
  nights: number;
  kind: 'return' | 'oneway';
  passengers: number;
  cabin: Cabin;
  /** The city typed into "From", remembered between visits. */
  from: string;
}

interface TripState {
  trip: Trip;
  update: (patch: Partial<Trip>) => void;
  /** True once the saved trip has been restored in the browser. */
  ready: boolean;
}

const STORAGE_KEY = 'stamped-trip-v1';
const CABIN_KEYS: readonly Cabin[] = ['economy', 'premium', 'business'];
export const DEFAULT_NIGHTS = 14;

const TripContext = createContext<TripState | null>(null);

/** Restore a saved trip, dropping anything invalid or a departure that has already passed. */
export function restoreTrip(raw: string | null, base: Trip, today: string): Trip {
  if (!raw) return base;
  try {
    const s = JSON.parse(raw) as Partial<Trip>;
    const dep = parseISODate(s.depart);
    const now = parseISODate(today);
    return {
      depart: dep && now && dep >= now ? s.depart! : base.depart,
      nights: Number.isFinite(s.nights) ? clamp(Math.round(s.nights!), 1, 365) : base.nights,
      kind: s.kind === 'oneway' ? 'oneway' : 'return',
      passengers: Number.isFinite(s.passengers) ? clamp(Math.round(s.passengers!), 1, 6) : base.passengers,
      cabin: CABIN_KEYS.includes(s.cabin as Cabin) ? (s.cabin as Cabin) : base.cabin,
      from: typeof s.from === 'string' ? s.from.slice(0, 80) : base.from,
    };
  } catch {
    return base;
  }
}

/** Trip dates shared by the flight search and the season chart; kept in this browser only. */
export function TripProvider({ defaultDepart, today, children }: { defaultDepart: string; today: string; children: ReactNode }) {
  const [trip, setTrip] = useState<Trip>({
    depart: defaultDepart,
    nights: DEFAULT_NIGHTS,
    kind: 'return',
    passengers: 1,
    cabin: 'economy',
    from: '',
  });
  const [ready, setReady] = useState(false);

  // Saved trips live in localStorage, which only exists after hydration.
  useEffect(() => {
    let raw: string | null = null;
    try {
      raw = localStorage.getItem(STORAGE_KEY);
    } catch {
      /* storage blocked: start from the defaults */
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time restore of browser-only state after hydration
    setTrip((t) => restoreTrip(raw, t, today));
    setReady(true);
  }, [today]);

  const update = useCallback((patch: Partial<Trip>) => {
    setTrip((t) => {
      const next = { ...t, ...patch };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* storage unavailable: keep the trip for this visit only */
      }
      return next;
    });
  }, []);

  const value = useMemo(() => ({ trip, update, ready }), [trip, update, ready]);
  return <TripContext.Provider value={value}>{children}</TripContext.Provider>;
}

export function useTrip(): TripState {
  const ctx = useContext(TripContext);
  if (!ctx) throw new Error('useTrip must be used inside <TripProvider>');
  return ctx;
}
