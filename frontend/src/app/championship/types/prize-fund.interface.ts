export type PrizeFundTieMode = 'share_equal_points' | 'tie_breakers';

export interface PrizeFundConfiguration {
  entryFeeMinorUnits: string;
  prizeFundRule: {
    tieMode: PrizeFundTieMode;
    prizeAmountsMinorUnits: string[];
  };
}

export interface PrizeFundParticipant {
  userId: number;
  totalPoints: number;
  exactHits: number;
  goalDiffHits: number;
  tendencyHits: number;
  user: { username: string; image?: string | null };
}

export interface PrizeWinner {
  place: number;
  userId: number;
  username: string;
  userImage: string | null;
  amountMinorUnits: bigint;
}

export interface PrizeFundResult {
  totalMinorUnits: bigint;
  winners: PrizeWinner[];
}
