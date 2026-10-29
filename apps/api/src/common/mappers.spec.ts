import { countsRecord, rankOf } from './mappers.js';

describe('rankOf', () => {
  const scores = [167, 160, 160, 152, 21];

  it('ranks the strongest passport first', () => {
    expect(rankOf(167, scores)).toBe(1);
  });

  it('gives equal scores the same rank', () => {
    expect(rankOf(160, scores)).toBe(2);
    expect(rankOf(152, scores)).toBe(4);
  });

  it('ranks the weakest last', () => {
    expect(rankOf(21, scores)).toBe(5);
  });
});

describe('countsRecord', () => {
  it('turns grouped rows into a record with numeric counts', () => {
    expect(
      countsRecord([
        { type: 'free', n: 27 },
        { type: 'visa', n: '86' as unknown as number },
      ]),
    ).toEqual({ free: 27, visa: 86 });
  });
});
