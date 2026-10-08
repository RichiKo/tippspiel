import {
  PrizeFundConfiguration,
  PrizeFundParticipant,
  PrizeFundResult,
  PrizeWinner,
} from '../types/prize-fund.interface';

export function calculatePrizeFund(
  participants: readonly PrizeFundParticipant[],
  configuration: PrizeFundConfiguration,
): PrizeFundResult {
  const { tieMode, prizeAmountsMinorUnits } = configuration.prizeFundRule;
  const totalMinorUnits =
    BigInt(configuration.entryFeeMinorUnits) * BigInt(participants.length);
  const sorted = [...participants].sort((a, b) => {
    const points = b.totalPoints - a.totalPoints;
    if (points !== 0 || tieMode === 'share_equal_points') return points;
    return (
      b.exactHits - a.exactHits ||
      b.goalDiffHits - a.goalDiffHits ||
      b.tendencyHits - a.tendencyHits
    );
  });

  const groups: PrizeFundParticipant[][] = [];
  for (const participant of sorted) {
    const last = groups[groups.length - 1];
    if (
      tieMode === 'share_equal_points' &&
      last?.[0].totalPoints === participant.totalPoints
    ) {
      last.push(participant);
    } else {
      if (groups.length === prizeAmountsMinorUnits.length) break;
      groups.push([participant]);
    }
  }

  const winners: PrizeWinner[] = [];
  groups.forEach((group, index) => {
    const prize = BigInt(prizeAmountsMinorUnits[index]);
    const groupSize = BigInt(group.length);
    group.forEach((participant, memberIndex) => {
      winners.push({
        place: index + 1,
        userId: participant.userId,
        username: participant.user.username,
        userImage: participant.user.image ?? null,
        amountMinorUnits:
          prize / groupSize +
          (BigInt(memberIndex) < prize % groupSize ? 1n : 0n),
      });
    });
  });
  return {
    totalMinorUnits,
    winners,
  };
}

export function parsePrizeAmount(value: string): string | null {
  const normalized = value.trim().replace(',', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  const [whole, fraction = ''] = normalized.split('.');
  const minorUnits = BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0'));
  return minorUnits.toString();
}

export function parseEntryFee(value: string): string | null {
  const amount = parsePrizeAmount(value);
  return amount !== null && BigInt(amount) <= 9223372036854775807n
    ? amount
    : null;
}

export function minorUnitsToInput(value: string): string {
  const amount = BigInt(value);
  return `${amount / 100n}.${(amount % 100n).toString().padStart(2, '0')}`;
}

function formatHundredths(amount: bigint, language: string): string {
  const locale = language === 'de' ? 'de-DE' : 'uk-UA';
  const formatter = new Intl.NumberFormat(locale);
  const decimal =
    new Intl.NumberFormat(locale)
      .formatToParts(1.1)
      .find((part) => part.type === 'decimal')?.value ?? '.';
  return `${formatter.format(amount / 100n)}${decimal}${(amount % 100n).toString().padStart(2, '0')}`;
}

export function formatMinorUnits(amount: bigint, language: string): string {
  return `${formatHundredths(amount, language)} UAH`;
}

export function formatPrizePercent(
  amount: bigint,
  total: bigint,
  language: string,
): string {
  const hundredths = total === 0n ? 0n : (amount * 10000n + total / 2n) / total;
  return `${formatHundredths(hundredths, language)} %`;
}
