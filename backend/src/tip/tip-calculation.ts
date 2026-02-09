import { TipOutcome } from './tip-outcome.enum';

export interface TipOutcomeResult {
  points: 0 | 1 | 2 | 3;
  outcomeType: TipOutcome;
}

export function computeTipOutcome(
  tipHomeGoals: number,
  tipAwayGoals: number,
  resultHomeGoals: number,
  resultAwayGoals: number,
): TipOutcomeResult {
  if (tipHomeGoals === resultHomeGoals && tipAwayGoals === resultAwayGoals) {
    return { points: 3, outcomeType: TipOutcome.EXACT };
  }

  const tipDiff = tipHomeGoals - tipAwayGoals;
  const resultDiff = resultHomeGoals - resultAwayGoals;

  if (tipDiff === resultDiff) {
    return { points: 2, outcomeType: TipOutcome.GOAL_DIFF };
  }

  const tipTendency = Math.sign(tipDiff);
  const resultTendency = Math.sign(resultDiff);

  if (tipTendency === resultTendency) {
    return { points: 1, outcomeType: TipOutcome.TENDENCY };
  }

  return { points: 0, outcomeType: TipOutcome.MISSED };
}
