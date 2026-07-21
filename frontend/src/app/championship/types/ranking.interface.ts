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
    image?: string | null;
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

export interface PointsBucket {
  count: number;
  ratio: number;
}

export interface RoundPoints {
  roundId: string;
  roundName: string;
  points: number;
}

export interface ChampionshipStatistics {
  championshipId: string;
  userId: number;
  totalMatches: number;
  playedMatches: number;
  participatedMatches: number;
  missedMatches: number;
  averagePointsPerRound: number;
  pointsByRound: RoundPoints[];
  pointsDistribution: {
    threePoints: PointsBucket;
    twoPoints: PointsBucket;
    onePoint: PointsBucket;
    zeroPoints: PointsBucket;
  };
  bestRound: RoundPoints | null;
  worstRound: RoundPoints | null;
}

export interface ChampionshipParticipantExtremum {
  userId: number;
  username: string;
  points: number;
}

export interface MostResultativeGame {
  gameId: string;
  roundName: string;
  kickoffTime: string;
  homeTeam: {
    id: string;
    name: string;
    logoUrl: string;
  };
  awayTeam: {
    id: string;
    name: string;
    logoUrl: string;
  };
  homeScore: number | null;
  awayScore: number | null;
  totalPoints: number;
  exactHits: number;
  goalDiffHits: number;
  tendencyHits: number;
}

export interface ChampionshipStatisticsParticipant {
  place: number;
  userId: number;
  username: string;
  totalPoints: number;
  participatedMatches: number;
  missedMatches: number;
  pointsDistribution: {
    threePoints: PointsBucket;
    twoPoints: PointsBucket;
    onePoint: PointsBucket;
    zeroPoints: PointsBucket;
  };
}

export interface ChampionshipAggregateStatistics {
  championshipId: string;
  totalMatches: number;
  playedMatches: number;
  participantsCount: number;
  participatedMatches: number;
  missedMatches: number;
  averagePointsPerRound: number;
  averagePointsPerParticipant: number;
  totalPointsAllParticipants: number;
  pointsByRound: RoundPoints[];
  pointsDistribution: {
    threePoints: PointsBucket;
    twoPoints: PointsBucket;
    onePoint: PointsBucket;
    zeroPoints: PointsBucket;
  };
  bestRound: RoundPoints | null;
  worstRound: RoundPoints | null;
  bestParticipant: ChampionshipParticipantExtremum | null;
  worstParticipant: ChampionshipParticipantExtremum | null;
  mostResultativeGame: MostResultativeGame | null;
  participants: ChampionshipStatisticsParticipant[];
}
