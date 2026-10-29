import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Server-only modules are imported by server components; they are inert under test.
vi.mock('server-only', () => ({}));

afterEach(() => {
  cleanup();
  document.cookie = 'stamped_pp=; Max-Age=0; Path=/';
  localStorage.clear();
});
