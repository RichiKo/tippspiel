export type CurrentRoundTipLabelStatus =
  | 'missing_all'
  | 'missing_some'
  | 'all_tipped';

export interface CurrentRoundTipLabel {
  status: CurrentRoundTipLabelStatus;
  currentRoundId: string;
  currentRoundName: string;
  totalGamesCount: number;
  tippedGamesCount: number;
  missingGamesCount: number;
}

export interface RoundPredictionProgress {
  roundId: string;
  roundName: string;
  isRoundActive: boolean;
  totalUsers: number;
  totalMatchesInRound: number;
  totalPossiblePredictions: number;
  submittedPredictions: number;
  progressPercent: number;
}

export interface Championship {
  id: string;
  name: string;
  description?: string;
  image: string;
  isPublic: boolean;
  isActive: boolean;
  eliminatedTeamIds?: string[];
  currentRoundTipLabel?: CurrentRoundTipLabel | null;
  roundPredictionProgress?: RoundPredictionProgress[];
  createdByUserId: string;
  createdAt: Date;
  updatedAt: Date;
}
