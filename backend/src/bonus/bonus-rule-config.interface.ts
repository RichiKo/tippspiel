export interface ChampionConfig {
  championPoints: number;
}

export interface ChampionFinalistConfig {
  finalistPoints: number;
  championPoints: number;
}

export type BonusRuleConfig = ChampionConfig | ChampionFinalistConfig;
