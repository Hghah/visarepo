'use client';
import { useEffect } from 'react';

export default function ErrorPage({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="wrap gut py-16 sm:py-24">
      <div className="notice" role="alert">
        <p className="mb-2 font-mono text-sm uppercase tracking-widest text-muted">Temporarily unavailable</p>
        <h2>We couldn&apos;t load the entry rules.</h2>
        <p>The rules service may be restarting. Try again in a moment.</p>
        <button type="button" className="btn" onClick={() => retry()}>
          Try again
        </button>
      </div>
    </section>
  );
}
