import { Header } from '@nestjs/common';

/**
 * Entry data only changes when a new data set is deployed, so responses can be cached by browsers
 * and shared caches for a few minutes and served stale while revalidating.
 */
export const PublicCache = (maxAge = 300, swr = 3600) =>
  Header('Cache-Control', `public, max-age=${maxAge}, stale-while-revalidate=${swr}`);
