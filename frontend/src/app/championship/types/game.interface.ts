import { Team } from '../../teams/types/team.interface';
import { Round } from './round.interface';

export interface Game {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  kickoffTime: Date;
  roundId: string;
  homeScore: number | null;
  awayScore: number | null;
  isClosed: boolean;
  createdAt: Date;
  round?: Round;
  homeTeam?: Team;
  awayTeam?: Team;
}

export interface CreateGameDto {
  homeTeamId: string;
  awayTeamId: string;
  kickoffTime: Date;
}

export interface UpdateGameDto {
  homeTeamId?: string;
  awayTeamId?: string;
  kickoffTime?: Date;
}

export interface UpdateGameResultDto {
  homeScore: number;
  awayScore: number;
  isClosed?: boolean;
}
