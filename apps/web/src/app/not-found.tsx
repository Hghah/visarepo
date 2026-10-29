import Link from 'next/link';

export default function NotFound() {
  return (
    <section className="wrap gut py-16 sm:py-24">
      <div className="notice">
        <p className="mb-2 font-mono text-sm uppercase tracking-widest text-muted">Error 404 · Not admitted</p>
        <h2>We couldn&apos;t find that page.</h2>
        <p>The destination may be spelled differently, or the link is out of date.</p>
        <Link className="btn" href="/">
          See every destination
        </Link>
      </div>
    </section>
  );
}
