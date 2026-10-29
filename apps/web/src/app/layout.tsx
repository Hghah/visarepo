import '@fontsource-variable/dm-sans/opsz.css';
import '@fontsource/dm-mono/400.css';
import '@fontsource/dm-mono/500.css';
import './globals.css';
import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { InkFilter } from '@/components/Icons';
import { SiteHeader } from '@/components/SiteHeader';
import { SITE_URL } from '@/lib/config';

const description =
  'Visa rules for 199 passports and destinations: where you can go visa-free, on arrival, with an eTA or e-visa, how long you can stay and what it costs.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: 'Stamped · Visa rules for every passport', template: '%s · Stamped' },
  description,
  applicationName: 'Stamped',
  alternates: { canonical: '/' },
  openGraph: { type: 'website', siteName: 'Stamped', title: 'Stamped · Visa rules for every passport', description },
  twitter: { card: 'summary', title: 'Stamped · Visa rules for every passport', description },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F4F5F1' },
    { media: '(prefers-color-scheme: dark)', color: '#0A0B17' },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <InkFilter />
        <SiteHeader />
        <main id="main">{children}</main>
      </body>
    </html>
  );
}
