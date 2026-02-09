export interface ChampionConfig {
  championPoints: number;
}

export interface ChampionFinalistConfig {
  finalistPoints: number;
  championPoints: number;
  selectedFinalistTeamIds?: string[];
  selectedChampionTeamId?: string;
}

export type BonusRuleConfig = ChampionConfig | ChampionFinalistConfig;
