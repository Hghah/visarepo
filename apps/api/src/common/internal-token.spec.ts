import { tokenMatches } from './internal-token.js';

describe('tokenMatches', () => {
  const token = 'a-long-shared-secret';

  it('accepts only the exact token', () => {
    expect(tokenMatches(token, token)).toBe(true);
    expect(tokenMatches('a-long-shared-secreT', token)).toBe(false);
    expect(tokenMatches('short', token)).toBe(false);
    expect(tokenMatches(['a', 'b'], token)).toBe(false);
  });

  it('never matches when no token is configured', () => {
    expect(tokenMatches('', undefined)).toBe(false);
    expect(tokenMatches(undefined, undefined)).toBe(false);
  });

  it('handles multi-byte input without throwing', () => {
    expect(tokenMatches('é'.repeat(20), 'e'.repeat(20))).toBe(false);
  });
});
