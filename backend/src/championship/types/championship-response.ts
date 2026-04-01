import { ChampionshipEntity } from '../championship.entity';

export interface ChampionshipResponseInterface {
  championship: ChampionshipEntity;
}

export type CurrentRoundTipLabelStatus =
  | 'missing_all'
  | 'missing_some'
  | 'all_tipped';

export interface CurrentRoundTipLabelDto {
  status: CurrentRoundTipLabelStatus;
  currentRoundId: string;
  currentRoundName: string;
  totalGamesCount: number;
  tippedGamesCount: number;
  missingGamesCount: number;
}

export type ChampionshipCardResponseDto = ChampionshipEntity & {
  currentRoundTipLabel: CurrentRoundTipLabelDto | null;
};
