export interface Ranking {
  id: string;
  userId: number;
  championshipId: string;
  rank: number;
  exactHits: number;
  goalDiffHits: number;
  tendencyHits: number;
  missedTips: number;
  totalPoints: number;
  bonusPoints: number;
  updatedAt: Date;
  user: {
    id: number;
    username: string;
    email: string;
  };
}

export interface EvaluatedBonusRule {
  id: string;
  name: string;
}

export type BonusColumnSubrule = 'single' | 'finalist' | 'champion';

export interface BonusColumn {
  key: string;
  ruleId: string;
  subrule: BonusColumnSubrule;
  label: string;
}

export interface StandingRow extends Ranking {
  gamePoints: number;
  bonusPointsByRule: Record<string, number>;
  bonusPointsByColumn: Record<string, number>;
}

export interface StandingsResponse {
  evaluatedBonusRules: EvaluatedBonusRule[];
  bonusColumns: BonusColumn[];
  standings: StandingRow[];
}
