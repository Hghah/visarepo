'use client';
import './globals.css';

export default function GlobalError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <html lang="en">
      <body>
        <main className="wrap gut py-16">
          <div className="notice" role="alert">
            <h2>Something went wrong.</h2>
            <p>Please reload the page.</p>
            <button type="button" className="btn" onClick={() => retry()}>
              Reload
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
