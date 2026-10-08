import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpdatePrizeFundDto } from './update-prize-fund.dto';

describe('UpdatePrizeFundDto', () => {
  const payload = {
    entryFeeMinorUnits: '50000',
    prizeFundRule: {
      tieMode: 'share_equal_points',
      prizeAmountsMinorUnits: ['150000', '100000', '50000'],
    },
  };
  it('accepts explicit ordered amounts and variable place counts', async () => {
    for (const count of [1, 2, 3, 4]) {
      expect(
        await validate(
          plainToInstance(UpdatePrizeFundDto, {
            ...payload,
            prizeFundRule: {
              ...payload.prizeFundRule,
              prizeAmountsMinorUnits: Array(count).fill('50000'),
            },
          }),
        ),
      ).toHaveLength(0);
    }
  });
  it.each(['-1', '1.5', '', '1e4', '00', 10000, null])(
    'rejects invalid entry fees %p',
    async (entryFeeMinorUnits) => {
      expect(
        await validate(
          plainToInstance(UpdatePrizeFundDto, {
            ...payload,
            entryFeeMinorUnits,
          }),
        ),
      ).not.toHaveLength(0);
    },
  );
  it.each([
    [],
    null,
    '50000',
    ['-1'],
    ['1.5'],
    [''],
    ['1e4'],
    ['00'],
    [50000],
    [null],
  ])('rejects invalid prize arrays %p', async (prizeAmountsMinorUnits) => {
    expect(
      await validate(
        plainToInstance(UpdatePrizeFundDto, {
          ...payload,
          prizeFundRule: { ...payload.prizeFundRule, prizeAmountsMinorUnits },
        }),
      ),
    ).not.toHaveLength(0);
  });
  it('accepts zero-valued prizes and an amount greater than the entry fee without fund validation', async () => {
    expect(
      await validate(
        plainToInstance(UpdatePrizeFundDto, {
          ...payload,
          entryFeeMinorUnits: '0',
          prizeFundRule: {
            ...payload.prizeFundRule,
            prizeAmountsMinorUnits: ['0', '50000'],
          },
        }),
      ),
    ).toHaveLength(0);
  });

  it('accepts fixed prizes larger than bigint because they are stored as JSONB decimal strings', async () => {
    expect(
      await validate(
        plainToInstance(UpdatePrizeFundDto, {
          ...payload,
          prizeFundRule: {
            ...payload.prizeFundRule,
            prizeAmountsMinorUnits: ['18446744073709551614'],
          },
        }),
      ),
    ).toHaveLength(0);
  });
  it.each([null, {}, { ...payload.prizeFundRule, tieMode: 'unknown' }])(
    'rejects missing or invalid rules %p',
    async (prizeFundRule) => {
      expect(
        await validate(
          plainToInstance(UpdatePrizeFundDto, { ...payload, prizeFundRule }),
        ),
      ).not.toHaveLength(0);
    },
  );
});
