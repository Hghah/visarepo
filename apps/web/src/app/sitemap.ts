import { COUNTRIES, DATASET_VERSION } from '@stamped/core';
import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/config';

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = DATASET_VERSION.slice(0, 10);
  return [
    { url: `${SITE_URL}/`, lastModified, changeFrequency: 'weekly', priority: 1 },
    ...COUNTRIES.map((c) => ({ url: `${SITE_URL}/${c.slug}`, lastModified, changeFrequency: 'weekly' as const, priority: 0.7 })),
  ];
}
