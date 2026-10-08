export type PrizeFundTieMode = 'share_equal_points' | 'tie_breakers';

export interface PrizeFundRule {
  tieMode: PrizeFundTieMode;
  prizeAmountsMinorUnits: string[];
}

export interface PrizeFundConfiguration {
  entryFeeMinorUnits: string;
  prizeFundRule: PrizeFundRule;
}
