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

export interface StandingRow extends Ranking {
  gamePoints: number;
  bonusPointsByRule: Record<string, number>;
}

export interface StandingsResponse {
  evaluatedBonusRules: EvaluatedBonusRule[];
  standings: StandingRow[];
}
