import {
  calculatePrizeFund,
  formatMinorUnits,
  formatPrizePercent,
  parseEntryFee,
  parsePrizeAmount,
} from './prize-fund.util';
import {
  PrizeFundConfiguration,
  PrizeFundTieMode,
} from '../types/prize-fund.interface';

describe('prize fund calculation', () => {
  const participant = (
    userId: number,
    totalPoints: number,
    exactHits = 0,
    goalDiffHits = 0,
    tendencyHits = 0,
  ) => ({
    userId,
    totalPoints,
    exactHits,
    goalDiffHits,
    tendencyHits,
    user: { username: 'User ' + userId },
  });
  const config = (
    prizeAmountsMinorUnits = ['150000', '100000', '50000'],
    tieMode: PrizeFundTieMode = 'share_equal_points',
    entryFeeMinorUnits = '50000',
  ): PrizeFundConfiguration => ({
    entryFeeMinorUnits,
    prizeFundRule: { tieMode, prizeAmountsMinorUnits },
  });
  it('preserves each winner avatar after sorting and splitting tied places', () => {
    const participants = [
      { ...participant(2, 10), user: { username: 'Ben', image: null } },
      {
        ...participant(1, 20),
        user: { username: 'Anna', image: '/uploads/anna.png' },
      },
      participant(3, 10),
    ];
    const result = calculatePrizeFund(participants, config());
    expect(result.winners).toEqual([
      jasmine.objectContaining({ userId: 1, userImage: '/uploads/anna.png' }),
      jasmine.objectContaining({ userId: 2, userImage: null }),
      jasmine.objectContaining({ userId: 3, userImage: null }),
    ]);
  });
  it('shows 500 UAH as 20 percent of a 2500 UAH fund', () => {
    const result = calculatePrizeFund(
      [1, 2, 3, 4, 5].map((id) => participant(id, 10 - id)),
      config(['50000'], 'tie_breakers'),
    );
    expect(result.totalMinorUnits).toBe(250000n);
    expect(result.winners[0].amountMinorUnits).toBe(50000n);
    expect(formatPrizePercent(50000n, result.totalMinorUnits, 'de')).toBe(
      '20,00 %',
    );
  });
  for (const amounts of [
    ['50000'],
    ['150000', '100000', '50000'],
    ['0', '1', '2', '3'],
  ]) {
    it(
      'keeps fixed prize amounts ' +
        amounts.join(',') +
        ' regardless of their sum',
      () => {
        const result = calculatePrizeFund(
          [1, 2, 3, 4, 5].map((id) => participant(id, 10 - id)),
          config(amounts, 'tie_breakers'),
        );
        expect(result.winners.map((winner) => winner.amountMinorUnits)).toEqual(
          amounts.map((amount) => BigInt(amount)),
        );
        expect(result.winners.length).toBe(amounts.length);
      },
    );
  }
  it('uses dense ranks and splits only the configured prize for each tied group', () => {
    const result = calculatePrizeFund(
      [
        participant(1, 20),
        participant(2, 10),
        participant(3, 10),
        participant(4, 5),
      ],
      config(['150000', '100001', '50000']),
    );
    expect(result.winners.map((winner) => winner.place)).toEqual([1, 2, 2, 3]);
    expect(result.winners.map((winner) => winner.amountMinorUnits)).toEqual([
      150000n,
      50001n,
      50000n,
      50000n,
    ]);
  });
  it('preserves backend order for the rest kopeck inside a shared place', () => {
    const result = calculatePrizeFund(
      [participant(7, 10, 0), participant(2, 10, 9)],
      config(['1']),
    );
    expect(result.winners.map((winner) => winner.userId)).toEqual([7, 2]);
    expect(result.winners.map((winner) => winner.amountMinorUnits)).toEqual([
      1n,
      0n,
    ]);
  });
  it('orders unique winners by points, exact, difference and tendency hits without mutating the data', () => {
    const rows = [
      participant(5, 9, 9),
      participant(4, 10, 1, 1, 1),
      participant(3, 10, 1, 1, 2),
      participant(2, 10, 1, 2),
      participant(1, 10, 2),
    ];
    expect(
      calculatePrizeFund(
        rows,
        config(['1', '2', '3', '4'], 'tie_breakers'),
      ).winners.map((winner) => winner.userId),
    ).toEqual([1, 2, 3, 4]);
    expect(rows[0].userId).toBe(5);
  });
  it('preserves first encountered user on a complete tie and limits unique winners', () => {
    expect(
      calculatePrizeFund(
        [participant(9, 0), participant(1, 0)],
        config(['50000'], 'tie_breakers'),
      ).winners.map((winner) => winner.userId),
    ).toEqual([9]);
  });
  it('does not redistribute configured amounts for unoccupied places', () => {
    const result = calculatePrizeFund([participant(1, 10)], config());
    expect(result.winners.length).toBe(1);
    expect(result.winners[0].amountMinorUnits).toBe(150000n);
  });
  it('retains fixed prizes even with a zero fund and shows zero percentages', () => {
    expect(calculatePrizeFund([], config()).winners).toEqual([]);
    const result = calculatePrizeFund(
      [participant(1, 0), participant(2, 0)],
      config(['50000'], 'share_equal_points', '0'),
    );
    expect(result.totalMinorUnits).toBe(0n);
    expect(result.winners.map((winner) => winner.amountMinorUnits)).toEqual([
      25000n,
      25000n,
    ]);
    expect(formatPrizePercent(25000n, 0n, 'de')).toBe('0,00 %');
  });
  it('uses exact money and percentage arithmetic above the safe Number range', () => {
    const fee = '9223372036854775807';
    const result = calculatePrizeFund(
      [participant(1, 5), participant(2, 1)],
      config([fee], 'tie_breakers', fee),
    );
    expect(result.totalMinorUnits).toBe(18446744073709551614n);
    expect(result.winners[0].amountMinorUnits).toBe(BigInt(fee));
    expect(formatPrizePercent(BigInt(fee), 1n, 'de')).toBe(
      '922.337.203.685.477.580.700,00 %',
    );
  });

  it('accepts migrated fixed amounts above the entry fee bigint range without truncation', () => {
    expect(parsePrizeAmount('184467440737095516.14')).toBe(
      '18446744073709551614',
    );
  });
  it('updates winners and percentages without scaling fixed amounts after membership or fee changes', () => {
    const configuration = config(['50000'], 'tie_breakers');
    const original = calculatePrizeFund(
      [participant(1, 10), participant(2, 5)],
      configuration,
    );
    const updated = calculatePrizeFund(
      [participant(1, 10), participant(2, 20), participant(3, 1)],
      { ...configuration, entryFeeMinorUnits: '20000' },
    );
    expect(original.winners[0].userId).toBe(1);
    expect(updated.winners[0]).toEqual(
      jasmine.objectContaining({ userId: 2, amountMinorUnits: 50000n }),
    );
    expect(formatPrizePercent(50000n, updated.totalMinorUnits, 'de')).toBe(
      '83,33 %',
    );
  });
  it('parses money without floating point and formats money and percentages', () => {
    expect(parseEntryFee('0.29')).toBe('29');
    expect(parseEntryFee('100,50')).toBe('10050');
    expect(formatMinorUnits(590000n, 'de')).toBe('5.900,00 UAH');
    expect(formatPrizePercent(1n, 3n, 'de')).toBe('33,33 %');
    for (const invalid of ['-1', '1.001', '1e3', '', '92233720368547758.08'])
      expect(parseEntryFee(invalid)).toBeNull();
  });
});
