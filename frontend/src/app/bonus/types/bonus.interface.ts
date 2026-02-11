export enum BonusRuleType {
  CHAMPION = 'champion',
  CHAMPION_FINALIST = 'champion_finalist',
}

export enum BonusRuleStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  LOCKED = 'locked',
  PARTIALLY_EVALUATED = 'partially_evaluated',
  EVALUATED = 'evaluated',
}

export interface ChampionConfig {
  championPoints: number;
}

export interface ChampionFinalistConfig {
  finalistPoints: number;
  championPoints: number;
}

export type BonusRuleConfig = ChampionConfig | ChampionFinalistConfig;

export interface BonusRule {
  id: string;
  championshipId: string;
  type: BonusRuleType;
  name: string;
  config: BonusRuleConfig;
  deadline: string;
  status: BonusRuleStatus;
  createdAt: string;
  updatedAt: string;
  picks?: BonusPick[];
  evaluations?: BonusEvaluation[];
}

export interface BonusPick {
  id: string;
  bonusRuleId: string;
  userId: number;
  teamId: string;
  team?: {
    id: string;
    name: string;
    shortName: string;
    logoUrl: string;
  };
  user?: {
    id: number;
    username: string;
    email: string;
    image: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface BonusEvaluation {
  id: string;
  bonusRuleId: string;
  userId: number;
  subrule: string;
  points: number;
  createdAt: string;
  user?: {
    id: number;
    username: string;
  };
}

export interface CreateBonusRuleDto {
  championshipId: string;
  type: BonusRuleType;
  name: string;
  config: BonusRuleConfig;
  deadline: string;
}

export interface UpdateBonusRuleDto {
  name?: string;
  config?: BonusRuleConfig;
  deadline?: string;
}

export interface CreateBonusPickDto {
  teamId: string;
}

export interface EvaluateBonusDto {
  championTeamId?: string;
  finalistTeamIds?: string[];
}

export interface EvaluateBonusResponse {
  evaluationsCreated: number;
}

export interface EvaluationResult {
  phase: 'none' | 'finalists_done' | 'complete';
  championTeamId?: string;
  finalistTeamIds: string[];
}
